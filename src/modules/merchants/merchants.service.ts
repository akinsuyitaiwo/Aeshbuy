/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MerchantMemberRole,
  MerchantMemberStatus,
  MerchantStatus,
  Prisma,
  RoleCode,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import type {
  AcceptAgreementDto,
  AddBankAccountDto,
  AddMerchantMemberDto,
  CreateDocumentUploadDto,
  CreateMerchantDto,
  ReviewMerchantDto,
  UpdateMerchantDto,
} from './dto/merchant.dto';
import {
  BANK_VERIFICATION,
  type BankVerificationProvider,
  DOCUMENT_STORAGE,
  type DocumentStorageProvider,
} from './providers/merchant-providers';

const merchantInclude = {
  members: { where: { status: MerchantMemberStatus.ACTIVE }, select: { userId: true, role: true } },
  documents: true,
  bankAccounts: true,
  agreements: true,
  commercialRules: { where: { effectiveTo: null }, orderBy: { effectiveFrom: 'desc' as const } },
} satisfies Prisma.MerchantInclude;

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorageProvider,
    @Inject(BANK_VERIFICATION) private readonly bankVerification: BankVerificationProvider,
  ) {}

  async create(userId: string, dto: CreateMerchantDto) {
    return this.prisma.$transaction(async (tx) => {
      const merchantRole = await tx.role.upsert({
        where: { code: RoleCode.MERCHANT },
        create: { code: RoleCode.MERCHANT, description: 'Merchant platform role' },
        update: {},
      });
      const merchant = await tx.merchant.create({
        data: {
          legalName: dto.legalName.trim(),
          tradingName: dto.tradingName.trim(),
          registrationNumber: dto.registrationNumber?.trim(),
          taxId: dto.taxId?.trim(),
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          members: { create: { userId, role: MerchantMemberRole.OWNER } },
        },
        include: merchantInclude,
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: merchantRole.id } },
        create: { userId, roleId: merchantRole.id },
        update: {},
      });
      await this.audit(tx, userId, 'merchant.created', merchant.id);
      return merchant;
    });
  }

  listMine(userId: string) {
    return this.prisma.merchant.findMany({
      where: { members: { some: { userId, status: MerchantMemberStatus.ACTIVE } } },
      include: merchantInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, merchantId: string) {
    await this.requireMember(userId, merchantId);
    return this.prisma.merchant.findUniqueOrThrow({
      where: { id: merchantId },
      include: merchantInclude,
    });
  }

  async update(userId: string, merchantId: string, dto: UpdateMerchantDto) {
    await this.requireManager(userId, merchantId);
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('Merchant not found');
    if (merchant.status !== MerchantStatus.DRAFT && merchant.status !== MerchantStatus.REJECTED)
      throw new ConflictException('Only draft or rejected merchants can be edited');
    return this.prisma.merchant.update({
      where: { id: merchantId },
      data: dto,
      include: merchantInclude,
    });
  }

  async addMember(userId: string, merchantId: string, dto: AddMerchantMemberDto) {
    await this.requireManager(userId, merchantId);
    if (dto.role === MerchantMemberRole.OWNER)
      throw new BadRequestException('Ownership transfer is not supported');
    const target = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!target) throw new NotFoundException('User not found');
    return this.prisma.merchantMember.upsert({
      where: { merchantId_userId: { merchantId, userId: dto.userId } },
      create: { merchantId, userId: dto.userId, role: dto.role },
      update: { role: dto.role, status: MerchantMemberStatus.ACTIVE },
    });
  }

  async removeMember(userId: string, merchantId: string, memberId: string): Promise<void> {
    await this.requireManager(userId, merchantId);
    const member = await this.prisma.merchantMember.findUnique({
      where: { merchantId_userId: { merchantId, userId: memberId } },
    });
    if (!member) throw new NotFoundException('Merchant member not found');
    if (member.role === MerchantMemberRole.OWNER)
      throw new BadRequestException('The merchant owner cannot be removed');
    await this.prisma.merchantMember.update({
      where: { merchantId_userId: { merchantId, userId: memberId } },
      data: { status: MerchantMemberStatus.REVOKED },
    });
  }

  async createDocumentUpload(userId: string, merchantId: string, dto: CreateDocumentUploadDto) {
    await this.requireManager(userId, merchantId);
    const grant = await this.storage.createUploadGrant(merchantId, dto.fileName, dto.contentType);
    const document = await this.prisma.merchantDocument.upsert({
      where: { merchantId_type: { merchantId, type: dto.type } },
      create: {
        merchantId,
        type: dto.type,
        fileName: dto.fileName,
        contentType: dto.contentType,
        objectKey: grant.objectKey,
      },
      update: {
        fileName: dto.fileName,
        contentType: dto.contentType,
        objectKey: grant.objectKey,
        status: 'PENDING',
      },
    });
    return { document, upload: grant };
  }

  async addBankAccount(userId: string, merchantId: string, dto: AddBankAccountDto) {
    await this.requireManager(userId, merchantId);
    const verification = await this.bankVerification.startVerification(
      dto.bankCode,
      dto.accountNumber,
      dto.accountName,
    );
    return this.prisma.merchantBankAccount.upsert({
      where: { merchantId_accountNumber: { merchantId, accountNumber: dto.accountNumber } },
      create: { merchantId, ...dto, providerRef: verification.providerRef },
      update: {
        bankCode: dto.bankCode,
        accountName: dto.accountName,
        providerRef: verification.providerRef,
        status: 'PENDING',
      },
    });
  }

  async acceptAgreement(
    userId: string,
    merchantId: string,
    dto: AcceptAgreementDto,
    ipAddress?: string,
  ) {
    await this.requireManager(userId, merchantId);
    return this.prisma.merchantAgreement.upsert({
      where: { merchantId_version: { merchantId, version: dto.version } },
      create: { merchantId, version: dto.version, acceptedBy: userId, ipAddress },
      update: {},
    });
  }

  async submit(userId: string, merchantId: string) {
    await this.requireManager(userId, merchantId);
    return this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
        include: { documents: true, bankAccounts: true, agreements: true },
      });
      if (!merchant) throw new NotFoundException('Merchant not found');
      if (merchant.status !== MerchantStatus.DRAFT && merchant.status !== MerchantStatus.REJECTED)
        throw new ConflictException('Merchant cannot be submitted from its current status');
      if (
        !merchant.registrationNumber ||
        !merchant.taxId ||
        !merchant.documents.length ||
        !merchant.bankAccounts.length ||
        !merchant.agreements.length
      ) {
        throw new BadRequestException(
          'Registration number, tax ID, document, bank account and agreement are required',
        );
      }
      const updated = await tx.merchant.update({
        where: { id: merchantId },
        data: { status: MerchantStatus.SUBMITTED, submittedAt: new Date(), rejectionReason: null },
        include: merchantInclude,
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Merchant',
          aggregateId: merchantId,
          eventType: 'merchant.submitted',
          payload: { merchantId },
        },
      });
      await this.audit(tx, userId, 'merchant.submitted', merchantId);
      return updated;
    });
  }

  async listForReview(status?: MerchantStatus) {
    return this.prisma.merchant.findMany({
      where: status ? { status } : undefined,
      include: merchantInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(reviewerId: string, merchantId: string, dto: ReviewMerchantDto) {
    if (
      dto.status !== MerchantStatus.APPROVED &&
      dto.status !== MerchantStatus.REJECTED &&
      dto.status !== MerchantStatus.SUSPENDED
    )
      throw new BadRequestException('Unsupported review status');
    if (dto.status === MerchantStatus.REJECTED && !dto.reason?.trim())
      throw new BadRequestException('A rejection reason is required');
    if (
      dto.status === MerchantStatus.APPROVED &&
      (dto.commissionRate === undefined || dto.settlementDelayDays === undefined)
    )
      throw new BadRequestException('Commercial terms are required for approval');
    return this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUnique({ where: { id: merchantId } });
      if (!merchant) throw new NotFoundException('Merchant not found');
      if (dto.status !== MerchantStatus.SUSPENDED && merchant.status !== MerchantStatus.SUBMITTED)
        throw new ConflictException('Only submitted merchants can be approved or rejected');
      if (dto.status === MerchantStatus.SUSPENDED && merchant.status !== MerchantStatus.APPROVED)
        throw new ConflictException('Only approved merchants can be suspended');
      const now = new Date();
      const updated = await tx.merchant.update({
        where: { id: merchantId },
        data: {
          status: dto.status,
          rejectionReason: dto.status === MerchantStatus.REJECTED ? dto.reason : null,
          approvedAt: dto.status === MerchantStatus.APPROVED ? now : merchant.approvedAt,
          suspendedAt: dto.status === MerchantStatus.SUSPENDED ? now : null,
        },
      });
      if (dto.status === MerchantStatus.APPROVED) {
        await tx.merchantCommercialRule.updateMany({
          where: { merchantId, effectiveTo: null },
          data: { effectiveTo: now },
        });
        await tx.merchantCommercialRule.create({
          data: {
            merchantId,
            commissionRate: new Prisma.Decimal(dto.commissionRate!),
            settlementDelayDays: dto.settlementDelayDays!,
            effectiveFrom: now,
          },
        });
      }
      await tx.merchantReview.create({
        data: {
          merchantId,
          reviewerId,
          fromStatus: merchant.status,
          toStatus: dto.status,
          reason: dto.reason,
        },
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'Merchant',
          aggregateId: merchantId,
          eventType: `merchant.${dto.status.toLowerCase()}`,
          payload: { merchantId, status: dto.status },
        },
      });
      await this.audit(tx, reviewerId, `merchant.${dto.status.toLowerCase()}`, merchantId, {
        reason: dto.reason,
      });
      return updated;
    });
  }

  private async requireMember(userId: string, merchantId: string) {
    const member = await this.prisma.merchantMember.findFirst({
      where: { merchantId, userId, status: MerchantMemberStatus.ACTIVE },
    });
    if (!member) throw new NotFoundException('Merchant not found');
    return member;
  }

  private async requireManager(userId: string, merchantId: string) {
    const member = await this.requireMember(userId, merchantId);
    if (member.role !== MerchantMemberRole.OWNER && member.role !== MerchantMemberRole.ADMIN)
      throw new ForbiddenException('Merchant manager access required');
    return member;
  }

  private audit(
    tx: Prisma.TransactionClient,
    actorId: string,
    action: string,
    resourceId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return tx.auditLog.create({
      data: { actorId, action, resourceType: 'Merchant', resourceId, metadata },
    });
  }
}
