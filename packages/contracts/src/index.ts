import { z } from 'zod';

const strictId = z.string().regex(/^[a-z]+\.[a-z0-9_]+$/);
export const timeGrainSchema = z.enum(['day', 'week', 'month']);

export const semanticRequestSchema = z.object({
  metricIds: z.array(strictId).min(1).max(5),
  dimensionIds: z.array(strictId).max(3),
  time: z.object({
    fieldId: strictId,
    range: z.enum(['last_4_complete_weeks', 'last_12_complete_weeks', 'last_26_complete_weeks']),
    grain: timeGrainSchema
  }).strict(),
  visualisationHint: z.enum(['line', 'bar', 'table']).optional()
}).strict();

export const semanticModelSchema = z.object({
  id: strictId,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: z.literal('published'),
  source: z.object({ connectionId: strictId, index: z.string().min(1) }).strict(),
  metrics: z.array(z.object({
    id: strictId, label: z.string(), description: z.string(), aggregation: z.literal('count'), unit: z.literal('contacts')
  }).strict()),
  dimensions: z.array(z.object({
    id: strictId, label: z.string(), field: z.string(), type: z.enum(['keyword', 'date']), allowedGrains: z.array(timeGrainSchema).optional()
  }).strict())
}).strict();

export const queryIrSchema = z.object({
  version: z.literal('1.0'),
  source: z.object({ connectionId: strictId, index: z.string() }).strict(),
  metric: z.object({ id: strictId, operation: z.literal('count'), unit: z.literal('contacts') }).strict(),
  dimensions: z.array(z.object({ id: strictId, field: z.string(), type: z.literal('keyword') }).strict()).max(3),
  time: z.object({ fieldId: strictId, field: z.string(), from: z.string().datetime(), to: z.string().datetime(), grain: timeGrainSchema }).strict(),
  limits: z.object({ maxBuckets: z.number().int().min(1).max(5000), timeoutMs: z.number().int().min(100).max(30000) }).strict()
}).strict();

export const analyticsPointSchema = z.object({
  timestamp: z.string().datetime(),
  dimensionId: strictId,
  dimensionValue: z.string(),
  metricId: strictId,
  value: z.number().nonnegative(),
  provenanceId: z.string().uuid()
}).strict();

export const analyticsResponseSchema = z.object({
  requestId: z.string().uuid(),
  queryIr: queryIrSchema,
  executedQuery: z.record(z.unknown()),
  backend: z.enum(['synthetic', 'elasticsearch', 'opensearch']),
  semanticModelVersion: z.string(),
  widgetSpecVersion: z.literal('1.0'),
  executedAt: z.string().datetime(),
  dataFreshness: z.string().datetime(),
  points: z.array(analyticsPointSchema),
  warnings: z.array(z.string()),
  errors: z.array(z.string())
}).strict();

export type SemanticRequest = z.infer<typeof semanticRequestSchema>;
export type SemanticModel = z.infer<typeof semanticModelSchema>;
export type QueryIr = z.infer<typeof queryIrSchema>;
export type AnalyticsPoint = z.infer<typeof analyticsPointSchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;

export type BackendKind = 'elasticsearch' | 'opensearch';

export interface Connector {
  readonly id: string;
  execute(query: QueryIr, compiledQuery: Record<string, unknown>, signal?: AbortSignal): Promise<{
    points: Omit<AnalyticsPoint, 'provenanceId'>[];
    dataFreshness: string;
  }>;
}

export interface AIProvider {
  readonly modelId: string;
  health(signal?: AbortSignal): Promise<boolean>;
  proposeSemanticRequest(input: string, signal?: AbortSignal): Promise<unknown>;
}
