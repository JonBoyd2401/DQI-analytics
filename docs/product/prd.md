# CX Insight Blocks — Product Requirements

## Vision

CX Insight Blocks is a lightweight, scalable, self-hostable open-source analytics and dashboarding system for contact centres. It connects to Elasticsearch and OpenSearch, answers natural-language questions using deterministic source queries, manages a governed semantic layer, composes reusable dashboard widgets, and detects trends under reviewable natural-language policies.

## Product principles

- **PRD-001:** Numerical answers MUST originate in executed source queries and deterministic calculations.
- **PRD-002:** AI MAY interpret, propose, classify, and explain; it MUST NOT be the calculation, authorisation, or statistical engine.
- **PRD-003:** Every result MUST carry source, time range, semantic version, query, calculation, and model provenance.
- **PRD-004:** Semantic changes MUST use draft, review, approval, publication, deprecation, and rollback states.
- **PRD-005:** Dashboards MUST remain usable when AI inference is unavailable.
- **PRD-006:** Free text and transcripts MUST be treated as untrusted data, never instructions.

## MVP requirements

- **SEM-001:** Govern metrics, dimensions, time fields, versions, ownership, and lifecycle in human-readable definitions.
- **QUERY-001:** Compile authorised semantic requests into a typed backend-neutral query IR before backend DSL.
- **QUERY-002:** Support capability-aware Elasticsearch and OpenSearch read-only connectors.
- **CALC-001:** Evaluate allowlisted typed expression ASTs without `eval` or arbitrary execution.
- **WIDGET-001:** Create versioned widgets specifying KPI, dimensions, filters, time, visual encoding, and provenance.
- **DASH-001:** Compose responsive dashboards from independently versioned widgets.
- **AI-001:** Use Qwen3.6 through a provider-independent gateway whose structured output is runtime validated.
- **AI-002:** Monitor schema failures, semantic accuracy, faithfulness, latency, prompt/model versions, and drift.
- **POLICY-001:** Compile natural-language policies into reviewable deterministic detection specifications.
- **SEC-001:** Enforce tenant, source, field, and document policies outside the model.
- **OBS-001:** Emit audit events and operational telemetry without unnecessary personal data.

## Contact-centre starter pack

Templates SHOULD cover contacts, customers, agents, teams, queues, channels, products, reasons, complaints, surveys, cases, transfers, outcomes, journeys, and transcript classifications. Suggested metrics include volume, handling time, first-contact resolution, repeat contacts, transfers, abandonment, service level, CSAT, NPS, complaints, escalation, sentiment, hold time, resolution time, cost, containment, occupancy, and quality. Every template requires organisation-specific approval.

## Non-goals for MVP

Source-data editing, unrestricted query generation, autonomous semantic publication, causal claims, general-purpose ETL, custom model training, and enterprise alert-case management are excluded.

## Source note

This normalized summary preserves the attached product prompt as the authority while assigning stable IDs used by the first implementation. Later refinement MUST retain traceability to the original prompt.
