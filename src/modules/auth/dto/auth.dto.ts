import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export class RegisterDto {
  @ApiProperty({ example: 'customer@example.test' })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 12, example: 'Strong-Test-Pass1!' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(passwordPattern, { message: 'password must include upper, lower, number and symbol' })
  password!: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  @Length(1, 80)
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @Length(1, 80)
  lastName!: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/)
  phone?: string;
}

export class LoginDto {
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(32)
  refreshToken!: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(32)
  token!: string;
}

export class ForgotPasswordDto {
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(passwordPattern, { message: 'password must include upper, lower, number and symbol' })
  password!: string;
}
