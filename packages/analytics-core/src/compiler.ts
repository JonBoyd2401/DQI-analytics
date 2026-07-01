import type { BackendKind, QueryIr } from '@dqi/contracts';

export function compileQuery(query: QueryIr, backend: BackendKind): Record<string, unknown> {
  const dimension = query.dimensions[0];
  if (!dimension) throw new Error('At least one dimension is required');
  const calendarInterval = query.time.grain;
  const body = {
    size: 0,
    timeout: `${query.limits.timeoutMs}ms`,
    query: { range: { [query.time.field]: { gte: query.time.from, lt: query.time.to } } },
    aggs: {
      timeline: {
        date_histogram: { field: query.time.field, calendar_interval: calendarInterval, min_doc_count: 0, extended_bounds: { min: query.time.from, max: query.time.to } },
        aggs: { by_dimension: { terms: { field: dimension.field, size: Math.min(100, query.limits.maxBuckets) } } }
      }
    }
  };
  return backend === 'elasticsearch' ? body : { ...body, _cx_backend: 'opensearch' };
}
