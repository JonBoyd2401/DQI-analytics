# Semantic layer specification

**Purpose:** Govern business meaning. **Scope:** published metrics and dimensions in the first slice. **Non-goal:** natural-language publication.

The typed contract is `semanticModelSchema`. Stable IDs, semantic version, source binding, field type, unit, and allowed grains are mandatory. Requests resolve IDs only; raw source fields are never accepted from users or models.

Unknown, draft, deprecated, unauthorised, or type-incompatible references fail closed and emit a validation event. Acceptance is covered by `tests/vertical-slice.test.ts`.

**Related:** SEM-001, SEC-001.
