import Fastify from 'fastify';
import cors from '@fastify/cors';
import { dqiAuditModel, generateWidget, runAnalytics, SyntheticConnector } from '@dqi/analytics-core';

export function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 32_768 });
  void app.register(cors, { origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ });
  app.get('/health', async () => ({ status: 'ok', aiRequired: false }));
  app.get('/api/v1/semantic-model', async () => dqiAuditModel);
  app.get('/api/v1/demo/catalogue', async () => ({
    metrics: ['AI usage events', 'Passed events', 'Pass rate', 'Blocked events', 'Blocked rate', 'Events requiring review', 'DQI Enforce policy hits', 'EU AI Act control finding rate', 'Assessment pass rate', 'High-risk AI events', 'Ungrounded response rate', 'Integration error rate'],
    dimensions: ['Integration', 'Model', 'Environment', 'DQI Enforce policy', 'Decision', 'Severity', 'Overall'],
    policies: ['Prompt Injection Shield', 'PII & Data Leakage', 'EU AI Act High-Risk Use', 'Grounding & Citation', 'Toxicity & Harm', 'Model Allowlist'],
    visuals: ['Line', 'Area', 'Bar', 'Donut', 'KPI scorecard'],
    palettes: ['Aurora', 'Ocean', 'Sunset', 'Mono']
  }));
  app.post('/api/v1/widgets/generate', async (request, reply) => {
    try {
      return generateWidget(request.body);
    } catch (error) {
      request.log.warn({ error }, 'widget_prompt_rejected');
      return reply.code(400).send({ error: 'INVALID_WIDGET_PROMPT', message: error instanceof Error ? error.message : 'Invalid prompt' });
    }
  });
  app.post('/api/v1/analytics/query', async (request, reply) => {
    try {
      return await runAnalytics(request.body, dqiAuditModel, new SyntheticConnector(), 'elasticsearch');
    } catch (error) {
      request.log.warn({ error }, 'analytics_request_rejected');
      return reply.code(400).send({ error: 'INVALID_ANALYTICS_REQUEST', message: error instanceof Error ? error.message : 'Invalid request' });
    }
  });
  return app;
}
