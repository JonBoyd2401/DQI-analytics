# System context specification

**Purpose/scope:** Safely turn governed analytics intent into evidence-backed visual results. Natural-language input and production identity integration are later slices.

**Inputs/outputs:** A strict semantic request enters the API; a validated analytics response containing points, query, freshness, warnings, and provenance exits.

**Invariants:** AI output is never directly executable; connectors are read-only; every point has provenance; the deterministic path works without AI.

**Failure/observability:** Invalid requests return a stable 400 error and a warning log. Source failures will be classified separately from validation failures.

**Acceptance:** A natural-language EU AI Act audit request produces weekly points for governed integrations, exposes its semantic plan and backend query, and rejects unknown IDs or extra properties.

**Related:** PRD-001–006, QUERY-001–002, SEC-001.
