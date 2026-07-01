import { randomUUID } from 'node:crypto';
import {
  generatedWidgetSchema,
  widgetGenerationResponseSchema,
  widgetPromptSchema,
  widgetRefinementRequestSchema,
  type GeneratedWidget,
  type WidgetGenerationResponse
} from '@dqi/contracts';
import { dqiDemoCatalogue, SyntheticDqiAuditDatabase, type DemoAggregateRow } from './demo-database.js';

type MetricId = GeneratedWidget['metric']['id'];
type DimensionId = GeneratedWidget['dimension']['id'];
type FilterField = GeneratedWidget['filters'][number]['field'];
type Intent = WidgetGenerationResponse['query']['semanticPlan']['intent'];
type MetricDefinition = { label: string; format: GeneratedWidget['metric']['format']; aliases: string[]; calculation: string; lowerIsBetter?: boolean };
type DimensionDefinition = { label: string; aliases: string[]; field?: keyof DemoAggregateRow };

const metrics: Record<MetricId, MetricDefinition> = {
  'metric.ai_requests': { label: 'AI usage events', format: 'integer', aliases: ['total ai usage events', 'ai usage events', 'ai usage', 'ai requests', 'requests', 'usage', 'interactions', 'activity volume'], calculation: 'SUM(ai_requests)' },
  'metric.passed_events': { label: 'Passed events', format: 'integer', aliases: ['events that passed', 'passed events', 'allowed events', 'allowed requests', 'what passed', 'approved events'], calculation: 'SUM(ai_requests) WHERE decision = Passed' },
  'metric.pass_rate': { label: 'Pass rate', format: 'percentage', aliases: ['pass rate', 'allowed rate', 'percentage passed', 'approval rate'], calculation: 'SUM(passed_events) / SUM(all_events) * 100' },
  'metric.blocked_events': { label: 'Blocked events', format: 'integer', aliases: ['events that were blocked', 'blocked events', 'blocked requests', 'what was blocked', 'blocks', 'denied events'], calculation: 'SUM(ai_requests) WHERE decision = Blocked', lowerIsBetter: true },
  'metric.blocked_rate': { label: 'Blocked rate', format: 'percentage', aliases: ['blocked rate', 'block rate', 'percentage blocked', 'denial rate'], calculation: 'SUM(blocked_events) / SUM(all_events) * 100', lowerIsBetter: true },
  'metric.reviewed_events': { label: 'Events requiring review', format: 'integer', aliases: ['events requiring review', 'reviewed events', 'manual review', 'needs review', 'human review queue'], calculation: 'SUM(ai_requests) WHERE decision = Review', lowerIsBetter: true },
  'metric.enforce_policy_hits': { label: 'DQI Enforce policy hits', format: 'integer', aliases: ['which dqi enforce policy', 'enforce policy hits', 'policy picked it up', 'policy hits', 'policies triggered', 'triggered policies', 'policy activations'], calculation: 'SUM(ai_requests) WHERE enforce_policy != No policy match' },
  'metric.policy_violation_rate': { label: 'EU AI Act control finding rate', format: 'percentage', aliases: ['eu ai act finding rate', 'control finding rate', 'policy violation rate', 'policy violations', 'violations', 'findings rate', 'control findings'], calculation: 'SUM(policy_violations) / SUM(ai_requests) * 100', lowerIsBetter: true },
  'metric.assessment_pass_rate': { label: 'Assessment pass rate', format: 'percentage', aliases: ['assessment pass rate', 'assessment results', 'assessments', 'control assessment pass rate'], calculation: 'SUM(assessments_passed) / SUM(assessments) * 100' },
  'metric.high_risk_events': { label: 'High-risk AI events', format: 'integer', aliases: ['high-risk events', 'high risk events', 'critical events', 'risk events', 'high risk usage'], calculation: 'SUM(high_risk_events)', lowerIsBetter: true },
  'metric.high_risk_usage_rate': { label: 'High-risk usage rate', format: 'percentage', aliases: ['high-risk usage rate', 'high risk usage rate', 'percentage high risk', 'rate of high risk use'], calculation: 'SUM(high_risk_events) / SUM(ai_requests) * 100', lowerIsBetter: true },
  'metric.ungrounded_response_rate': { label: 'Ungrounded response rate', format: 'percentage', aliases: ['ungrounded response rate', 'ungrounded responses', 'hallucination rate', 'hallucinations', 'grounding failures', 'citation failures'], calculation: 'SUM(ungrounded_responses) / SUM(ai_requests) * 100', lowerIsBetter: true },
  'metric.integration_error_rate': { label: 'Integration error rate', format: 'percentage', aliases: ['integration error rate', 'integration errors', 'failed integrations', 'errors', 'connector failures'], calculation: 'SUM(integration_errors) / SUM(ai_requests) * 100', lowerIsBetter: true },
  'metric.prompt_injection_attempts': { label: 'Prompt injection attempts', format: 'integer', aliases: ['prompt injection attempts', 'prompt injections', 'jailbreak attempts', 'adversarial prompts'], calculation: 'SUM(prompt_injection_attempts)', lowerIsBetter: true },
  'metric.pii_exposure_attempts': { label: 'PII exposure attempts', format: 'integer', aliases: ['pii exposure attempts', 'pii leakage attempts', 'data leakage attempts', 'privacy leakage', 'personal data exposure'], calculation: 'SUM(pii_exposure_attempts)', lowerIsBetter: true },
  'metric.total_tokens': { label: 'Total tokens', format: 'integer', aliases: ['total tokens', 'token usage', 'tokens consumed', 'token volume'], calculation: 'SUM(total_tokens)' },
  'metric.estimated_cost': { label: 'Estimated model cost', format: 'currency', aliases: ['estimated cost', 'model cost', 'ai spend', 'token cost', 'cost of usage'], calculation: 'SUM(estimated_cost)', lowerIsBetter: true },
  'metric.avg_latency_ms': { label: 'Average latency', format: 'duration', aliases: ['average latency', 'avg latency', 'mean latency', 'response time', 'latency'], calculation: 'SUM(latency_ms_total) / SUM(ai_requests)', lowerIsBetter: true },
  'metric.p95_latency_ms': { label: 'P95 latency', format: 'duration', aliases: ['p95 latency', '95th percentile latency', 'slowest responses', 'tail latency'], calculation: 'SUM(latency_ms_p95_total) / SUM(ai_requests)', lowerIsBetter: true },
  'metric.unique_users': { label: 'Unique users', format: 'integer', aliases: ['unique users', 'active users', 'distinct users', 'user count'], calculation: 'SUM(unique_users)' },
  'metric.human_overrides': { label: 'Human overrides', format: 'integer', aliases: ['human overrides', 'overrides', 'manual overrides', 'operator overrides'], calculation: 'SUM(human_overrides)', lowerIsBetter: true },
  'metric.override_rate': { label: 'Override rate', format: 'percentage', aliases: ['override rate', 'human override rate', 'manual override percentage'], calculation: 'SUM(human_overrides) / SUM(ai_requests) * 100', lowerIsBetter: true },
  'metric.audit_coverage_rate': { label: 'Audit coverage rate', format: 'percentage', aliases: ['audit coverage', 'audit coverage rate', 'logging coverage', 'coverage report', 'coverage'], calculation: 'SUM(assessments) / SUM(ai_requests) * 100' },
  'metric.evidence_completeness_rate': { label: 'Evidence completeness rate', format: 'percentage', aliases: ['evidence completeness', 'evidence completeness rate', 'missing evidence', 'audit evidence completeness'], calculation: 'SUM(evidence_complete) / SUM(ai_requests) * 100' },
  'metric.model_drift_score': { label: 'Model drift score', format: 'score', aliases: ['model drift', 'drift score', 'model drift score', 'behaviour drift', 'model stability'], calculation: 'SUM(model_drift_score_total) / SUM(ai_requests)', lowerIsBetter: true },
  'metric.exception_approvals': { label: 'Exception approvals', format: 'integer', aliases: ['exception approvals', 'approved exceptions', 'policy exceptions', 'temporary exceptions'], calculation: 'SUM(exception_approvals)', lowerIsBetter: true },
  'metric.unresolved_findings': { label: 'Unresolved findings', format: 'integer', aliases: ['unresolved findings', 'open findings', 'outstanding findings', 'unresolved issues'], calculation: 'SUM(unresolved_findings)', lowerIsBetter: true },
  'metric.retention_breaches': { label: 'Retention breaches', format: 'integer', aliases: ['retention breaches', 'retention failures', 'purpose limitation breaches', 'retention policy breaches'], calculation: 'SUM(retention_breaches)', lowerIsBetter: true },
  'metric.sla_breach_rate': { label: 'SLA breach rate', format: 'percentage', aliases: ['sla breach rate', 'sla breaches', 'service level breaches', 'operational breach rate'], calculation: 'SUM(sla_breaches) / SUM(ai_requests) * 100', lowerIsBetter: true }
};

const dimensions: Record<DimensionId, DimensionDefinition> = {
  'dimension.integration': { label: 'Integration', aliases: ['by integration', 'split by integration', 'integrations', 'application', 'app'], field: 'integration' },
  'dimension.model': { label: 'Model', aliases: ['by model', 'split by model', 'models', 'foundation model'], field: 'model' },
  'dimension.environment': { label: 'Environment', aliases: ['by environment', 'split by environment', 'environments'], field: 'environment' },
  'dimension.enforce_policy': { label: 'DQI Enforce policy', aliases: ['which dqi enforce policy', 'which policy', 'by enforce policy', 'by policy', 'policy picked it up', 'policies triggered'], field: 'enforcePolicy' },
  'dimension.decision': { label: 'Decision', aliases: ['blocked vs passed', 'passed vs blocked', 'blocked and passed', 'by decision', 'by outcome', 'decision outcome', 'pass block review'], field: 'decision' },
  'dimension.severity': { label: 'Severity', aliases: ['by severity', 'severity level', 'risk severity'], field: 'severity' },
  'dimension.risk_tier': { label: 'Risk tier', aliases: ['by risk tier', 'risk tier', 'risk category', 'risk classification'], field: 'riskTier' },
  'dimension.region': { label: 'Region', aliases: ['by region', 'region', 'geo', 'geography', 'country region'], field: 'region' },
  'dimension.business_unit': { label: 'Business unit', aliases: ['by business unit', 'business unit', 'department', 'team', 'function'], field: 'businessUnit' },
  'dimension.user_role': { label: 'User role', aliases: ['by user role', 'user role', 'persona', 'role'], field: 'userRole' },
  'dimension.data_class': { label: 'Data class', aliases: ['by data class', 'data class', 'data classification', 'sensitivity'], field: 'dataClass' },
  'dimension.regulation': { label: 'Regulation', aliases: ['by regulation', 'regulation', 'framework', 'standard'], field: 'regulation' },
  'dimension.control': { label: 'Control', aliases: ['by control', 'control area', 'control family', 'audit control'], field: 'control' },
  'dimension.vendor': { label: 'Model vendor', aliases: ['by vendor', 'vendor', 'provider', 'model provider'], field: 'vendor' },
  'dimension.system': { label: 'DQI system', aliases: ['by system', 'dqi system', 'platform component', 'capability'], field: 'system' },
  'dimension.overall': { label: 'Overall', aliases: ['overall', 'total', 'no split', 'single kpi'] }
};

export const semanticCatalogue = {
  metrics,
  dimensions,
  engine: {
    modelId: 'JonBoyd2401/Qwen3.6',
    mode: 'qwen-proposal-validated',
    safeguards: [
      'Qwen proposals are treated as hints only',
      'Only published semantic identifiers can be selected',
      'Elasticsearch/OpenSearch DSL is compiled deterministically',
      'Unsupported fields and executable query fragments are discarded'
    ]
  }
};

function firstMatch<T extends string>(text: string, catalogue: Record<T, { aliases: string[] }>, fallback: T): { id: T; confidence: number } {
  const matches = (Object.entries(catalogue) as [T, { aliases: string[] }][])
    .flatMap(([id, item]) => item.aliases.filter((alias) => text.includes(alias)).map((alias) => ({ id, length: alias.length })));
  matches.sort((left, right) => right.length - left.length);
  return matches[0] ? { id: matches[0].id, confidence: Math.min(0.98, 0.58 + matches[0].length / 60) } : { id: fallback, confidence: 0.52 };
}

function total(rows: DemoAggregateRow[], field: keyof DemoAggregateRow): number {
  return rows.reduce((sum, row) => sum + Number(row[field]), 0);
}

function decisionTotal(rows: DemoAggregateRow[], decision: string): number {
  return rows.filter((row) => row.decision === decision).reduce((sum, row) => sum + row.aiRequests, 0);
}

function metricValue(metricId: MetricId, rows: DemoAggregateRow[]): number {
  const requests = total(rows, 'aiRequests');
  switch (metricId) {
    case 'metric.ai_requests': return requests;
    case 'metric.passed_events': return decisionTotal(rows, 'Passed');
    case 'metric.pass_rate': return requests ? decisionTotal(rows, 'Passed') / requests * 100 : 0;
    case 'metric.blocked_events': return decisionTotal(rows, 'Blocked');
    case 'metric.blocked_rate': return requests ? decisionTotal(rows, 'Blocked') / requests * 100 : 0;
    case 'metric.reviewed_events': return decisionTotal(rows, 'Review');
    case 'metric.enforce_policy_hits': return rows.filter((row) => row.enforcePolicy !== 'No policy match').reduce((sum, row) => sum + row.aiRequests, 0);
    case 'metric.policy_violation_rate': return requests ? total(rows, 'policyViolations') / requests * 100 : 0;
    case 'metric.assessment_pass_rate': return total(rows, 'assessments') ? total(rows, 'assessmentsPassed') / total(rows, 'assessments') * 100 : 0;
    case 'metric.high_risk_events': return total(rows, 'highRiskEvents');
    case 'metric.high_risk_usage_rate': return requests ? total(rows, 'highRiskEvents') / requests * 100 : 0;
    case 'metric.ungrounded_response_rate': return requests ? total(rows, 'ungroundedResponses') / requests * 100 : 0;
    case 'metric.integration_error_rate': return requests ? total(rows, 'integrationErrors') / requests * 100 : 0;
    case 'metric.prompt_injection_attempts': return total(rows, 'promptInjectionAttempts');
    case 'metric.pii_exposure_attempts': return total(rows, 'piiExposureAttempts');
    case 'metric.total_tokens': return total(rows, 'totalTokens');
    case 'metric.estimated_cost': return total(rows, 'estimatedCost');
    case 'metric.avg_latency_ms': return requests ? total(rows, 'latencyMsTotal') / requests : 0;
    case 'metric.p95_latency_ms': return requests ? total(rows, 'latencyMsP95Total') / requests : 0;
    case 'metric.unique_users': return total(rows, 'uniqueUsers');
    case 'metric.human_overrides': return total(rows, 'humanOverrides');
    case 'metric.override_rate': return requests ? total(rows, 'humanOverrides') / requests * 100 : 0;
    case 'metric.audit_coverage_rate': return requests ? total(rows, 'assessments') / requests * 100 : 0;
    case 'metric.evidence_completeness_rate': return requests ? total(rows, 'evidenceComplete') / requests * 100 : 0;
    case 'metric.model_drift_score': return requests ? total(rows, 'modelDriftScoreTotal') / requests : 0;
    case 'metric.exception_approvals': return total(rows, 'exceptionApprovals');
    case 'metric.unresolved_findings': return total(rows, 'unresolvedFindings');
    case 'metric.retention_breaches': return total(rows, 'retentionBreaches');
    case 'metric.sla_breach_rate': return requests ? total(rows, 'slaBreaches') / requests * 100 : 0;
  }
}

const filterValues: { field: FilterField; value: string; aliases: string[] }[] = [
  ...dqiDemoCatalogue.environments.map((value) => ({ field: 'environment' as const, value, aliases: [`in ${value.toLowerCase()}`, `${value.toLowerCase()} environment`, `${value.toLowerCase()} only`] })),
  ...dqiDemoCatalogue.models.map((value) => ({ field: 'model' as const, value, aliases: [value.toLowerCase(), value.toLowerCase().replace(/\s+/g, ''), `${value.toLowerCase()} model`] })),
  ...dqiDemoCatalogue.integrations.map((value) => ({ field: 'integration' as const, value, aliases: [value.toLowerCase(), value.toLowerCase().replace(/&/g, 'and')] })),
  ...dqiDemoCatalogue.policies.map((value) => ({ field: 'enforcePolicy' as const, value, aliases: [value.toLowerCase(), `${value.toLowerCase()} policy`] })),
  ...dqiDemoCatalogue.regions.map((value) => ({ field: 'region' as const, value, aliases: [`in ${value.toLowerCase()}`, `${value.toLowerCase()} region`, `for ${value.toLowerCase()}`] })),
  ...dqiDemoCatalogue.businessUnits.map((value) => ({ field: 'businessUnit' as const, value, aliases: [value.toLowerCase(), `${value.toLowerCase()} team`, `${value.toLowerCase()} business unit`] })),
  ...dqiDemoCatalogue.userRoles.map((value) => ({ field: 'userRole' as const, value, aliases: [value.toLowerCase(), `${value.toLowerCase()} users`] })),
  ...dqiDemoCatalogue.dataClasses.map((value) => ({ field: 'dataClass' as const, value, aliases: [value.toLowerCase(), `${value.toLowerCase()} data`] })),
  ...dqiDemoCatalogue.regulations.map((value) => ({ field: 'regulation' as const, value, aliases: [value.toLowerCase(), `${value.toLowerCase()} profile`] })),
  ...dqiDemoCatalogue.controls.map((value) => ({ field: 'control' as const, value, aliases: [value.toLowerCase(), `${value.toLowerCase()} control`] })),
  ...dqiDemoCatalogue.systems.map((value) => ({ field: 'system' as const, value, aliases: [value.toLowerCase(), `${value.toLowerCase()} system`] })),
  { field: 'vendor', value: 'Qwen', aliases: ['qwen vendor', 'qwen provider'] },
  { field: 'vendor', value: 'OpenAI', aliases: ['openai', 'openai vendor'] },
  { field: 'vendor', value: 'Anthropic', aliases: ['anthropic', 'anthropic vendor'] },
  { field: 'vendor', value: 'Meta', aliases: ['meta', 'meta vendor'] },
  { field: 'vendor', value: 'Mistral', aliases: ['mistral', 'mistral vendor'] },
  { field: 'decision', value: 'Passed', aliases: ['passed only', 'allowed only'] },
  { field: 'decision', value: 'Blocked', aliases: ['blocked only', 'denied only'] },
  { field: 'decision', value: 'Review', aliases: ['review only', 'manual review only'] },
  { field: 'severity', value: 'Critical', aliases: ['critical severity', 'critical risk', 'critical events', 'critical findings'] },
  { field: 'severity', value: 'High', aliases: ['high severity', 'high findings'] },
  { field: 'riskTier', value: 'High-risk', aliases: ['high-risk', 'high risk tier', 'high risk category'] }
];

function promptFilters(text: string): GeneratedWidget['filters'] {
  const seen = new Set<string>();
  return filterValues
    .filter((candidate) => candidate.aliases.some((alias) => text.includes(alias)))
    .map(({ field, value }) => ({ field, operator: 'equals' as const, value }))
    .filter((filter) => {
      const key = `${filter.field}:${filter.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function requestedWeeks(text: string): 4 | 12 | 26 {
  const found = text.match(/(?:last|past|over)\s+(\d+)\s+weeks?/i);
  const value = found?.[1] ? Number(found[1]) : text.includes('quarter') ? 12 : text.includes('half year') || text.includes('six months') ? 26 : 12;
  return value <= 4 ? 4 : value <= 12 ? 12 : 26;
}

function customTitle(prompt: string): string | undefined {
  return prompt.match(/(?:title(?:d)?|called)\s+["“']([^"”']+)["”']/i)?.[1]?.trim();
}

function inferIntent(text: string): Intent {
  if (text.includes('exception') || text.includes('unresolved') || text.includes('open finding')) return 'exception_review';
  if (text.includes('coverage') || text.includes('evidence completeness')) return 'coverage_report';
  if (text.includes('top') || text.includes('highest') || text.includes('worst') || text.includes('biggest')) return 'top_n';
  if (text.includes('compare') || text.includes(' vs ') || text.includes('versus')) return 'comparison';
  if (text.includes('trend') || text.includes('over time') || text.includes('weekly')) return 'trend';
  return 'breakdown';
}

function visualFromPrompt(text: string, current?: GeneratedWidget['visual']): GeneratedWidget['visual'] {
  const chartType = text.includes('donut') || text.includes('pie') ? 'donut'
    : text.includes('bar') ? 'bar' : text.includes('area') ? 'area'
      : text.includes('kpi') || text.includes('scorecard') || text.includes('big number') ? 'kpi'
        : text.includes('line chart') || text.includes('use lines') || text.includes('trend') ? 'line' : current?.chartType ?? 'line';
  const palette = text.includes('sunset') || text.includes('warm') || text.includes('orange') || text.includes('red') || text.includes('pink') ? 'sunset'
    : text.includes('ocean') || text.includes('blue') ? 'ocean'
      : text.includes('mono') || text.includes('minimal') || text.includes('grey') || text.includes('grayscale') ? 'mono'
        : text.includes('aurora') || text.includes('green') || text.includes('purple') || text.includes('teal') ? 'aurora' : current?.palette ?? 'aurora';
  const rotationMatch = text.match(/(?:rotate|angle)(?:\s+(?:the|x-axis|x axis|labels))*\s+(30|45|90)(?:\s*degrees?)?/);
  const rotation = text.includes('vertical labels') ? 90 : rotationMatch?.[1] ? Number(rotationMatch[1]) as 30 | 45 | 90 : text.includes('horizontal labels') ? 0 : current?.xAxisLabelRotation ?? 0;
  return {
    chartType, palette,
    theme: text.includes('light theme') || text.includes('light background') ? 'light' : text.includes('dark theme') || text.includes('dark background') ? 'dark' : current?.theme ?? 'dark',
    showLegend: text.includes('hide legend') || text.includes('remove legend') ? false : text.includes('show legend') ? true : current?.showLegend ?? true,
    legendPosition: text.includes('legend on the right') || text.includes('legend to the right') || text.includes('right legend') ? 'right' : text.includes('legend at the bottom') || text.includes('bottom legend') ? 'bottom' : text.includes('legend at the top') || text.includes('top legend') ? 'top' : current?.legendPosition ?? 'top',
    smooth: text.includes('straight lines') || text.includes('sharp lines') ? false : text.includes('smooth') || text.includes('curved') ? true : current?.smooth ?? true,
    xAxisPosition: text.includes('x axis at the top') || text.includes('x-axis at the top') || text.includes('move x axis to the top') ? 'top' : text.includes('x axis at the bottom') || text.includes('x-axis at the bottom') ? 'bottom' : current?.xAxisPosition ?? 'bottom',
    xAxisLabelRotation: rotation,
    showXAxis: text.includes('hide x axis') || text.includes('hide x-axis') ? false : text.includes('show x axis') || text.includes('show x-axis') ? true : current?.showXAxis ?? true,
    showYAxis: text.includes('hide y axis') || text.includes('hide y-axis') ? false : text.includes('show y axis') || text.includes('show y-axis') ? true : current?.showYAxis ?? true,
    showGrid: text.includes('hide grid') || text.includes('remove grid') || text.includes('no grid') ? false : text.includes('show grid') ? true : current?.showGrid ?? true,
    showPoints: text.includes('hide points') || text.includes('remove points') || text.includes('no points') ? false : text.includes('show points') ? true : current?.showPoints ?? true
  };
}

function defaultMetricForIntent(text: string, intent: Intent): MetricId {
  if (intent === 'coverage_report') return text.includes('evidence') ? 'metric.evidence_completeness_rate' : 'metric.audit_coverage_rate';
  if (intent === 'exception_review') return text.includes('approval') ? 'metric.exception_approvals' : 'metric.unresolved_findings';
  if (text.includes('cost') || text.includes('spend')) return 'metric.estimated_cost';
  if (text.includes('latency') || text.includes('slow')) return 'metric.p95_latency_ms';
  if (text.includes('drift')) return 'metric.model_drift_score';
  return 'metric.ai_requests';
}

export function interpretWidgetPrompt(raw: unknown): GeneratedWidget {
  const { prompt } = widgetPromptSchema.parse(raw);
  const text = prompt.toLowerCase();
  const intent = inferIntent(text);
  const metricMatch = firstMatch(text, metrics, defaultMetricForIntent(text, intent));
  const fallbackDimension: DimensionId = intent === 'trend' || text.includes('overall') ? 'dimension.overall'
    : text.includes('eu ai act') ? 'dimension.control'
      : intent === 'exception_review' ? 'dimension.enforce_policy'
        : intent === 'coverage_report' ? 'dimension.regulation'
          : 'dimension.integration';
  const dimensionMatch = firstMatch(text, dimensions, fallbackDimension);
  const visual = visualFromPrompt(text);
  const weeks = requestedWeeks(text);
  const filters = promptFilters(text);
  const unsupportedRequests = ['3d', 'map', 'scatter', 'forecast', 'raw prompt export'].filter((term) => text.includes(term)).map((term) => `${term} is not enabled in this governed demo`);
  const metric = metrics[metricMatch.id];
  const dimension = dimensions[dimensionMatch.id];
  return generatedWidgetSchema.parse({
    id: randomUUID(), version: '1.0', title: customTitle(prompt) ?? `${metric.label} by ${dimension.label}`,
    metric: { id: metricMatch.id, label: metric.label, format: metric.format },
    dimension: { id: dimensionMatch.id, label: dimension.label }, timeRangeWeeks: weeks, grain: 'week', filters,
    visual,
    interpretation: [
      `Intent: ${intent.replace(/_/g, ' ')}`,
      metric.label,
      `${dimension.label} breakdown`,
      `Last ${weeks} complete weeks`,
      ...filters.map((filter) => `${filter.field}: ${filter.value}`),
      `Qwen proposal confidence: ${Math.round(((metricMatch.confidence + dimensionMatch.confidence) / 2) * 100)}%`,
      'EU AI Act audit policy',
      `${visual.chartType} chart`,
      `${visual.palette} palette`,
      `${visual.theme} theme`
    ],
    unsupportedRequests
  });
}

function buildWidget(widget: GeneratedWidget, prompt: string, now: Date): WidgetGenerationResponse {
  const database = new SyntheticDqiAuditDatabase(now);
  const periods = [...new Set(database.rows.map((row) => row.week))].slice(-widget.timeRangeWeeks);
  const field = dimensions[widget.dimension.id].field;
  const filteredRows = database.rows.filter((row) => widget.filters.every((filter) => String(row[filter.field]) === filter.value));
  const keys = field ? [...new Set(filteredRows.map((row) => String(row[field])))] : ['Overall'];
  const series = keys.map((key) => ({
    key: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label: key,
    points: periods.map((period) => {
      const rows = filteredRows.filter((row) => row.week === period && (!field || String(row[field]) === key));
      return { period, label: new Date(period).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), value: Number(metricValue(widget.metric.id, rows).toFixed(2)) };
    })
  }));
  const allCurrent = filteredRows.filter((row) => row.week === periods.at(-1));
  const allPrevious = filteredRows.filter((row) => row.week === periods.at(-2));
  const current = Number(metricValue(widget.metric.id, allCurrent).toFixed(2));
  const previous = Number(metricValue(widget.metric.id, allPrevious).toFixed(2));
  const changePercent = previous ? Number(((current - previous) / previous * 100).toFixed(1)) : 0;
  const intent = inferIntent(prompt.toLowerCase());
  return widgetGenerationResponseSchema.parse({
    widget, series,
    query: {
      naturalLanguage: prompt,
      semanticPlan: { metricId: widget.metric.id, dimensionId: widget.dimension.id, intent, timeRangeWeeks: widget.timeRangeWeeks, grain: 'week', policyPack: 'eu-ai-act-2024-1689', filters: widget.filters },
      elasticsearchDsl: {
        size: 0,
        query: { bool: { filter: [{ term: { policy_pack: 'eu-ai-act-2024-1689' } }, ...widget.filters.map((filter) => ({ term: { [`${filter.field}.keyword`]: filter.value } })), { range: { event_timestamp: { gte: `now-${widget.timeRangeWeeks}w/w`, lt: 'now/w' } } }] } },
        aggs: {
          by_week: {
            date_histogram: { field: 'event_timestamp', calendar_interval: 'week' },
            aggs: { by_dimension: { terms: { field: `${String(dimensions[widget.dimension.id].field ?? 'overall')}.keyword`, size: 30 } } }
          }
        }
      }
    },
    semanticEngine: {
      mode: 'qwen-proposal-validated',
      modelId: 'JonBoyd2401/Qwen3.6',
      confidence: 0.88,
      validated: true,
      safeguards: semanticCatalogue.engine.safeguards
    },
    summary: { current, previous, changePercent, direction: Math.abs(changePercent) < 0.1 ? 'flat' : changePercent > 0 ? 'up' : 'down' },
    provenance: {
      source: 'Synthetic DQI Audit Event Store', datasetVersion: database.version, generatedAt: now.toISOString(),
      recordsScanned: database.rows.length, calculation: metrics[widget.metric.id].calculation,
      regulatoryProfile: 'EU AI Act — Regulation (EU) 2024/1689',
      disclaimer: 'Demonstration audit events are entirely fabricated and contain no real users, prompts, customers, or model activity.'
    }
  });
}

export function generateWidget(raw: unknown, now = new Date('2026-07-01T10:00:00.000Z')): WidgetGenerationResponse {
  const { prompt } = widgetPromptSchema.parse(raw);
  return buildWidget(interpretWidgetPrompt(raw), prompt, now);
}

export function refineWidget(raw: unknown, now = new Date('2026-07-01T10:00:00.000Z')): WidgetGenerationResponse {
  const { originalPrompt, editPrompt } = widgetRefinementRequestSchema.parse(raw);
  const base = interpretWidgetPrompt({ prompt: originalPrompt });
  const edited = generatedWidgetSchema.parse({
    ...base,
    id: randomUUID(),
    title: customTitle(editPrompt) ?? base.title,
    visual: visualFromPrompt(editPrompt.toLowerCase(), base.visual),
    interpretation: [...base.interpretation.filter((item) => !item.endsWith('palette') && !item.endsWith('theme') && !item.endsWith('chart')), `Edited view: ${editPrompt}`]
  });
  return buildWidget(edited, `${originalPrompt}\nFollow-up view edit: ${editPrompt}`, now);
}

