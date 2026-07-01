import Fastify from 'fastify';
import cors from '@fastify/cors';
import { contactCentreModel, runAnalytics, SyntheticConnector } from '@cx/analytics-core';

export function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 32_768 });
  void app.register(cors, { origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ });
  app.get('/health', async () => ({ status: 'ok', aiRequired: false }));
  app.get('/api/v1/semantic-model', async () => contactCentreModel);
  app.post('/api/v1/analytics/query', async (request, reply) => {
    try {
      return await runAnalytics(request.body, contactCentreModel, new SyntheticConnector(), 'elasticsearch');
    } catch (error) {
      request.log.warn({ error }, 'analytics_request_rejected');
      return reply.code(400).send({ error: 'INVALID_ANALYTICS_REQUEST', message: error instanceof Error ? error.message : 'Invalid request' });
    }
  });
  return app;
}
