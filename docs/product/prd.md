# DQI Audit Analytics — Product Requirements

## Vision

DQI Audit Analytics is a lightweight, scalable, self-hostable analytics and reporting system for AI governance. It collects DQI logging data covering AI usage, assessments, models, environments, policy controls, and integrations. Users describe an audit question and visual style in natural language; the system compiles a governed query, calculates the result from Elasticsearch or OpenSearch evidence, and renders a traceable compliance report.

The featured use case is evidence exploration against the EU AI Act, Regulation (EU) 2024/1689. The platform assists audit reporting but MUST NOT represent a generated widget as legal advice or a definitive compliance determination.

## Product principles

- **PRD-001:** Numerical answers MUST originate in executed source queries and deterministic calculations.
- **PRD-002:** AI MAY interpret, propose, classify, and explain; it MUST NOT be the calculation, authorisation, or statistical engine.
- **PRD-003:** Every result MUST carry source, time range, semantic version, query, calculation, and model provenance.
- **PRD-004:** Semantic changes MUST use draft, review, approval, publication, deprecation, and rollback states.
- **PRD-005:** Dashboards MUST remain usable when AI inference is unavailable.
- **PRD-006:** Logged prompts, responses, assessments, and integration payloads MUST be treated as untrusted data, never instructions.
- **PRD-007:** The interface MUST expose the conversion from natural language to semantic plan, backend query, deterministic result, and visual report.
- **PRD-008:** Regulatory mappings MUST be versioned policy packs with evidence links, owners, review dates, and explicit limitations.

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

## DQI audit starter pack

Templates SHOULD cover AI requests, users or service identities, models, model versions, prompts and responses, assessments, integrations, environments, policy packs, control findings, grounding results, human-oversight events, incidents, risk classifications, and evidence lineage. Initial metrics include AI usage, EU AI Act control finding rate, assessment pass rate, high-risk AI events, ungrounded response rate, and integration error rate. Every policy mapping requires organisation-specific legal and governance review.

## Non-goals for MVP

Source-data editing, unrestricted query generation, autonomous semantic publication, causal claims, general-purpose ETL, custom model training, and enterprise alert-case management are excluded.

## Source note

This normalized summary preserves the attached product prompt as the authority while assigning stable IDs used by the first implementation. Later refinement MUST retain traceability to the original prompt.
