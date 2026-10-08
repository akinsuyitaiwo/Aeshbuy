# Authentication and Authorization Design

Sprint 2 will implement short-lived JWT access tokens and rotating refresh tokens. Only refresh-token hashes are stored. Rotation invalidates the prior token family on replay; logout and session revocation take effect server-side.

Users may hold multiple roles. Permissions authorize operations; merchant membership authorizes access to a specific merchant. Client-supplied merchant IDs never establish authority. Guards must compose authentication, permission and resource-ownership checks.

Passwords use Argon2id with parameters recorded in configuration. Email/reset tokens are random, hashed at rest, single use and expiring. Suspended/deactivated users cannot create sessions or use existing ones. Authentication responses and logs never expose secrets or token hashes.

Required security tests include refresh rotation/replay, revocation, permission denial, cross-merchant IDOR, suspended accounts, validation/rate limits and audit behavior.
