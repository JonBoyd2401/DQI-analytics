# Security model specification

All external/model input is untrusted. Strict schemas reject additional properties. Semantic IDs are resolved against authorised models; source connection binding is checked before execution. Query resources are bounded. Production scope adds OIDC, tenant context, RBAC/ABAC, document/field controls, PII masking, audit retention, and secret management.

Failure is closed and returns non-sensitive stable error codes. Logs record rejection categories, not credentials or contact content.

**Related:** SEC-001, PRD-006.
