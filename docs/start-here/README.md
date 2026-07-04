# Start here: DQI Analytics

DQI Analytics is the governed reporting and evidence-exploration product in the DQI platform. It turns assessment, enforcement, usage, integration and control evidence into deterministic calculations and traceable visual reports.

## Read in this order

1. [Platform architecture](platform-architecture.md) — the complete DQI product and technical context.
2. [Architecture overview](../architecture/overview.md) — this repository's modular-monolith design.
3. [Security model](../specifications/security-model.md) — trust boundaries and production controls.
4. [Current delivery slice](../delivery/current-slice.md) — what is implemented today.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`; the API runs on `http://localhost:3001`.

## Product boundary

Analytics owns semantic models, governed query planning, deterministic calculation, visual reports and provenance. It does not own customer identity, payment status, tenant membership, assessment scoring or runtime enforcement. Those capabilities are supplied by the platform, Assess and Enforce respectively.

The current deployment is a demonstration using synthetic evidence. Production work must add verified tenant context, entitlements and tenant-bound connectors before customer data is connected.
