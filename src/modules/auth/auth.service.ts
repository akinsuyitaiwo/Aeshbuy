import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, RoleCode, type UserSession } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

interface ClientMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

const authUserInclude = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
  customerProfile: true,
} satisfies Prisma.UserInclude;

type AuthUserView = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    status: true;
    emailVerifiedAt: true;
    createdAt: true;
    customerProfile: true;
    roles: { select: { role: { select: { code: true } } } };
  };
}>;

type SessionView = Pick<
  UserSession,
  'id' | 'userAgent' | 'ipAddress' | 'lastUsedAt' | 'expiresAt' | 'revokedAt' | 'createdAt'
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, metadata: ClientMetadata): Promise<TokenPair> {
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const verificationToken = this.createOpaqueToken();
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const customerRole = await tx.role.upsert({
          where: { code: RoleCode.CUSTOMER },
          create: { code: RoleCode.CUSTOMER, description: 'Customer platform role' },
          update: {},
        });
        const created = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            roles: { create: { roleId: customerRole.id } },
            customerProfile: {
              create: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                phone: dto.phone,
              },
            },
          },
          include: authUserInclude,
        });
        await tx.emailVerificationToken.create({
          data: {
            userId: created.id,
            tokenHash: this.hashToken(verificationToken),
            expiresAt: this.hoursFromNow(
              this.config.get<number>('EMAIL_VERIFICATION_TTL_HOURS', 24),
            ),
          },
        });
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'User',
            aggregateId: created.id,
            eventType: 'user.registered',
            payload: { userId: created.id, email: created.email, verificationToken },
          },
        });
        return created;
      });
      return this.createSession(user.id, metadata);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto, metadata: ClientMetadata): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.createSession(user.id, metadata);
  }

  async refresh(rawToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawToken);
    const nextRawToken = this.createOpaqueToken();
    let compromisedSessionId: string | undefined;
    let result: { userId: string; sessionId: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const current = await tx.refreshToken.findUnique({
          where: { tokenHash },
          include: { session: { include: { user: true } } },
        });
        if (
          !current ||
          current.expiresAt <= new Date() ||
          current.session.expiresAt <= new Date()
        ) {
          throw new UnauthorizedException('Invalid or expired refresh token');
        }
        compromisedSessionId = current.sessionId;
        if (current.revokedAt || current.session.revokedAt) {
          throw new UnauthorizedException('Refresh token reuse detected');
        }
        if (current.session.user.status !== 'ACTIVE') {
          throw new UnauthorizedException('Account is not active');
        }
        const next = await tx.refreshToken.create({
          data: {
            sessionId: current.sessionId,
            tokenHash: this.hashToken(nextRawToken),
            expiresAt: current.session.expiresAt,
          },
        });
        const consumed = await tx.refreshToken.updateMany({
          where: { id: current.id, revokedAt: null, replacedById: null },
          data: { revokedAt: new Date(), replacedById: next.id },
        });
        if (consumed.count !== 1) throw new UnauthorizedException('Refresh token reuse detected');
        await tx.userSession.update({
          where: { id: current.sessionId },
          data: { lastUsedAt: new Date() },
        });
        return { userId: current.session.userId, sessionId: current.sessionId };
      });
    } catch (error) {
      if (error instanceof UnauthorizedException && compromisedSessionId) {
        await this.prisma.userSession.updateMany({
          where: { id: compromisedSessionId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw error;
    }
    return {
      accessToken: await this.signAccessToken(result.userId, result.sessionId),
      refreshToken: nextRawToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    };
  }

  async logout(rawToken: string): Promise<void> {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });
    if (!current) return;
    await this.prisma.userSession.updateMany({
      where: { id: current.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new UnprocessableEntityException('Invalid or expired verification token');
    }
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new UnprocessableEntityException('Invalid or expired verification token');
      }
      await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date() },
      });
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.status !== 'ACTIVE') return;
    const rawToken = this.createOpaqueToken();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(rawToken),
          expiresAt: this.minutesFromNow(this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 30)),
        },
      }),
      this.prisma.outboxEvent.create({
        data: {
          aggregateType: 'User',
          aggregateId: user.id,
          eventType: 'user.password-reset-requested',
          payload: { userId: user.id, email: user.email, resetToken: rawToken },
        },
      }),
    ]);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const token = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });
    if (!token || token.usedAt || token.expiresAt <= new Date()) {
      throw new UnprocessableEntityException('Invalid or expired reset token');
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new UnprocessableEntityException('Invalid or expired reset token');
      }
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await tx.userSession.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  async getMe(userId: string): Promise<AuthUserView> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        customerProfile: true,
        roles: { select: { role: { select: { code: true } } } },
      },
    });
  }

  async getSessions(userId: string): Promise<SessionView[]> {
    return this.prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) throw new UnprocessableEntityException('Session not found or revoked');
  }

  async deactivateAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { status: 'DEACTIVATED' } });
      await tx.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'User',
          aggregateId: userId,
          eventType: 'user.deactivated',
          payload: { userId },
        },
      });
    });
  }

  private async createSession(userId: string, metadata: ClientMetadata): Promise<TokenPair> {
    const refreshToken = this.createOpaqueToken();
    const expiresAt = new Date(
      Date.now() + this.config.get<number>('REFRESH_TOKEN_TTL_DAYS', 30) * 86_400_000,
    );
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        expiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent?.slice(0, 512),
        refreshTokens: { create: { tokenHash: this.hashToken(refreshToken), expiresAt } },
      },
    });
    return {
      accessToken: await this.signAccessToken(userId, session.id),
      refreshToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    };
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, sid: sessionId, type: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as never,
      },
    );
  }

  private createOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hoursFromNow(hours: number): Date {
    return new Date(Date.now() + hours * 3_600_000);
  }

  private minutesFromNow(minutes: number): Date {
    return new Date(Date.now() + minutes * 60_000);
  }
}
