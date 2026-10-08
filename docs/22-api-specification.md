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
