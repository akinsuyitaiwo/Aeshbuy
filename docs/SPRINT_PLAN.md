# Aeshbuy Backend Sprint Plan

## How to use this plan

This roadmap translates the master specification into two-week sprints. Sprint length can change, but dependency order and exit gates should not. A sprint is complete only when its functionality, persistence, authorization, validation, failure handling, API documentation, automated tests, and progress evidence are present.

Statuses are `NOT_STARTED`, `IN_PROGRESS`, `IMPLEMENTED`, `TESTED`, `BLOCKED`, and `DEFERRED`. Only use `TESTED` after the relevant commands pass in the current repository state.

## Definition of done

Every completed story must have:

- Implemented business behavior, not a controller/service skeleton.
- Validated DTOs and consistent errors.
- Authentication, permission, ownership, and IDOR controls where relevant.
- A committed Prisma migration for persistence changes.
- Idempotency and transaction boundaries for critical writes.
- Swagger/OpenAPI documentation and examples.
- Unit tests plus integration/E2E coverage appropriate to the risk.
- Passing lint, typecheck, build, and affected tests.
- Traceability and progress documents updated with paths and test evidence.

Financial stories additionally require decimal-safe calculations, balanced ledger entries, concurrency tests, immutable history, reversal behavior, and a named commercial funding source.

## Sprint 0 — Discovery and approved decisions

**Goal:** establish requirements, architecture, ownership, and safe implementation boundaries.

- Confirm actors, MVP scope, order hierarchy for multi-merchant carts, and fulfilment ownership.
- Produce architecture, database design, security model, API conventions, and ADRs.
- Create the full requirements traceability matrix and implementation checklist.
- Record unresolved commercial, compliance, accounting, and provider decisions.
- Define environments, secrets ownership, release process, and acceptance-test fixtures.

**Exit gate:** architecture and initial schema are reviewed; unresolved decisions are explicitly blocked or deferred rather than invented.

## Sprint 1 — Foundation and developer experience

**Goal:** a runnable, observable NestJS service and repeatable local environment.

- Scaffold strict NestJS/TypeScript application and `/api/v1` versioning.
- Add configuration validation, structured logging, error envelope, validation pipe, correlation IDs, secure headers, CORS, and rate limiting.
- Configure Prisma/PostgreSQL, Redis, BullMQ, Swagger, and graceful shutdown.
- Add API and worker entry points, health/readiness checks, Dockerfiles, Compose, `.env.example`, migration/seed scripts, and GitHub Actions.
- Establish Jest, Supertest, lint, formatting, typecheck, and test-database conventions.

**Demo:** fresh clone → documented setup → services healthy → Swagger opens → CI-equivalent checks pass.

## Sprint 2 — Identity, sessions, RBAC, and customers

**Goal:** secure customer identity and reusable authorization.

- Users, roles, permissions, sessions, refresh tokens, verification and reset tokens.
- Registration, login, rotating refresh, logout, email verification, password reset, session listing/revocation, and `/auth/me`.
- Argon2, token hashing/revocation, permission guards, suspension/deactivation, audit-safe security events.
- Customer profiles and addresses.

**Demo:** registration-to-authentication E2E, revoked/rotated-token rejection, permission tests, and no secret leakage.

## Sprint 3 — Merchant onboarding and administration

**Goal:** an auditable merchant lifecycle with membership-based access.

- Merchant, staff membership, KYC/documents, bank account, agreements, commission and settlement rule models.
- Registration, profile, signed uploads, submission, review, approve/reject/suspend, staff authorization.
- Provider abstractions for KYC and bank verification.
- Fine-grained admin permissions and audit logs for sensitive transitions.

**Demo:** merchant applies, submits documents, is approved, accepts terms, and a second merchant cannot access its resources.

## Sprint 4 — Catalogue and inventory

**Goal:** approved products can be discovered without overselling.

- Hierarchical categories, products, variants, images, SKUs, approval/publication, search/filter/sort/pagination.
- Inventory balances, movements, reservations, expiry/release, and transactional concurrency control.
- Merchant ownership and admin product moderation.

**Demo:** merchant creates a variant, admin approves it, customer finds it, and concurrent reservations cannot exceed stock.

## Sprint 5 — Cart, checkout, and order lifecycle

**Goal:** server-authoritative commerce through an unpaid order.

- Cart CRUD and product/stock validation.
- Checkout preview with server-calculated pricing, delivery, estimated rewards, and rule snapshots.
- Multi-merchant order structure, address snapshots, fulfilment records, history, and state-machine validation.
- Idempotent order creation and inventory reservation lifecycle.

**Demo:** cart → preview → order, with price tampering rejected and invalid transitions prevented.

## Sprint 6 — Payments and reconciliation

**Goal:** verified Paystack payments safely drive order state.

- Provider interface and Paystack adapter for initialize, verify, webhook verification, and refunds.
- Payment transactions, webhook inbox/deduplication, idempotency records, transactional outbox, retries, and reconciliation worker.
- Failure and ambiguous-state handling; never trust the browser callback.

**Demo:** verified payment marks one order paid exactly once; duplicate/out-of-order webhooks do not duplicate effects.

## Sprint 7 — Ledger and transaction economics

**Goal:** every financial event is balanced, traceable, and reproducible.

- Immutable double-entry accounts, transactions, and entries with database constraints and reversal workflow.
- Commission/economics engine with effective-dated precedence and order snapshots.
- Core accounts for clearing, merchant payable, reward liability, partner payable, revenue, reserve, refund, and settlement.
- Reconciliation reports and financial-invariant integration tests using PostgreSQL.

**Demo:** a paid order creates one balanced journal; duplicate posting is rejected; balances derive from entries.

## Sprint 8 — Reward funding and qualification

**Goal:** qualified rewards can only be created from verified commercial funds.

- Programmes, rules, funding sources, allocations, atomic reservations, reconciliation, and reversal.
- Qualification worker/state transitions and funding/rule snapshots.
- Campaign budget foundations and explicit precedence rules once approved.

**Demo:** a qualifying order reserves available funding and creates a pending/active reward; insufficient or concurrent allocations fail safely.

## Sprint 9 — Reward release and redemption

**Goal:** customers receive scheduled purchase credit and spend it safely.

- PostgreSQL-authoritative schedules; BullMQ due-schedule scanning and retry-safe releases.
- Release ledger postings, outbox events, suspension, expiration, cancellation, and crash recovery.
- Pending/available balances, history, partial redemption, checkout reservation, commit/release, and concurrency protection.

**Demo:** due reward releases once after retry; simultaneous redemptions cannot overspend; failed checkout restores the reservation.

## Sprint 10 — Refunds, disputes, and chargebacks

**Goal:** asynchronous reversals preserve financial history and all dependent balances.

- Full/partial refund request, provider confirmation, failure/retry, disputes, and chargebacks.
- Inventory, rewards, funding, partner allocation, merchant payable, order status, and ledger adjustments.
- Policy-controlled recovery for rewards already released or spent; no silent negative balances.

**Demo:** before-qualification, partial-release, redeemed-reward, partial-refund, and chargeback scenarios all balance.

## Sprint 11 — Merchant settlements and payouts

**Goal:** eligible merchant payables are batched and paid exactly once.

- Settlement eligibility, cycles, items, reserves/refund adjustments, approval, payout attempts, provider confirmation, retry, and reconciliation.
- Holds for disputes/fraud, permission controls, and audited admin actions.

**Demo:** eligible items settle once; accepted-but-unconfirmed transfer is not marked paid; failed payout can safely retry.

## Sprint 12 — Admin, fraud, notifications, and reporting

**Goal:** operators can safely run and observe the MVP.

- Admin APIs across users, commerce, finance, disputes, configuration, and audit logs.
- Rule-based risk events/scores/cases/flags with review and hold actions.
- Outbox-driven email, SMS, push, and in-app notifications with preferences, templates, delivery status, and deduplication.
- MVP analytics and scheduled aggregates; dashboards for GMV, rewards, refunds, fraud, revenue, contribution, and settlements.
- Security, load, recovery, backup/restore, worker failure, and full acceptance-suite hardening.

**Demo:** an operator can trace the end-to-end acceptance scenario and every financial movement using authorized APIs.

## Sprint 13 — Partner and referral programme (Phase 2)

**Goal:** sales partners earn only from qualifying attributed commerce.

- Application/approval, links/codes/QR references, click tracking, consent-aware attribution, and configurable windows.
- Self-referral prevention, qualifying commission, reversal, partner dashboard, payout, and fraud signals.

**Demo:** attributed purchase earns one commission; refund reverses it; recruitment alone earns nothing.

## Sprint 14 — Advanced ecosystem (deferred)

Prepare extension points for subscriptions, ads, featured listings, external affiliates, offline attribution, white-label loyalty, and additional verticals. Do not implement these without approved requirements and funding.

## Release milestones

- **Internal foundation:** Sprints 0–3.
- **Commerce alpha:** Sprints 4–6.
- **Financial/rewards beta:** Sprints 7–9.
- **Operational MVP candidate:** Sprints 10–12.
- **Partner Phase 2:** Sprint 13.

No production financial launch should occur before compliance/accounting approval, provider sandbox certification, penetration/security review, tested backup restoration, operational runbooks, monitoring/alerts, and the complete MVP acceptance suite pass.
