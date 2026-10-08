# Implementation Checklist

The detailed ordering and gates are in [SPRINT_PLAN.md](SPRINT_PLAN.md); verified evidence belongs in [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md).

- [x] Repository assessment and scoped sprint roadmap.
- [x] Initial product, architecture, database, auth, API, security and testing decisions.
- [x] Initial ADRs and requirements traceability.
- [x] Strict NestJS project, configuration validation and API versioning.
- [x] PostgreSQL/Prisma foundation migration.
- [x] Redis/BullMQ configuration and separate worker entry point.
- [x] Structured logging/redaction, correlation IDs, global validation/errors, Helmet, CORS and throttling.
- [x] Swagger, health checks, Docker/Compose and CI foundation.
- [x] Sprint 1 full validation gate passes.
- [ ] Identity, sessions, RBAC and customers.
- [ ] Merchant onboarding and administration.
- [ ] Catalogue and inventory.
- [ ] Cart, checkout and orders.
- [ ] Payments and reconciliation.
- [ ] Ledger and transaction economics.
- [ ] Reward funding, release and redemption.
- [ ] Refunds, disputes and chargebacks.
- [ ] Settlements and payouts.
- [ ] Admin, fraud, notifications, reporting and hardening.
- [ ] Partner/referral Phase 2.
