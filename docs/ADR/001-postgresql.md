# ADR 001: PostgreSQL as system of record

Status: Accepted

PostgreSQL owns transactional and financial truth because it provides ACID transactions, constraints, numeric types and row-level concurrency controls. Redis is non-authoritative. Prisma supplies type-safe access and checked-in migrations; raw SQL is permitted for invariants Prisma cannot express.
