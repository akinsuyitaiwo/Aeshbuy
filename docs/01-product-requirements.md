# Product Requirements

## Purpose and MVP

Aeshbuy enables Nigerian customers to buy merchant products, earn commercially funded purchase credits after qualification, and redeem eligible credit on later purchases. Merchants onboard, publish approved inventory, fulfil orders, and receive reconciled settlements. Administrators govern sensitive operations and audit financial movement.

The operational MVP ends at Sprint 12 in [SPRINT_PLAN.md](SPRINT_PLAN.md). Partners are Phase 2. Cash withdrawal, deposit taking, guaranteed returns, and recruitment-funded rewards are explicitly excluded.

## Actors and outcomes

- Customer: secure account, catalogue/cart/checkout, verified payment, order tracking, reward visibility and redemption.
- Merchant staff: membership-scoped onboarding, products/inventory, fulfilment, commercial reports, settlements.
- Administrator: permission-scoped reviews, configuration, investigation, approvals, reversals, audit and reports.
- Partner (Phase 2): attributed qualifying sales, commission and payout visibility.

## Non-functional requirements

- Correctness and auditability take priority over throughput for financial writes.
- PostgreSQL is authoritative; all critical writes are atomic and idempotent.
- No JavaScript floating-point money arithmetic.
- API and workers support graceful shutdown, tracing/correlation, structured redacted logs, health checks and retries.
- Security includes least privilege, ownership checks, rate limits, input validation, token/session revocation, webhook verification and immutable audit history.

## Approval dependencies

Commercial, refund, settlement, shipping, compliance and partner decisions are tracked in [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md). Affected behavior must remain blocked or configurable until approved.
