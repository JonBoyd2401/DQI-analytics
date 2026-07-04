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

export const aiConnectionSchema = z.object({
  baseUrl: z.string().url().max(500),
  apiKey: z.string().max(1000).optional(),
  modelId: z.string().trim().min(1).max(200)
}).strict();

export const widgetPromptSchema = z.object({
  prompt: z.string().trim().min(10).max(1000),
  aiMode: z.enum(['auto', 'deterministic', 'custom']).default('auto'),
  aiConnection: aiConnectionSchema.optional()
}).strict().refine((value) => value.aiMode !== 'custom' || Boolean(value.aiConnection), { message: 'A custom AI connection is required in custom mode', path: ['aiConnection'] });

export const widgetRefinementRequestSchema = z.object({
  originalPrompt: z.string().trim().min(10).max(4000),
  editPrompt: z.string().trim().min(3).max(500),
  aiMode: z.enum(['auto', 'deterministic', 'custom']).default('auto'),
  aiConnection: aiConnectionSchema.optional()
}).strict().refine((value) => value.aiMode !== 'custom' || Boolean(value.aiConnection), { message: 'A custom AI connection is required in custom mode', path: ['aiConnection'] });

export const widgetVisualSchema = z.object({
  chartType: z.enum(['line', 'area', 'bar', 'horizontalBar', 'stackedBar', 'donut', 'kpi']),
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
    id: z.enum([
      'metric.ai_requests', 'metric.passed_events', 'metric.pass_rate', 'metric.blocked_events', 'metric.blocked_rate', 'metric.reviewed_events',
      'metric.enforce_policy_hits', 'metric.policy_violation_rate', 'metric.assessment_pass_rate', 'metric.high_risk_events',
      'metric.high_risk_usage_rate', 'metric.ungrounded_response_rate', 'metric.integration_error_rate', 'metric.prompt_injection_attempts',
      'metric.pii_exposure_attempts', 'metric.total_tokens', 'metric.estimated_cost', 'metric.avg_latency_ms', 'metric.p95_latency_ms',
      'metric.unique_users', 'metric.human_overrides', 'metric.override_rate', 'metric.audit_coverage_rate', 'metric.evidence_completeness_rate',
      'metric.model_drift_score', 'metric.exception_approvals', 'metric.unresolved_findings', 'metric.retention_breaches', 'metric.sla_breach_rate',
      'metric.review_rate', 'metric.assessment_failure_rate', 'metric.grounded_response_rate', 'metric.integration_errors',
      'metric.prompt_injection_rate', 'metric.pii_exposure_rate', 'metric.average_tokens_per_event', 'metric.cost_per_event',
      'metric.evidence_gap_rate', 'metric.unresolved_finding_rate', 'metric.sla_breaches', 'metric.events_per_user'
    ]),
    label: z.string(),
    format: z.enum(['integer', 'duration', 'percentage', 'score', 'currency'])
  }).strict(),
  dimension: z.object({
    id: z.enum([
      'dimension.integration', 'dimension.model', 'dimension.environment', 'dimension.enforce_policy', 'dimension.decision', 'dimension.severity',
      'dimension.risk_tier', 'dimension.region', 'dimension.business_unit', 'dimension.user_role', 'dimension.data_class', 'dimension.regulation',
      'dimension.control', 'dimension.vendor', 'dimension.system', 'dimension.overall'
    ]),
    label: z.string()
  }).strict(),
  timeRangeWeeks: z.union([z.literal(4), z.literal(12), z.literal(26)]),
  grain: z.enum(['none', 'week']),
  filters: z.array(z.object({
    field: z.enum(['integration', 'model', 'environment', 'enforcePolicy', 'decision', 'severity', 'riskTier', 'region', 'businessUnit', 'userRole', 'dataClass', 'regulation', 'control', 'vendor', 'system']),
    operator: z.literal('equals'),
    value: z.string()
  }).strict()).max(12),
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
    semanticPlan: z.object({
      metricId: z.string(),
      dimensionId: z.string(),
      intent: z.enum(['trend', 'breakdown', 'comparison', 'top_n', 'exception_review', 'coverage_report']),
      timeRangeWeeks: z.number(),
      grain: z.enum(['none', 'week']),
      policyPack: z.literal('eu-ai-act-2024-1689'),
      filters: z.array(z.object({ field: z.string(), operator: z.literal('equals'), value: z.string() }).strict())
    }).strict(),
    elasticsearchDsl: z.record(z.unknown())
  }).strict(),
  semanticEngine: z.object({
    mode: z.enum(['ai-proposal-validated', 'deterministic-fallback']),
    modelId: z.string().min(1).max(200),
    confidence: z.number().min(0).max(1),
    validated: z.literal(true),
    safeguards: z.array(z.string())
  }).strict(),
  summary: z.object({
    current: z.number(),
    previous: z.number(),
    changePercent: z.number(),
    direction: z.enum(['up', 'down', 'flat'])
  }).strict(),
  provenance: z.object({
    evidenceType: z.enum(['demonstration', 'verified-connected']),
    verificationStatus: z.enum(['demonstration-only', 'query-verified']),
    source: z.string().min(1),
    backend: z.enum(['demonstration', 'elasticsearch', 'opensearch']),
    indexName: z.string().min(1),
    datasetVersion: z.string().min(1),
    generatedAt: z.string().datetime(),
    recordsScanned: z.number().int().positive(),
    queryFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    calculation: z.string(),
    regulatoryProfile: z.literal('EU AI Act — Regulation (EU) 2024/1689'),
    disclaimer: z.string()
  }).strict()
}).strict();

export type WidgetPrompt = z.infer<typeof widgetPromptSchema>;
export type WidgetRefinementRequest = z.infer<typeof widgetRefinementRequestSchema>;
export type GeneratedWidget = z.infer<typeof generatedWidgetSchema>;
export type WidgetGenerationResponse = z.infer<typeof widgetGenerationResponseSchema>;
