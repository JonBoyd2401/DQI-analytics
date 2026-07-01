# AI gateway specification

`AIProvider` exposes health and semantic-request proposal methods. Qwen3.6 is intended through an OpenAI-compatible endpoint. Its unknown output must pass `semanticRequestSchema` and semantic resolution before use.

Prompts, model IDs, latency, schema failures, and token counts require privacy-safe telemetry. Indexed content is data only. Live-model tests are opt-in; mocks cover CI. Model outage cannot prevent deterministic dashboards.

**Related:** AI-001, AI-002, PRD-002, PRD-005–006.
