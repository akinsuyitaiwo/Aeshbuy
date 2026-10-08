-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MerchantMemberRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "MerchantMemberStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "MerchantStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMPTZ(6),
    "approvedAt" TIMESTAMPTZ(6),
    "suspendedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantMember" (
    "merchantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MerchantMemberRole" NOT NULL,
    "status" "MerchantMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MerchantMember_pkey" PRIMARY KEY ("merchantId","userId")
);

-- CreateTable
CREATE TABLE "MerchantDocument" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MerchantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantBankAccount" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MerchantBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantAgreement" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedBy" UUID NOT NULL,
    "acceptedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "MerchantAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantCommercialRule" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "commissionRate" DECIMAL(7,4) NOT NULL,
    "settlementDelayDays" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMPTZ(6) NOT NULL,
    "effectiveTo" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantCommercialRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantReview" (
    "id" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "fromStatus" "MerchantStatus" NOT NULL,
    "toStatus" "MerchantStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Merchant_status_createdAt_idx" ON "Merchant"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MerchantMember_userId_status_idx" ON "MerchantMember"("userId", "status");

-- CreateIndex
CREATE INDEX "MerchantDocument_merchantId_status_idx" ON "MerchantDocument"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantDocument_merchantId_type_key" ON "MerchantDocument"("merchantId", "type");

-- CreateIndex
CREATE INDEX "MerchantBankAccount_merchantId_status_idx" ON "MerchantBankAccount"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantBankAccount_merchantId_accountNumber_key" ON "MerchantBankAccount"("merchantId", "accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAgreement_merchantId_version_key" ON "MerchantAgreement"("merchantId", "version");

-- CreateIndex
CREATE INDEX "MerchantCommercialRule_merchantId_effectiveFrom_idx" ON "MerchantCommercialRule"("merchantId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "MerchantReview_merchantId_createdAt_idx" ON "MerchantReview"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_createdAt_idx" ON "AuditLog"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "MerchantMember" ADD CONSTRAINT "MerchantMember_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantMember" ADD CONSTRAINT "MerchantMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDocument" ADD CONSTRAINT "MerchantDocument_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantBankAccount" ADD CONSTRAINT "MerchantBankAccount_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAgreement" ADD CONSTRAINT "MerchantAgreement_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantCommercialRule" ADD CONSTRAINT "MerchantCommercialRule_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantReview" ADD CONSTRAINT "MerchantReview_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantReview" ADD CONSTRAINT "MerchantReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
