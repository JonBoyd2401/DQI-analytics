# Architecture overview

The MVP is a TypeScript modular monolith with separately runnable web and API processes. Shared packages own contracts and deterministic analytics. PostgreSQL metadata and real connectors follow behind stable interfaces; the first slice uses versioned fixtures and a synthetic connector.

```mermaid
flowchart LR
  U["Contact-centre user"] --> W["React web app"]
  W --> A["Analytics API"]
  A --> V["Runtime validation and policy"]
  V --> S["Semantic layer"]
  S --> Q["Query planner and IR"]
  Q --> C["ES / OpenSearch compiler"]
  C --> D["Read-only connector"]
  D --> R["Deterministic results"]
  R --> P["Provenance and widget"]
  L["Qwen provider (optional)"] -. "proposes structured intent" .-> V
```

The AI boundary is deliberately upstream of validation. Dashboards never depend on model availability.
