# CX Insight Blocks

An open-source, deterministic analytics foundation for contact centres. Natural-language AI may propose semantic requests, but only validated application code can compile and execute analytics queries.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:3001` and uses a deterministic synthetic connector by default.

## Deploy the demo to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/JonBoyd2401/DQI-analytics)

The root `render.yaml` provisions one free Docker web service. In production, Fastify serves both the API and compiled React app from the same origin. The `/health` endpoint is used for deployment health checks.

## Verification

```bash
npm run check
```

See [the current vertical slice](docs/delivery/current-slice.md) and [architecture](docs/architecture/overview.md).
