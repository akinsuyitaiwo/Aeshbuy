/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  AcceptAgreementDto,
  AddBankAccountDto,
  AddMerchantMemberDto,
  CreateDocumentUploadDto,
  CreateMerchantDto,
  MerchantReviewQueryDto,
  ReviewMerchantDto,
  UpdateMerchantDto,
} from './dto/merchant.dto';
import { MerchantsService } from './merchants.service';

@ApiTags('merchants')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a merchant application' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMerchantDto) {
    return this.merchants.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current user merchant memberships' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.merchants.listMine(user.id);
  }

  @Get(':id') get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.merchants.get(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    return this.merchants.update(user.id, id, dto);
  }
  @Post(':id/members') addMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddMerchantMemberDto,
  ) {
    return this.merchants.addMember(user.id, id, dto);
  }
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') memberId: string,
  ) {
    return this.merchants.removeMember(user.id, id, memberId);
  }
  @Post(':id/documents/upload') createDocumentUpload(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateDocumentUploadDto,
  ) {
    return this.merchants.createDocumentUpload(user.id, id, dto);
  }
  @Post(':id/bank-accounts') addBankAccount(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddBankAccountDto,
  ) {
    return this.merchants.addBankAccount(user.id, id, dto);
  }
  @Post(':id/agreements') acceptAgreement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AcceptAgreementDto,
    @Req() request: Request,
  ) {
    return this.merchants.acceptAgreement(user.id, id, dto, request.ip);
  }
  @Post(':id/submit') submit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.merchants.submit(user.id, id);
  }
}

@ApiTags('admin-merchants')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, PermissionsGuard)
@Permissions('merchants.review')
@Controller('admin/merchants')
export class MerchantAdminController {
  constructor(private readonly merchants: MerchantsService) {}

  @Get()
  list(@Query() query: MerchantReviewQueryDto) {
    return this.merchants.listForReview(query.status);
  }

  @Post(':id/review')
  review(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewMerchantDto) {
    return this.merchants.review(user.id, id, dto);
  }
}
