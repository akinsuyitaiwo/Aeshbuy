# Repository Assessment

Assessment date: 2026-10-08

## Current state

The repository is effectively empty. It contains an initial README and a general Node.js `.gitignore`; it does not yet contain application source code.

### Existing functionality

- Git repository with a `main` branch.
- A short project description.
- Node-oriented ignore rules.

### Missing functionality

- NestJS application, package manifest, TypeScript configuration, linting, and formatting.
- PostgreSQL and Prisma schema/migrations.
- Redis, BullMQ, API and worker entry points.
- All identity, commerce, financial, rewards, merchant, partner, admin, and reporting modules.
- Docker, environment validation, CI/CD, health checks, observability, and API documentation.
- Unit, integration, end-to-end, and financial-invariant tests.

## Architectural risks

1. Financial consistency: ledger posting, funding allocation, redemption, refunds, and settlement must be atomic and idempotent.
2. Undefined commercial policy: rates, qualification periods, release schedules, refund recovery, settlement cycles, and campaign precedence are not approved values yet.
3. Regulatory scope: Nigerian payments, stored-value/reward treatment, privacy, KYC, AML, tax, and consumer-protection requirements require qualified review.
4. Provider dependency: Paystack, KYC, storage, email, SMS, and push credentials and sandbox accounts are not present.
5. Delivery scope: the master specification is too large for a single implementation cycle and needs gated, demonstrable increments.

## Technical debt

There is no legacy implementation debt. The main risk is creating debt through premature breadth, generated module shells, or financial workflows without invariants and integration tests.

## Assumptions

- npm is the package manager.
- The first release is a REST API under `/api/v1`.
- PostgreSQL is the source of truth; Redis and BullMQ provide cache and job execution, not financial truth.
- Monetary values use Prisma `Decimal`/PostgreSQL `NUMERIC`, with NGN as the initial currency; the precise scale and rounding policy remain an approval item.
- Rewards are purchase credits in MVP and cannot be withdrawn as cash.
- A modular monolith is used until measured scaling needs justify another architecture.
- External providers are implemented behind adapters and may use explicit local test adapters in non-production environments.

## Proposed changes

Follow [SPRINT_PLAN.md](SPRINT_PLAN.md). Establish foundation and quality gates first, then implement vertical business slices. Add schema changes only through reviewed Prisma migrations. Treat ledger entries as immutable and use reversals for corrections. Use a transactional outbox for external side effects.

## Migration risks

There is no existing application database to migrate. Once financial data exists, migrations must be forward-safe, backed up, tested against production-like data, and accompanied by rollback or compensating plans. Destructive schema changes must not be deployed without a data migration and recovery procedure.

## Decisions requiring approval

- Merchant commission and precedence rules.
- Reward rates, qualification conditions, schedules, expiry, and rounding.
- Funding eligibility and budget-ownership rules.
- Treatment of refunds after rewards have been released or spent.
- Settlement timing, reserves, fees, minimums, and approval thresholds.
- Shipping ownership, fee calculation, and multi-merchant fulfilment model.
- Partner attribution window and commission rules.
- Fraud thresholds and permissible automated actions.
- Nigerian legal, regulatory, privacy, KYC/AML, tax, and accounting policies.
