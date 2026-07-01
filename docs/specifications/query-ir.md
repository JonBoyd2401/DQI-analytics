# Query IR specification

**Purpose:** Separate business intent from backend DSL. The versioned `QueryIr` contains source binding, one governed metric, governed dimensions, normalized half-open UTC time bounds, grain, and enforced limits.

Invariants: no scripts, raw DSL, credentials, user text, or arbitrary fields; maximum 5,000 buckets and 30-second timeout at schema level; first slice tightens these to 1,000 and five seconds. Compilation is pure and deterministic.

Failures reject before connector execution. Plans and compiled queries are included in provenance-safe responses for authorised inspection.

**Related:** QUERY-001, QUERY-002, PRD-003.
