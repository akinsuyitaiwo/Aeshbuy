import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import * as request from 'supertest';
import { createApplication } from '../src/bootstrap';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('reports liveness', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/v1/health/live')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('allows only configured browser origins', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/v1/health/live')
      .set('Origin', 'http://localhost:3001')
      .expect('access-control-allow-origin', 'http://localhost:3001')
      .expect(200);

    const blocked = await request(app.getHttpServer() as Server)
      .get('/api/v1/health/live')
      .set('Origin', 'https://evil.example')
      .expect(200);
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
