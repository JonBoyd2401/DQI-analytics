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

## Deploy the demo to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/JonBoyd2401/DQI-analytics)

The root `render.yaml` provisions one free Docker web service. In production, Fastify serves both the API and compiled React app from the same origin. The `/health` endpoint is used for deployment health checks.

## Verification

```bash
npm run check
```

See [the current vertical slice](docs/delivery/current-slice.md) and [architecture](docs/architecture/overview.md).
