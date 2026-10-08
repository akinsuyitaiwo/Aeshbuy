# ADR 005: Payment provider abstraction

Status: Accepted

Order logic depends on an internal payment contract, initially implemented by Paystack. Only verified server-side provider evidence changes payment state. Webhook inbox records, unique references, idempotent handlers and reconciliation protect against duplicates, reordering and ambiguous timeouts.
