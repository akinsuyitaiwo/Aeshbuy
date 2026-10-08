# API Specification

The REST API is URI-versioned under `/api/v1`; Swagger is served at `/docs` outside production when enabled. JSON DTOs reject unknown fields. Protected operations use Bearer access tokens. Critical writes require `Idempotency-Key` and bind the key to the authenticated actor, operation and request hash.

Errors have this stable envelope:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "correlationId": "uuid"
  },
  "timestamp": "2026-10-08T00:00:00.000Z",
  "path": "/api/v1/example"
}
```

List endpoints use cursor pagination where records change frequently and bounded page/limit pagination otherwise. Filtering/sorting fields are allow-listed. Dates are ISO 8601 UTC. Monetary responses use decimal strings plus ISO currency codes.

Implemented foundation endpoints:

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/v1/health/live` | None | Process liveness |
| GET | `/api/v1/health/ready` | None | Required dependency readiness |

Domain endpoints are added to this document and Swagger only with corresponding working services and tests.

## Identity and customer endpoints

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | None | Register customer and create session |
| POST | `/api/v1/auth/login` | None | Authenticate and create session |
| POST | `/api/v1/auth/refresh` | Refresh token body | Rotate refresh token |
| POST | `/api/v1/auth/logout` | Refresh token body | Revoke owning session |
| POST | `/api/v1/auth/verify-email` | One-time token body | Verify email |
| POST | `/api/v1/auth/forgot-password` | None | Queue reset request without account disclosure |
| POST | `/api/v1/auth/reset-password` | One-time token body | Change password and revoke sessions |
| GET | `/api/v1/auth/me` | Bearer | Current identity/profile |
| GET | `/api/v1/auth/sessions` | Bearer | List own sessions |
| DELETE | `/api/v1/auth/sessions/:id` | Bearer | Revoke an owned session |
| DELETE | `/api/v1/auth/account` | Bearer | Deactivate account and revoke sessions |
| GET/PATCH | `/api/v1/customers/me` | Bearer | Read/update customer profile |
| POST | `/api/v1/customers/me/addresses` | Bearer | Create owned address |
| PATCH/DELETE | `/api/v1/customers/me/addresses/:id` | Bearer | Update/delete owned address |
