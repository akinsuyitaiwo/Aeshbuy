# Requirements Traceability

Statuses reflect repository evidence, not intent. Detailed business requirements will be decomposed as their owning sprint begins.

| ID | Requirement | Source | Sprint | Owner | Entities | API | Rules/tests | Status/evidence |
|---|---|---|---|---|---|---|---|---|
| FND-001 | Strict modular NestJS API and worker | Sections 2, 4, 28 | 1 | Platform | — | — | Build/typecheck | TESTED: `npm run validate`; API/worker containers running |
| FND-002 | PostgreSQL/Prisma source of truth | Sections 2, 5 | 1 | Data | OutboxEvent, IdempotencyRecord | — | Migration/integration | TESTED: foundation migration and 2 integration tests pass |
| FND-003 | Redis and BullMQ | Sections 2, 28 | 1 | Platform | — | — | Container/config checks | TESTED: healthy Redis and long-running worker container |
| FND-004 | Versioned documented REST API | Section 29 | 1 | Platform | — | `/api/v1`, `/docs` | E2E/OpenAPI | TESTED: health E2E and container Swagger smoke pass |
| FND-005 | Environment/security baseline | Sections 27, 31 | 1 | Platform | — | health probes | Unit/E2E/audit | TESTED: quality gate and zero production audit vulnerabilities |
| FND-006 | Containers and CI | Section 31 | 1 | Platform | — | — | Compose/build/workflow | TESTED: API and worker images built; Compose smoke passed |
| IDN-001 | Auth/session lifecycle | Section 6 | 2 | Identity | User, role/permission, session/token, customer entities | `/auth/*`, `/customers/me/*` | 3 unit and 9 E2E tests | TESTED: migration `20261008062442_identity_customers`; full gate passes |
| MER-001 | Merchant lifecycle and staff ownership | Section 7 | 3 | Merchants | Merchant/KYC/agreement entities | `/merchants/*` | IDOR/lifecycle E2E | NOT_STARTED |
| CAT-001 | Catalogue and inventory reservations | Section 8 | 4 | Catalogue | Product/inventory entities | `/products/*` | Concurrent stock integration | NOT_STARTED |
| ORD-001 | Authoritative cart/checkout/orders | Sections 9–10 | 5 | Commerce | Cart/order entities | `/cart`, `/checkout`, `/orders` | Price/state E2E | NOT_STARTED |
| PAY-001 | Verified idempotent Paystack payments | Section 11 | 6 | Payments | Payment/webhook entities | `/payments`, `/webhooks/paystack` | Duplicate webhook E2E | NOT_STARTED |
| FIN-001 | Immutable balanced ledger/economics | Sections 12–13 | 7 | Finance | Ledger/commission entities | Admin/reporting | Invariant integration | NOT_STARTED |
| REW-001 | Funded qualifying rewards | Sections 14–17 | 8–9 | Rewards | Funding/reward entities | `/rewards/*` | Funding/concurrency invariants | NOT_STARTED |
| REF-001 | Refund, dispute and chargeback reversals | Section 18 | 10 | Finance | Refund/dispute entities | Refund/admin APIs | Scenario E2E | NOT_STARTED |
| SET-001 | Reconciled settlements/payouts | Section 19 | 11 | Finance | Settlement/payout entities | Merchant/admin APIs | Duplicate payout invariant | NOT_STARTED |
| OPS-001 | Admin, risk, notifications and reports | Sections 22–26 | 12 | Operations | Risk/notification/audit | Admin APIs | Permission/audit E2E | NOT_STARTED |
| PAR-001 | Sale-funded partner referrals | Section 20 | 13 | Partners | Partner/referral entities | `/partners/*` | Attribution/reversal E2E | DEFERRED |
