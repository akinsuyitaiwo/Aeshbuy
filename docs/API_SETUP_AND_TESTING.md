# API Setup and Testing Guide

> Current state: the Sprint 1 API foundation is implemented and tested. Health endpoints and Swagger are available; authentication and business endpoints begin in Sprint 2.

## Prerequisites

- Node.js 22.14.0, pinned in `.nvmrc` (run `nvm install && nvm use`).
- npm.
- Docker Engine with Docker Compose v2.
- Git and an API client such as curl, Postman, or Bruno.
- Paystack test credentials only when payment integration begins.

PostgreSQL and Redis should run through Compose for local development. Transaction-sensitive tests must use PostgreSQL, not an in-memory substitute.

## First-time setup (after Sprint 1)

```bash
git clone <repository-url>
cd Aeshbuy
nvm install
nvm use
npm ci
cp .env.example .env
docker compose up -d postgres redis
npm run prisma:generate
npm run prisma:migrate:dev
npm run db:seed
npm run start:dev
```

Expected local URLs should be standardized as:

- Compose API: `http://localhost:3002/api/v1` (the local `npm run start:dev` default is port `3000`)
- Compose Swagger UI: `http://localhost:3002/docs`
- Compose liveness: `http://localhost:3002/api/v1/health/live`
- Compose readiness: `http://localhost:3002/api/v1/health/ready`

Confirm the actual ports and paths in `.env.example` and generated Swagger documentation once implemented.

## Environment configuration

Sprint 1 must provide a commented `.env.example`. Expected categories include:

```dotenv
NODE_ENV=development
PORT=3000
API_PORT=3002
POSTGRES_PORT=5433
REDIS_PORT=6380
DATABASE_URL=postgresql://aeshbuy:aeshbuy@localhost:5433/aeshbuy
REDIS_URL=redis://localhost:6380
JWT_ACCESS_SECRET=replace-with-a-long-local-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-local-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
```

Names shown here are provisional until the configuration schema is implemented. Never commit `.env`, production secrets, access tokens, real customer data, or live Paystack credentials.

## Starting the services

Recommended development modes after their scripts exist:

```bash
# Infrastructure only; run API locally with hot reload
docker compose up -d postgres redis
npm run start:dev

# Background workers, in another terminal
npm run start:worker:dev

# Entire local stack
docker compose up --build
```

Check logs and health before testing. Readiness should remain unhealthy if required dependencies are unavailable.

## Database workflow

```bash
npm run prisma:generate
npm run prisma:migrate:dev -- --name descriptive_change
npm run db:seed
npm run prisma:studio
```

Production-like environments must apply checked-in migrations with a deploy command such as `npm run prisma:migrate:deploy`; they must not use development migration generation. Never edit an already-deployed financial migration in place.

## Automated checks

Sprint 1 should expose these stable scripts:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:cov
```

Integration and E2E suites require isolated PostgreSQL and Redis instances and must clean data deterministically. Financial/concurrency suites must not silently fall back to mocks. Record commands and outcomes in [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md).

## Manual API testing

### 1. Verify health

```bash
curl --fail http://localhost:3002/api/v1/health/live
curl --fail http://localhost:3002/api/v1/health/ready
```

### 2. Register and log in (after Sprint 2)

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"customer@example.test","password":"Use-A-Strong-Test-Password1!"}'

curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"customer@example.test","password":"Use-A-Strong-Test-Password1!"}'
```

Use the returned access token without saving it to the repository:

```bash
curl -i http://localhost:3000/api/v1/auth/me \
  -H 'Authorization: Bearer <access-token>'
```

Request/response fields remain subject to the implemented OpenAPI contract. Swagger, not this illustrative payload, is authoritative.

### 3. Test idempotent writes

For checkout, payment initialization, refund requests, redemptions, and other critical writes, send an opaque unique header and retry the identical request:

```bash
curl -i -X POST http://localhost:3000/api/v1/checkout \
  -H 'Authorization: Bearer <access-token>' \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 1d7bc38c-81a5-43d0-a03e-a4665bb1f975' \
  -d '<payload-from-swagger>'
```

The retry must return the same logical result without duplicating orders or financial effects. Reusing the key with a different payload must be rejected.

## Paystack webhook testing (after Sprint 6)

Use Paystack test mode and a tunnelling tool or captured, sanitized fixture. Verify the provider signature exactly as documented by the adapter. Never invent a signature or treat an unsigned request as success.

Required tests:

- Valid signature and matching server-side verification.
- Invalid/missing signature rejection.
- Same webhook delivered multiple times.
- Events delivered out of order.
- Provider timeout followed by reconciliation.
- Amount, currency, order, or reference mismatch.

Inspect persisted webhook events, payment transaction state, order state, outbox records, and ledger entries—not only the HTTP status.

## Financial API verification

For any purchase, release, redemption, refund, or settlement, verify all of the following:

1. A unique idempotency/source reference exists.
2. Debit totals equal credit totals.
3. No posted entry was edited or deleted.
4. The domain aggregate and ledger agree.
5. Reward allocations do not exceed verified funding.
6. Retrying or concurrently executing the action does not duplicate or overspend.
7. A correction creates reversal entries and an audit record.

These checks belong in automated PostgreSQL integration tests; manual database inspection is supporting evidence only.

## Troubleshooting

- **API will not start:** validate `.env`, then check PostgreSQL/Redis readiness and migration status.
- **Prisma errors:** ensure the database URL points to the intended local/test database, regenerate the client, and apply migrations.
- **Tests leak state:** confirm each suite uses a dedicated database/schema and deterministic cleanup.
- **Jobs do not run:** confirm the worker process, Redis connection, queue name, and PostgreSQL schedule/outbox state.
- **Webhook rejected:** compare raw-body handling, configured test secret, and signature calculation; do not disable verification.
- **Unexpected duplicate:** inspect idempotency, webhook inbox, outbox, and database unique constraints before retrying manually.

## Before opening a pull request

Run lint, typecheck, build, unit, integration, and relevant E2E tests; review migrations; regenerate/check OpenAPI if configured; scan changes for secrets; and update the progress and traceability documents with exact evidence.
