import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type CustomerAddress, type CustomerProfile } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import type {
  CreateAddressDto,
  UpdateAddressDto,
  UpdateCustomerProfileDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  getProfile(
    userId: string,
  ): Prisma.Prisma__CustomerProfileClient<CustomerProfile & { addresses: CustomerAddress[] }> {
    return this.prisma.customerProfile.findUniqueOrThrow({
      where: { userId },
      include: { addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] } },
    });
  }

  updateProfile(
    userId: string,
    dto: UpdateCustomerProfileDto,
  ): Prisma.Prisma__CustomerProfileClient<CustomerProfile> {
    return this.prisma.customerProfile.update({
      where: { userId },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        phone: dto.phone,
      },
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<CustomerAddress> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.customerProfile.findUniqueOrThrow({ where: { userId } });
      const count = await tx.customerAddress.count({ where: { customerId: profile.id } });
      const makeDefault = dto.isDefault === true || count === 0;
      if (makeDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: profile.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.customerAddress.create({
        data: {
          ...dto,
          country: dto.country ?? 'NG',
          isDefault: makeDefault,
          customerId: profile.id,
        },
      });
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<CustomerAddress> {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.customerAddress.findFirst({
        where: { id: addressId, customer: { userId } },
      });
      if (!address) throw new NotFoundException('Address not found');
      if (dto.isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: address.customerId, isDefault: true, id: { not: address.id } },
          data: { isDefault: false },
        });
      }
      return tx.customerAddress.update({
        where: { id: address.id },
        data: { ...dto, country: dto.country ?? address.country },
      });
    });
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const result = await this.prisma.customerAddress.deleteMany({
      where: { id: addressId, customer: { userId } },
    });
    if (!result.count) throw new NotFoundException('Address not found');
  }
}
