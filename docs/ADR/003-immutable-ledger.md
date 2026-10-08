# ADR 003: Immutable double-entry ledger

Status: Accepted

Every posted financial transaction must balance and reference a unique source/idempotency key. Posted entries are never updated or deleted; corrections use linked reversing transactions. Balances remain derivable from entries. Database constraints and PostgreSQL concurrency tests will enforce these rules in Sprint 7.
