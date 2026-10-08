# ADR 002: Modular monolith

Status: Accepted

Use one deployable codebase with domain module boundaries and separate API/worker processes. This minimizes distributed-transaction and operational complexity while retaining explicit contracts. Extract services only after measured scale or organizational needs justify the cost.
