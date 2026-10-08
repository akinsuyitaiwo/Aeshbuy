# Testing Strategy

- Unit tests isolate deterministic policies and calculations.
- Integration tests use real PostgreSQL (and Redis when relevant) for transactions, constraints, locks, queues and persistence.
- E2E tests exercise the HTTP contract, authentication, authorization, validation and failure responses.
- Financial invariant tests prove journal balance, uniqueness, funding limits, redemption/settlement limits and safe concurrency/reversal.

Every pull request runs format, lint, typecheck, Prisma validation, build and unit tests. CI additionally applies migrations and runs integration/E2E suites with isolated services. Tests may use fake external adapters but may not fabricate provider success as integration evidence.

Skipped tests do not count. Flaky tests are defects. Test fixtures must be synthetic, deterministic and free of live secrets/personal data.
