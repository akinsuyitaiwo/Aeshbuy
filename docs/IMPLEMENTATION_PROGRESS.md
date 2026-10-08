# Implementation Progress and Handoff Guide

Last updated: 2026-10-08

## Current snapshot

| Sprint | Status | Evidence |
|---|---|---|
| 0 — Discovery and decisions | TESTED | Requirements, architecture, database/API/security/test designs, ADRs and traceability created |
| 1 — Foundation | TESTED | Quality gate, migration, tests, images and runtime smoke checks passed |
| 2 — Identity and customers | NOT_STARTED | — |
| 3 — Merchant onboarding | NOT_STARTED | — |
| 4 — Catalogue and inventory | NOT_STARTED | — |
| 5 — Cart, checkout, orders | NOT_STARTED | — |
| 6 — Payments | NOT_STARTED | — |
| 7 — Ledger and economics | NOT_STARTED | — |
| 8 — Reward funding | NOT_STARTED | — |
| 9 — Reward release/redemption | NOT_STARTED | — |
| 10 — Refunds/chargebacks | NOT_STARTED | — |
| 11 — Settlements/payouts | NOT_STARTED | — |
| 12 — Operations/hardening | NOT_STARTED | — |
| 13 — Partners/referrals | DEFERRED | Phase 2 per master specification |
| 14 — Advanced ecosystem | DEFERRED | Requires approved requirements |

## How to determine what is actually done

Use this order at the start of every work session:

1. Read this file and [SPRINT_PLAN.md](SPRINT_PLAN.md).
2. Run `git status --short` and inspect recent commits/diffs.
3. Check `package.json`, Prisma migrations, `src/`, `test/`, Docker/CI files, and generated OpenAPI output.
4. Run the validation commands applicable to the current sprint.
5. Compare real endpoints and tests against the traceability matrix once it exists.
6. Correct stale status here before beginning new work.

Documentation is an index, not proof. Acceptable evidence includes an implementation path, migration name, test path, test command and result, OpenAPI operation, or reproducible demo. A DTO, empty service, skipped test, mocked success response, or unchecked box is not completed functionality.

## Status rules

- `NOT_STARTED`: no material implementation exists.
- `IN_PROGRESS`: implementation exists but its definition of done or tests are incomplete.
- `IMPLEMENTED`: behavior is implemented, but required verification has not all passed.
- `TESTED`: definition of done is met and recorded validation passes.
- `BLOCKED`: work cannot safely proceed; name the decision, owner, and unblock condition.
- `DEFERRED`: deliberately excluded from the current release with approval/reason recorded.

## Required session update

Append a dated entry below after each implementation session. Never overwrite useful history.

```md
## YYYY-MM-DD — Sprint N: short title

Status: IN_PROGRESS | IMPLEMENTED | TESTED | BLOCKED

### Delivered
- Requirement/story and concrete behavior

### Evidence
- Source: `path/to/file.ts`
- Migration: `prisma/migrations/...`
- Tests: `path/to/file.spec.ts`
- API: `METHOD /api/v1/path`

### Validation
| Command | Result | Notes |
|---|---|---|
| `npm run lint` | PASS/FAIL/NOT_RUN | ... |
| `npm run typecheck` | PASS/FAIL/NOT_RUN | ... |
| `npm test` | PASS/FAIL/NOT_RUN | ... |
| `npm run test:integration` | PASS/FAIL/NOT_RUN | ... |
| `npm run test:e2e` | PASS/FAIL/NOT_RUN | ... |

### Decisions and blockers
- Decision, owner, due condition, affected requirements

### Files changed
- `path`

### Next safe task
- One precise next action and its dependencies
```

## Pull request/sprint review checklist

- [ ] Scope maps to named requirements and sprint stories.
- [ ] No unresolved policy was silently invented.
- [ ] Migrations apply to a clean database and upgrade a representative existing database.
- [ ] Authentication, permissions, ownership, validation, and error behavior are tested.
- [ ] Critical writes are transactional and idempotent.
- [ ] Financial calculations use Decimal and preserve immutable audit history.
- [ ] Race/failure/retry behavior is tested where relevant.
- [ ] Swagger and operator/developer documentation match behavior.
- [ ] Lint, typecheck, build, unit, integration, and relevant E2E checks pass.
- [ ] No secrets or personal/payment data appear in logs, fixtures, or Git.
- [ ] This progress file and the traceability matrix contain evidence.

## Open decisions

| ID | Decision | Blocks | Owner/status |
|---|---|---|---|
| DEC-001 | Approve commission/reward precedence and rates | Sprints 5, 7–10 | Product/Finance — OPEN |
| DEC-002 | Approve qualification, schedule, expiry, and rounding policies | Sprints 7–10 | Product/Finance — OPEN |
| DEC-003 | Approve refund recovery for released/spent rewards | Sprint 10 | Finance/Legal/Product — OPEN |
| DEC-004 | Approve settlement cycles, reserve, fees, and thresholds | Sprint 11 | Finance/Operations — OPEN |
| DEC-005 | Confirm shipping and multi-merchant fulfilment model | Sprint 5 | Product/Operations — OPEN |
| DEC-006 | Complete Nigerian regulatory, privacy, KYC/AML, tax, and accounting review | Production launch | Legal/Finance — OPEN |
| DEC-007 | Provide sandbox/provider accounts and credential ownership | Sprints 3, 6, 12 | Operations — OPEN |
| DEC-008 | Approve partner attribution and commission policies | Sprint 13 | Product/Finance — OPEN |

## Initial session record

### 2026-10-08 — Planning baseline

Status: IN_PROGRESS

Delivered: repository assessment, gated sprint roadmap, progress/handoff method, and API setup/testing guide. No application functionality is claimed.

Validation: documentation inspection only; no package manifest, build, or test suite exists yet.

Next safe task: implement Sprint 2 identity, sessions, RBAC and customers.

### 2026-10-08 — Sprint 0 and Sprint 1 foundation

Status: TESTED

#### Delivered

- Strict NestJS 11 modular API and separate long-running worker entry point.
- Validated environment configuration, versioned REST API, Swagger, structured redacted logging, correlation IDs, consistent errors, DTO validation, Helmet, CORS and global throttling.
- Prisma/PostgreSQL foundation with applied migration for outbox events and scoped idempotency records.
- Redis and BullMQ configuration with retry/backoff defaults.
- Liveness/readiness endpoints, Docker API/worker images, Compose development stack and GitHub Actions workflow.
- Product, architecture, database, auth, security, API, testing, traceability and ADR documentation.

#### Evidence

- Source: `src/main.ts`, `src/worker.ts`, `src/app.module.ts`, `src/bootstrap.ts`.
- Migration: `prisma/migrations/20261008055254_foundation/migration.sql`.
- Tests: `test/environment.spec.ts`, `test/foundation.integration-spec.ts`, `test/health.e2e-spec.ts`.
- API: `GET /api/v1/health/live`, `GET /api/v1/health/ready`, `/docs`.

#### Validation

| Command | Result | Notes |
|---|---|---|
| `npm run validate` | PASS | Format, lint, typecheck, Prisma validation, build and 2 unit tests |
| `npm run test:integration` | PASS | 2 PostgreSQL persistence/constraint tests |
| `npm run test:e2e` | PASS | Versioned liveness endpoint |
| `docker compose build api worker` | PASS | Both production images built |
| Compose runtime smoke | PASS | API, worker, PostgreSQL and Redis running; liveness/readiness/Swagger respond |
| `npm audit --omit=dev` | PASS | 0 vulnerabilities; full audit also returned 0 after dependency updates |

#### Decisions and blockers

- No blocker for Sprint 2. Commercial and compliance decisions DEC-001 through DEC-008 remain open for their affected later sprints.

#### Next safe task

- Sprint 2: identity schema, Argon2 credentials, rotating sessions, RBAC/permissions, customer profiles/addresses, auth endpoints and authorization tests.
