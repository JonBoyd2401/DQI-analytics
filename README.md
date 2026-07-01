# DQI Audit Analytics

An open-source, deterministic audit analytics foundation for AI governance. Users describe an audit KPI and visual style in natural language; DQI compiles that request into a governed semantic plan and Elasticsearch/OpenSearch query, calculates the answer from audit evidence, and renders a traceable compliance report.

The demonstration uses entirely fabricated DQI usage, assessment, model, environment, integration, and control-finding events. Its featured policy profile is the EU AI Act (Regulation (EU) 2024/1689). It supports audit exploration and is not legal advice or a determination of compliance.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:3001`. Try prompts such as:

> Show the EU AI Act control finding rate by integration for the last 12 weeks as a smooth area chart with an aurora palette.

The governed language compiler also understands DQI usage outcomes and filters. For example: "Which DQI Enforce policy picked up critical events in production?", "Compare blocked vs passed AI usage by decision", or "Show privacy leaks across teams in prod last month as a bar chart."

After generating a report, the live view editor accepts follow-up prompts such as "change to sunset bars", "move the x axis to the top and rotate labels 45 degrees", or "use a light theme and hide grid lines." These refinements preserve the governed KPI, filters, query evidence, and calculated series.


## Qwen semantic mapping

The widget API can use Qwen as a probabilistic semantic mapper before deterministic validation. Qwen is only allowed to choose the closest published metric, dimension, intent, filters, and visual hints from the governed catalogue. It never produces executable Elasticsearch/OpenSearch DSL.

Set these optional environment variables locally or in Render:

```bash
QWEN_BASE_URL=https://your-qwen-openai-compatible-endpoint
QWEN_API_KEY=optional-token
QWEN_MODEL=JonBoyd2401/Qwen3.6
```

If `QWEN_BASE_URL` is not set or the model call fails, the app falls back to the deterministic synonym matcher so the demo remains runnable.
## Deploy the demo to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/JonBoyd2401/DQI-analytics)

The root `render.yaml` provisions one free Docker web service. In production, Fastify serves both the API and compiled React app from the same origin. The `/health` endpoint is used for deployment health checks.

## Verification

```bash
npm run check
```

See [the current vertical slice](docs/delivery/current-slice.md) and [architecture](docs/architecture/overview.md).

