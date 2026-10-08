import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MerchantAdminController, MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import {
  BANK_VERIFICATION,
  DeferredBankVerificationProvider,
  DOCUMENT_STORAGE,
  LocalDocumentStorageProvider,
} from './providers/merchant-providers';

@Module({
  imports: [AuthModule],
  controllers: [MerchantsController, MerchantAdminController],
  providers: [
    MerchantsService,
    { provide: DOCUMENT_STORAGE, useClass: LocalDocumentStorageProvider },
    { provide: BANK_VERIFICATION, useClass: DeferredBankVerificationProvider },
  ],
})
export class MerchantsModule {}
