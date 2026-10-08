import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { PrismaService } from '../../database/prisma/prisma.service';

interface AccessTokenPayload {
  sub: string;
  sid: string;
  type: 'access';
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Access token required');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(header.slice(7), {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    if (payload.type !== 'access') throw new UnauthorizedException('Invalid access token');

    const session = await this.prisma.userSession.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: 'ACTIVE' },
      },
      include: {
        user: {
          include: {
            roles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });
    if (!session) throw new UnauthorizedException('Session is no longer active');

    const roles = session.user.roles.map(({ role }) => role.code);
    const permissions = [
      ...new Set(
        session.user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code),
        ),
      ),
    ];
    request.user = {
      id: session.user.id,
      sessionId: session.id,
      email: session.user.email,
      roles,
      permissions,
    };
    return true;
  }
}
