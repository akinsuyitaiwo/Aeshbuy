import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MerchantMemberRole, MerchantStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMerchantDto {
  @ApiProperty({ example: 'Aesh Stores Limited' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  legalName!: string;
  @ApiProperty({ example: 'Aesh Stores' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  tradingName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) taxId?: string;
  @ApiProperty({ example: 'merchant@example.com' }) @IsEmail() email!: string;
  @ApiProperty({ example: '+2348012345678' }) @IsString() @MaxLength(30) phone!: string;
}

export class UpdateMerchantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) legalName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  tradingName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) taxId?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string;
}

export class AddMerchantMemberDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiProperty({ enum: MerchantMemberRole }) @IsEnum(MerchantMemberRole) role!: MerchantMemberRole;
}

export class CreateDocumentUploadDto {
  @ApiProperty({ example: 'CAC_CERTIFICATE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  type!: string;
  @ApiProperty({ example: 'cac.pdf' }) @IsString() @IsNotEmpty() @MaxLength(180) fileName!: string;
  @ApiProperty({ example: 'application/pdf' }) @IsMimeType() contentType!: string;
}

export class AddBankAccountDto {
  @ApiProperty({ example: '058' }) @IsString() @IsNotEmpty() @MaxLength(12) bankCode!: string;
  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  accountNumber!: string;
  @ApiProperty({ example: 'AESH STORES LTD' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  accountName!: string;
}

export class AcceptAgreementDto {
  @ApiProperty({ example: '2026-01' }) @IsString() @IsNotEmpty() @MaxLength(40) version!: string;
}

export class ReviewMerchantDto {
  @ApiProperty({
    enum: [MerchantStatus.APPROVED, MerchantStatus.REJECTED, MerchantStatus.SUSPENDED],
  })
  @IsEnum(MerchantStatus)
  status!: MerchantStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) reason?: string;
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  settlementDelayDays?: number;
}

export class MerchantReviewQueryDto {
  @ApiPropertyOptional({ enum: MerchantStatus })
  @IsOptional()
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;
}
