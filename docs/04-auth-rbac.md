# Authentication and Authorization

Sprint 2 implements short-lived JWT access tokens and rotating opaque refresh tokens. Only SHA-256 refresh-token hashes are stored. Rotation consumes the prior token; reuse revokes the token's entire session. Logout, password reset, account deactivation and explicit session revocation take effect server-side because every protected request verifies the persisted session and active account status.

Users may hold multiple roles through `UserRole`. Roles receive permissions through `RolePermission`. `AccessTokenGuard` authenticates and loads current roles/permissions; `PermissionsGuard` enforces declared permissions. Merchant membership authorization is introduced in Sprint 3 and client-supplied merchant IDs will never establish authority.

Passwords use Argon2id. Email/reset tokens are cryptographically random, SHA-256 hashed at rest, single-use and expiring. Plain tokens are placed only in transactional outbox payloads for the future notification worker. Forgot-password responses do not reveal whether an account exists. Suspended/deactivated users cannot create sessions or use existing ones. Authentication logs redact authorization and cookie headers.

Implemented tests cover hashing, duplicate registration, one-time email verification, refresh rotation/replay, session-backed authorization, permission denial, password-reset revocation, enumeration-resistant reset requests, customer address ownership, deactivation and CORS allow-list behavior. Merchant IDOR and administrative suspension tests belong to Sprint 3.
