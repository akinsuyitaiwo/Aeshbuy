import type { INestApplication } from '@nestjs/common';
import { PrismaClient, RoleCode } from '@prisma/client';
import * as argon2 from 'argon2';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import { createApplication } from '../src/bootstrap';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

describe('Merchant onboarding (e2e)', () => {
  const prisma = new PrismaClient();
  const password = 'Strong-Test-Pass1!';
  const ownerEmail = `merchant-owner-${randomUUID()}@example.test`;
  const outsiderEmail = `merchant-outsider-${randomUUID()}@example.test`;
  const adminEmail = `merchant-admin-${randomUUID()}@example.test`;
  let app: INestApplication;
  let server: Server;
  let ownerId: string;
  let outsiderId: string;
  let adminId: string;
  let merchantId: string;
  let ownerTokens: Tokens;
  let outsiderTokens: Tokens;
  let adminTokens: Tokens;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    server = app.getHttpServer() as Server;

    ownerTokens = await register(ownerEmail);
    outsiderTokens = await register(outsiderEmail);
    ownerId = (await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } })).id;
    outsiderId = (await prisma.user.findUniqueOrThrow({ where: { email: outsiderEmail } })).id;

    const passwordHash = await argon2.hash(password);
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.ADMIN } });
    const admin = await prisma.user.create({
      data: { email: adminEmail, passwordHash, roles: { create: { roleId: adminRole.id } } },
    });
    adminId = admin.id;
    adminTokens = (
      await request(server)
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password })
        .expect(200)
    ).body as Tokens;
  });

  afterAll(async () => {
    if (merchantId) await prisma.merchant.deleteMany({ where: { id: merchantId } });
    await prisma.outboxEvent.deleteMany({
      where: { aggregateId: { in: [ownerId, outsiderId, adminId, merchantId].filter(Boolean) } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, outsiderId, adminId].filter(Boolean) } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  async function register(email: string): Promise<Tokens> {
    return (
      await request(server)
        .post('/api/v1/auth/register')
        .send({ email, password, firstName: 'Test', lastName: 'Merchant' })
        .expect(201)
    ).body as Tokens;
  }

  it('creates a draft owned by the authenticated user', async () => {
    const response = await request(server)
      .post('/api/v1/merchants')
      .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
      .send({
        legalName: 'Test Merchant Limited',
        tradingName: 'Test Merchant',
        registrationNumber: 'RC123456',
        taxId: 'TIN123456',
        email: ownerEmail,
        phone: '+2348012345678',
      })
      .expect(201);
    merchantId = (response.body as { id: string }).id;
    expect(response.body).toMatchObject({
      status: 'DRAFT',
      members: [{ userId: ownerId, role: 'OWNER' }],
    });
  });

  it('conceals the merchant from non-members and prevents IDOR', async () => {
    await request(server)
      .get(`/api/v1/merchants/${merchantId}`)
      .set('Authorization', `Bearer ${outsiderTokens.accessToken}`)
      .expect(404);
    await request(server)
      .patch(`/api/v1/merchants/${merchantId}`)
      .set('Authorization', `Bearer ${outsiderTokens.accessToken}`)
      .send({ tradingName: 'Stolen' })
      .expect(404);
  });

  it('requires the complete application before submission', async () => {
    await request(server)
      .post(`/api/v1/merchants/${merchantId}/submit`)
      .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
      .expect(400);

    await request(server)
      .post(`/api/v1/merchants/${merchantId}/documents/upload`)
      .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
      .send({ type: 'CAC_CERTIFICATE', fileName: 'cac.pdf', contentType: 'application/pdf' })
      .expect(201);
    await request(server)
      .post(`/api/v1/merchants/${merchantId}/bank-accounts`)
      .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
      .send({ bankCode: '058', accountNumber: '0123456789', accountName: 'TEST MERCHANT LIMITED' })
      .expect(201);
    await request(server)
      .post(`/api/v1/merchants/${merchantId}/agreements`)
      .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
      .send({ version: '2026-01' })
      .expect(201);
    const submitted = await request(server)
      .post(`/api/v1/merchants/${merchantId}/submit`)
      .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
      .expect(201);
    expect((submitted.body as { status: string }).status).toBe('SUBMITTED');
  });

  it('requires admin permission and records approval economics and audit history', async () => {
    await request(server)
      .post(`/api/v1/admin/merchants/${merchantId}/review`)
      .set('Authorization', `Bearer ${ownerTokens.accessToken}`)
      .send({ status: 'APPROVED', commissionRate: 10, settlementDelayDays: 7 })
      .expect(403);
    const approved = await request(server)
      .post(`/api/v1/admin/merchants/${merchantId}/review`)
      .set('Authorization', `Bearer ${adminTokens.accessToken}`)
      .send({ status: 'APPROVED', commissionRate: 10, settlementDelayDays: 7 })
      .expect(201);
    expect((approved.body as { status: string }).status).toBe('APPROVED');

    const [rule, review, audit] = await Promise.all([
      prisma.merchantCommercialRule.findFirst({ where: { merchantId } }),
      prisma.merchantReview.findFirst({ where: { merchantId, reviewerId: adminId } }),
      prisma.auditLog.findFirst({ where: { resourceId: merchantId, action: 'merchant.approved' } }),
    ]);
    expect(rule?.commissionRate.toString()).toBe('10');
    expect(review).not.toBeNull();
    expect(audit).not.toBeNull();
  });
});
