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
    id: strictId, label: z.string(), description: z.string(), aggregation: z.literal('count'), unit: z.enum(['contacts', 'events'])
  }).strict()),
  dimensions: z.array(z.object({
    id: strictId, label: z.string(), field: z.string(), type: z.enum(['keyword', 'date']), allowedGrains: z.array(timeGrainSchema).optional()
  }).strict())
}).strict();

export const queryIrSchema = z.object({
  version: z.literal('1.0'),
  source: z.object({ connectionId: strictId, index: z.string() }).strict(),
  metric: z.object({ id: strictId, operation: z.literal('count'), unit: z.enum(['contacts', 'events']) }).strict(),
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

export const widgetPromptSchema = z.object({
  prompt: z.string().trim().min(10).max(1000)
}).strict();

export const widgetRefinementRequestSchema = z.object({
  originalPrompt: z.string().trim().min(10).max(4000),
  editPrompt: z.string().trim().min(3).max(500)
}).strict();

export const widgetVisualSchema = z.object({
  chartType: z.enum(['line', 'area', 'bar', 'donut', 'kpi']),
  palette: z.enum(['aurora', 'ocean', 'sunset', 'mono']),
  theme: z.enum(['dark', 'light']),
  showLegend: z.boolean(),
  legendPosition: z.enum(['top', 'bottom', 'right']),
  smooth: z.boolean(),
  xAxisPosition: z.enum(['top', 'bottom']),
  xAxisLabelRotation: z.union([z.literal(0), z.literal(30), z.literal(45), z.literal(90)]),
  showXAxis: z.boolean(),
  showYAxis: z.boolean(),
  showGrid: z.boolean(),
  showPoints: z.boolean()
}).strict();

export const generatedWidgetSchema = z.object({
  id: z.string().uuid(),
  version: z.literal('1.0'),
  title: z.string(),
  metric: z.object({
    id: z.enum(['metric.ai_requests', 'metric.passed_events', 'metric.pass_rate', 'metric.blocked_events', 'metric.blocked_rate', 'metric.reviewed_events', 'metric.enforce_policy_hits', 'metric.policy_violation_rate', 'metric.assessment_pass_rate', 'metric.high_risk_events', 'metric.ungrounded_response_rate', 'metric.integration_error_rate']),
    label: z.string(),
    format: z.enum(['integer', 'duration', 'percentage', 'score'])
  }).strict(),
  dimension: z.object({
    id: z.enum(['dimension.integration', 'dimension.model', 'dimension.environment', 'dimension.enforce_policy', 'dimension.decision', 'dimension.severity', 'dimension.overall']),
    label: z.string()
  }).strict(),
  timeRangeWeeks: z.union([z.literal(4), z.literal(12), z.literal(26)]),
  grain: z.literal('week'),
  filters: z.array(z.object({ field: z.enum(['integration', 'model', 'environment', 'enforcePolicy', 'decision', 'severity']), operator: z.literal('equals'), value: z.string() }).strict()).max(8),
  visual: widgetVisualSchema,
  interpretation: z.array(z.string()),
  unsupportedRequests: z.array(z.string())
}).strict();

export const widgetSeriesSchema = z.object({
  key: z.string(),
  label: z.string(),
  points: z.array(z.object({ period: z.string().datetime(), label: z.string(), value: z.number() }).strict())
}).strict();

export const widgetGenerationResponseSchema = z.object({
  widget: generatedWidgetSchema,
  series: z.array(widgetSeriesSchema),
  query: z.object({
    naturalLanguage: z.string(),
    semanticPlan: z.object({ metricId: z.string(), dimensionId: z.string(), timeRangeWeeks: z.number(), grain: z.literal('week'), policyPack: z.literal('eu-ai-act-2024-1689'), filters: z.array(z.object({ field: z.string(), operator: z.literal('equals'), value: z.string() }).strict()) }).strict(),
    elasticsearchDsl: z.record(z.unknown())
  }).strict(),
  summary: z.object({
    current: z.number(),
    previous: z.number(),
    changePercent: z.number(),
    direction: z.enum(['up', 'down', 'flat'])
  }).strict(),
  provenance: z.object({
    source: z.literal('Synthetic DQI Audit Event Store'),
    datasetVersion: z.literal('2026.1'),
    generatedAt: z.string().datetime(),
    recordsScanned: z.number().int().positive(),
    calculation: z.string(),
    regulatoryProfile: z.literal('EU AI Act — Regulation (EU) 2024/1689'),
    disclaimer: z.string()
  }).strict()
}).strict();

export type WidgetPrompt = z.infer<typeof widgetPromptSchema>;
export type WidgetRefinementRequest = z.infer<typeof widgetRefinementRequestSchema>;
export type GeneratedWidget = z.infer<typeof generatedWidgetSchema>;
export type WidgetGenerationResponse = z.infer<typeof widgetGenerationResponseSchema>;
