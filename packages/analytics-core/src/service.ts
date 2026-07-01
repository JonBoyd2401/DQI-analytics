import { randomUUID } from 'node:crypto';
import { analyticsResponseSchema, type AnalyticsResponse, type BackendKind, type Connector, type SemanticModel } from '@cx/contracts';
import { compileQuery } from './compiler.js';
import { planQuery } from './planner.js';

export async function runAnalytics(input: unknown, model: SemanticModel, connector: Connector, backend: BackendKind = 'elasticsearch', now = new Date()): Promise<AnalyticsResponse> {
  const queryIr = planQuery(input, model, now);
  if (connector.id !== queryIr.source.connectionId) throw new Error('Connector is not authorised for this semantic model');
  const executedQuery = compileQuery(queryIr, backend);
  const result = await connector.execute(queryIr, executedQuery);
  const requestId = randomUUID();
  return analyticsResponseSchema.parse({
    requestId, queryIr, executedQuery, backend: 'synthetic', semanticModelVersion: model.version,
    widgetSpecVersion: '1.0', executedAt: now.toISOString(), dataFreshness: result.dataFreshness,
    points: result.points.map((point) => ({ ...point, provenanceId: randomUUID() })), warnings: ['Synthetic demonstration data'], errors: []
  });
}
