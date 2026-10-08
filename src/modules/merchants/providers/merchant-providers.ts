import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface UploadGrant {
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}
export interface DocumentStorageProvider {
  createUploadGrant(
    merchantId: string,
    fileName: string,
    contentType: string,
  ): Promise<UploadGrant>;
}
export interface BankVerificationProvider {
  startVerification(
    bankCode: string,
    accountNumber: string,
    accountName: string,
  ): Promise<{ providerRef: string }>;
}

export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');
export const BANK_VERIFICATION = Symbol('BANK_VERIFICATION');

@Injectable()
export class LocalDocumentStorageProvider implements DocumentStorageProvider {
  createUploadGrant(merchantId: string, fileName: string): Promise<UploadGrant> {
    const objectKey = `merchants/${merchantId}/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    return Promise.resolve({
      objectKey,
      uploadUrl: `local-upload://${objectKey}`,
      expiresInSeconds: 900,
    });
  }
}

@Injectable()
export class DeferredBankVerificationProvider implements BankVerificationProvider {
  startVerification(): Promise<{ providerRef: string }> {
    return Promise.resolve({ providerRef: `pending_${randomUUID()}` });
  }
}
