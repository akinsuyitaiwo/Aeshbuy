import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import { createApplication } from '../src/bootstrap';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

describe('Identity and customers (e2e)', () => {
  const prisma = new PrismaClient();
  const email = `identity-${randomUUID()}@example.test`;
  const password = 'Strong-Test-Pass1!';
  const newPassword = 'New-Strong-Test-Pass2!';
  let app: INestApplication;
  let server: Server;
  let userId: string;
  let tokens: Tokens;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.outboxEvent.deleteMany({ where: { aggregateId: userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await app.close();
    await prisma.$disconnect();
  });

  it('registers a customer with a hashed password and pending verification event', async () => {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ email, password, firstName: 'Ada', lastName: 'Okafor', phone: '+2348012345678' })
      .expect(201);

    tokens = response.body as Tokens;
    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    userId = user.id;
    expect(user.passwordHash).not.toBe(password);
    expect(user.emailVerifiedAt).toBeNull();

    await request(server)
      .post('/api/v1/auth/register')
      .send({ email, password, firstName: 'Ada', lastName: 'Okafor' })
      .expect(409);
  });

  it('verifies email with the one-time outbox token', async () => {
    const event = await prisma.outboxEvent.findFirstOrThrow({
      where: { aggregateId: userId, eventType: 'user.registered' },
      orderBy: { createdAt: 'desc' },
    });
    const payload = event.payload as { verificationToken: string };
    await request(server)
      .post('/api/v1/auth/verify-email')
      .send({ token: payload.verificationToken })
      .expect(204);
    await request(server)
      .post('/api/v1/auth/verify-email')
      .send({ token: payload.verificationToken })
      .expect(422);
  });

  it('authorizes profile and ownership-scoped address operations', async () => {
    const me = await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);
    expect((me.body as { email: string }).email).toBe(email);

    const address = await request(server)
      .post('/api/v1/customers/me/addresses')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        label: 'Home',
        recipient: 'Ada Okafor',
        phone: '+2348012345678',
        line1: '1 Test Street',
        city: 'Lagos',
        state: 'Lagos',
      })
      .expect(201);
    expect((address.body as { isDefault: boolean }).isDefault).toBe(true);

    const profile = await request(server)
      .get('/api/v1/customers/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);
    expect((profile.body as { addresses: unknown[] }).addresses).toHaveLength(1);
  });

  it('rotates refresh tokens and detects reuse', async () => {
    const firstRefresh = tokens.refreshToken;
    const rotated = await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefresh })
      .expect(200);
    tokens = rotated.body as Tokens;
    expect(tokens.refreshToken).not.toBe(firstRefresh);

    await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstRefresh })
      .expect(401);
  });

  it('logs in, lists sessions, and prevents cross-user session deletion', async () => {
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    tokens = login.body as Tokens;

    const sessions = await request(server)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);
    expect((sessions.body as unknown[]).length).toBeGreaterThan(0);

    await request(server)
      .delete(`/api/v1/auth/sessions/${randomUUID()}`)
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(422);
  });

  it('resets the password, revokes sessions, and accepts only the new password', async () => {
    await request(server).post('/api/v1/auth/forgot-password').send({ email }).expect(202);
    await request(server)
      .post('/api/v1/auth/forgot-password')
      .send({ email: `missing-${email}` })
      .expect(202);

    const event = await prisma.outboxEvent.findFirstOrThrow({
      where: { aggregateId: userId, eventType: 'user.password-reset-requested' },
      orderBy: { createdAt: 'desc' },
    });
    const payload = event.payload as { resetToken: string };
    await request(server)
      .post('/api/v1/auth/reset-password')
      .send({ token: payload.resetToken, password: newPassword })
      .expect(204);

    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(401);
    await request(server).post('/api/v1/auth/login').send({ email, password }).expect(401);
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword })
      .expect(200);
    tokens = login.body as Tokens;
  });

  it('deactivates the account and revokes its final session', async () => {
    await request(server)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(204);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(401);
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword })
      .expect(401);
  });
});
