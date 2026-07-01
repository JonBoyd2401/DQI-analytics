import { queryIrSchema, semanticRequestSchema, type QueryIr, type SemanticModel, type SemanticRequest } from '@cx/contracts';

const ranges = { last_4_complete_weeks: 4, last_12_complete_weeks: 12, last_26_complete_weeks: 26 } as const;

export function normalizeCompleteWeeks(range: keyof typeof ranges, now: Date): { from: string; to: string } {
  const to = new Date(now);
  const day = (to.getUTCDay() + 6) % 7;
  to.setUTCDate(to.getUTCDate() - day);
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - ranges[range] * 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function planQuery(raw: unknown, model: SemanticModel, now = new Date()): QueryIr {
  const request: SemanticRequest = semanticRequestSchema.parse(raw);
  if (request.metricIds.length !== 1) throw new Error('The first slice supports exactly one metric');
  const metric = model.metrics.find((item) => item.id === request.metricIds[0]);
  if (!metric) throw new Error(`Unknown or unauthorised metric: ${request.metricIds[0]}`);
  const dimensions = request.dimensionIds.map((id) => {
    const dimension = model.dimensions.find((item) => item.id === id);
    if (!dimension || dimension.type !== 'keyword') throw new Error(`Unknown or unsupported dimension: ${id}`);
    return { id: dimension.id, field: dimension.field, type: 'keyword' as const };
  });
  const timeDimension = model.dimensions.find((item) => item.id === request.time.fieldId);
  if (!timeDimension || timeDimension.type !== 'date') throw new Error(`Unknown time dimension: ${request.time.fieldId}`);
  if (!timeDimension.allowedGrains?.includes(request.time.grain)) throw new Error(`Unsupported time grain: ${request.time.grain}`);
  const time = normalizeCompleteWeeks(request.time.range, now);
  return queryIrSchema.parse({
    version: '1.0', source: model.source,
    metric: { id: metric.id, operation: metric.aggregation, unit: metric.unit }, dimensions,
    time: { fieldId: timeDimension.id, field: timeDimension.field, ...time, grain: request.time.grain },
    limits: { maxBuckets: 1000, timeoutMs: 5000 }
  });
}
