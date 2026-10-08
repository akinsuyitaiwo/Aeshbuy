import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;
}

export class CreateAddressDto {
  @IsString()
  @Length(1, 40)
  label!: string;

  @IsString()
  @Length(1, 160)
  recipient!: string;

  @Matches(/^\+[1-9]\d{7,14}$/)
  phone!: string;

  @IsString()
  @Length(3, 200)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @Length(2, 100)
  city!: string;

  @IsString()
  @Length(2, 100)
  state!: string;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
