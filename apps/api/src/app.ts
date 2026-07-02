import Fastify from 'fastify';
import cors from '@fastify/cors';
import { dqiAuditModel, dqiDemoCatalogue, generateWidgetWithQwen, refineWidgetWithQwen, runAnalytics, semanticCatalogue, SyntheticConnector } from '@dqi/analytics-core';

export function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 32_768 });
  void app.register(cors, { origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ });
  app.get('/health', async () => ({ status: 'ok', aiRequired: false }));
  app.get('/api/v1/semantic-model', async () => dqiAuditModel);
  app.get('/api/v1/demo/catalogue', async () => ({
    semanticEngine: semanticCatalogue.engine,
    metrics: Object.values(semanticCatalogue.metrics).map((metric) => metric.label),
    dimensions: Object.values(semanticCatalogue.dimensions).map((dimension) => dimension.label),
    integrations: dqiDemoCatalogue.integrations,
    policies: dqiDemoCatalogue.policies,
    controls: dqiDemoCatalogue.controls,
    regulations: dqiDemoCatalogue.regulations,
    regions: dqiDemoCatalogue.regions,
    businessUnits: dqiDemoCatalogue.businessUnits,
    visuals: ['Line', 'Area', 'Column', 'Horizontal bar', 'Stacked bar', 'Donut', 'KPI scorecard'],
    palettes: ['Aurora', 'Ocean', 'Sunset', 'Mono']
  }));
  app.post('/api/v1/widgets/generate', async (request, reply) => {
    try {
      return await generateWidgetWithQwen(request.body);
    } catch (error) {
      request.log.warn({ error }, 'widget_prompt_rejected');
      return reply.code(400).send({ error: 'INVALID_WIDGET_PROMPT', message: error instanceof Error ? error.message : 'Invalid prompt' });
    }
  });
  app.post('/api/v1/widgets/refine', async (request, reply) => {
    try {
      return await refineWidgetWithQwen(request.body);
    } catch (error) {
      request.log.warn({ error }, 'widget_refinement_rejected');
      return reply.code(400).send({ error: 'INVALID_WIDGET_REFINEMENT', message: error instanceof Error ? error.message : 'Invalid view edit' });
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
