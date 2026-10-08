import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

describe('Foundation persistence (integration)', () => {
  const prisma = new PrismaClient();

  afterAll(async () => prisma.$disconnect());

  it('enforces scoped idempotency keys', async () => {
    const namespace = `test:${randomUUID()}`;
    const key = randomUUID();
    const requestHash = createHash('sha256').update('request').digest('hex');

    await prisma.idempotencyRecord.create({
      data: {
        namespace,
        key,
        requestHash,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await expect(
      prisma.idempotencyRecord.create({
        data: {
          namespace,
          key,
          requestHash,
          expiresAt: new Date(Date.now() + 60_000),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    await prisma.idempotencyRecord.delete({ where: { namespace_key: { namespace, key } } });
  });

  it('persists an outbox event as pending by default', async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'FoundationTest',
        aggregateId: randomUUID(),
        eventType: 'foundation.tested',
        payload: { safe: true },
      },
    });

    expect(event.status).toBe('PENDING');
    await prisma.outboxEvent.delete({ where: { id: event.id } });
  });
});
