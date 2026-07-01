import { semanticModelSchema, type SemanticModel } from '@dqi/contracts';

export const dqiAuditModel: SemanticModel = semanticModelSchema.parse({
  id: 'model.dqi_audit',
  version: '1.0.0',
  status: 'published',
  source: { connectionId: 'connection.demo', index: 'dqi-audit-events-demo' },
  metrics: [{
    id: 'metric.ai_requests', label: 'AI usage',
    description: 'Count of governed AI usage events in the audit time range.', aggregation: 'count', unit: 'events'
  }],
  dimensions: [
    { id: 'dimension.integration', label: 'Integration', field: 'integration.keyword', type: 'keyword' },
    { id: 'dimension.event_timestamp', label: 'Event timestamp', field: 'event_timestamp', type: 'date', allowedGrains: ['day', 'week', 'month'] }
  ]
});
