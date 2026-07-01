import { semanticModelSchema, type SemanticModel } from '@cx/contracts';

export const contactCentreModel: SemanticModel = semanticModelSchema.parse({
  id: 'model.contact_centre',
  version: '1.0.0',
  status: 'published',
  source: { connectionId: 'connection.demo', index: 'contact-centre-demo' },
  metrics: [{
    id: 'metric.contact_volume', label: 'Contact volume',
    description: 'Count of contact records in the governed time range.', aggregation: 'count', unit: 'contacts'
  }],
  dimensions: [
    { id: 'dimension.team', label: 'Team', field: 'team.keyword', type: 'keyword' },
    { id: 'dimension.contact_started_at', label: 'Contact started at', field: 'contact_started_at', type: 'date', allowedGrains: ['day', 'week', 'month'] }
  ]
});
