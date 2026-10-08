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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { CustomerAddress, CustomerProfile } from '@prisma/client';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CustomersService } from './customers.service';
import { CreateAddressDto, UpdateAddressDto, UpdateCustomerProfileDto } from './dto/customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('customers/me')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  getProfile(
    @CurrentUser() user: AuthUser,
  ): Promise<CustomerProfile & { addresses: CustomerAddress[] }> {
    return this.customers.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfile> {
    return this.customers.updateProfile(user.id, dto);
  }

  @Post('addresses')
  createAddress(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAddressDto,
  ): Promise<CustomerAddress> {
    return this.customers.createAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<CustomerAddress> {
    return this.customers.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.customers.deleteAddress(user.id, id);
  }
}
