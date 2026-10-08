import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { AuthService, type TokenPair } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a customer and create a session' })
  register(@Body() dto: RegisterDto, @Req() request: Request): Promise<TokenPair> {
    return this.auth.register(dto, this.metadata(request));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and create a session' })
  login(@Body() dto: LoginDto, @Req() request: Request): Promise<TokenPair> {
    return this.auth.login(dto, this.metadata(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token and issue a new access token' })
  refresh(@Body() dto: RefreshDto): Promise<TokenPair> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the session belonging to a refresh token' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.auth.verifyEmail(dto.token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.auth.forgotPassword(dto);
    return { message: 'If the account exists, password reset instructions will be sent' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  getMe(@CurrentUser() user: AuthUser): ReturnType<AuthService['getMe']> {
    return this.auth.getMe(user.id);
  }

  @Get('sessions')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  getSessions(@CurrentUser() user: AuthUser): ReturnType<AuthService['getSessions']> {
    return this.auth.getSessions(user.id);
  }

  @Delete('sessions/:id')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.auth.revokeSession(user.id, id);
  }

  @Delete('account')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateAccount(@CurrentUser() user: AuthUser): Promise<void> {
    await this.auth.deactivateAccount(user.id);
  }

  private metadata(request: Request): { ipAddress?: string; userAgent?: string } {
    return { ipAddress: request.ip, userAgent: request.header('user-agent') };
  }
}
