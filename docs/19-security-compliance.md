# Security and Compliance Baseline

## Implemented foundation controls

- Strict environment validation, DTO whitelist/unknown-field rejection, Helmet, configurable CORS and global throttling.
- Structured logs with authorization, cookie and set-cookie redaction.
- Correlation IDs, consistent non-leaking error responses and separate readiness/liveness probes.
- Secrets excluded from Git; containers run application processes as a non-root user.

## Required controls by later sprints

Argon2id credentials, rotating sessions, fine-grained RBAC, merchant ownership checks, signed uploads, verified raw-body webhooks, idempotency, database concurrency controls, audit logs, fraud holds, immutable ledger/reversals and least-privilege database/provider credentials.

## Compliance gate

Qualified Nigerian legal, accounting and security review is required before production financial use, covering privacy/data retention, consumer protection, KYC/AML responsibilities, reward/stored-value classification, payment-provider terms, tax/accounting, breach response and vendor processing agreements. Documentation is not legal advice.

Production also requires threat modelling, dependency/container scanning, penetration testing, provider sandbox certification, alerting, backup restoration evidence and incident/runbook exercises.
