import { randomUUID } from 'node:crypto';
import { generatedWidgetSchema, widgetGenerationResponseSchema, widgetPromptSchema, type GeneratedWidget, type WidgetGenerationResponse } from '@dqi/contracts';
import { SyntheticDqiAuditDatabase, type DemoAggregateRow } from './demo-database.js';

type MetricId = GeneratedWidget['metric']['id'];
type DimensionId = GeneratedWidget['dimension']['id'];

const metrics: Record<MetricId, { label: string; format: GeneratedWidget['metric']['format']; aliases: string[]; calculation: string }> = {
  'metric.ai_requests': { label: 'AI usage', format: 'integer', aliases: ['ai usage', 'ai requests', 'requests', 'usage', 'interactions'], calculation: 'SUM(ai_requests)' },
  'metric.policy_violation_rate': { label: 'EU AI Act control finding rate', format: 'percentage', aliases: ['eu ai act finding rate', 'control finding rate', 'policy violation rate', 'policy violations', 'violations'], calculation: 'SUM(policy_violations) / SUM(ai_requests) × 100' },
  'metric.assessment_pass_rate': { label: 'Assessment pass rate', format: 'percentage', aliases: ['assessment pass rate', 'assessment results', 'assessments', 'pass rate'], calculation: 'SUM(assessments_passed) / SUM(assessments) × 100' },
  'metric.high_risk_events': { label: 'High-risk AI events', format: 'integer', aliases: ['high-risk events', 'high risk events', 'critical events', 'risk events'], calculation: 'SUM(high_risk_events)' },
  'metric.ungrounded_response_rate': { label: 'Ungrounded response rate', format: 'percentage', aliases: ['ungrounded response rate', 'ungrounded responses', 'hallucination rate', 'hallucinations'], calculation: 'SUM(ungrounded_responses) / SUM(ai_requests) × 100' },
  'metric.integration_error_rate': { label: 'Integration error rate', format: 'percentage', aliases: ['integration error rate', 'integration errors', 'failed integrations', 'errors'], calculation: 'SUM(integration_errors) / SUM(ai_requests) × 100' }
};

const dimensions: Record<DimensionId, { label: string; aliases: string[]; field?: keyof DemoAggregateRow }> = {
  'dimension.integration': { label: 'Integration', aliases: ['by integration', 'split by integration', 'integrations', 'application'], field: 'integration' },
  'dimension.model': { label: 'Model', aliases: ['by model', 'split by model', 'models'], field: 'model' },
  'dimension.environment': { label: 'Environment', aliases: ['by environment', 'split by environment', 'environments'], field: 'environment' },
  'dimension.overall': { label: 'Overall', aliases: ['overall', 'total', 'no split'] }
};

function firstMatch<T extends string>(text: string, catalogue: Record<T, { aliases: string[] }>, fallback: T): T {
  const match = (Object.entries(catalogue) as [T, { aliases: string[] }][]).find(([, item]) => item.aliases.some((alias) => text.includes(alias)));
  return match?.[0] ?? fallback;
}

function metricValue(metricId: MetricId, rows: DemoAggregateRow[]): number {
  const total = (field: keyof DemoAggregateRow) => rows.reduce((sum, row) => sum + Number(row[field]), 0);
  const requests = total('aiRequests');
  switch (metricId) {
    case 'metric.ai_requests': return requests;
    case 'metric.policy_violation_rate': return requests ? total('policyViolations') / requests * 100 : 0;
    case 'metric.assessment_pass_rate': return total('assessments') ? total('assessmentsPassed') / total('assessments') * 100 : 0;
    case 'metric.high_risk_events': return total('highRiskEvents');
    case 'metric.ungrounded_response_rate': return requests ? total('ungroundedResponses') / requests * 100 : 0;
    case 'metric.integration_error_rate': return requests ? total('integrationErrors') / requests * 100 : 0;
  }
}

function requestedWeeks(text: string): 4 | 12 | 26 {
  const found = text.match(/(?:last|past|over)\s+(\d+)\s+weeks?/i);
  const value = found?.[1] ? Number(found[1]) : 12;
  return value <= 4 ? 4 : value <= 12 ? 12 : 26;
}

function customTitle(prompt: string): string | undefined {
  return prompt.match(/(?:title(?:d)?|called)\s+["“']([^"”']+)["”']/i)?.[1]?.trim();
}

export function interpretWidgetPrompt(raw: unknown): GeneratedWidget {
  const { prompt } = widgetPromptSchema.parse(raw);
  const text = prompt.toLowerCase();
  const metricId = firstMatch(text, metrics, 'metric.ai_requests');
  const dimensionId = firstMatch(text, dimensions, text.includes('overall') ? 'dimension.overall' : 'dimension.integration');
  const chartType = text.includes('donut') || text.includes('pie') ? 'donut' : text.includes('bar') ? 'bar' : text.includes('area') ? 'area' : text.includes('kpi') || text.includes('scorecard') || text.includes('big number') ? 'kpi' : 'line';
  const palette = text.includes('sunset') || text.includes('warm') || text.includes('orange') ? 'sunset' : text.includes('ocean') || text.includes('blue') ? 'ocean' : text.includes('mono') || text.includes('minimal') ? 'mono' : 'aurora';
  const theme = text.includes('light') ? 'light' : 'dark';
  const weeks = requestedWeeks(text);
  const unsupportedRequests = ['3d', 'map', 'scatter', 'forecast'].filter((term) => text.includes(term)).map((term) => `${term} visualisation is not enabled in this governed demo`);
  const metric = metrics[metricId];
  const dimension = dimensions[dimensionId];
  return generatedWidgetSchema.parse({
    id: randomUUID(), version: '1.0', title: customTitle(prompt) ?? `${metric.label} by ${dimension.label}`,
    metric: { id: metricId, label: metric.label, format: metric.format },
    dimension: { id: dimensionId, label: dimension.label }, timeRangeWeeks: weeks, grain: 'week',
    visual: { chartType, palette, theme, showLegend: !text.includes('hide legend'), smooth: !text.includes('straight lines') },
    interpretation: [metric.label, `${dimension.label} breakdown`, `Last ${weeks} complete weeks`, 'EU AI Act audit policy', `${chartType} chart`, `${palette} palette`, `${theme} theme`],
    unsupportedRequests
  });
}

export function generateWidget(raw: unknown, now = new Date('2026-07-01T10:00:00.000Z')): WidgetGenerationResponse {
  const { prompt } = widgetPromptSchema.parse(raw);
  const widget = interpretWidgetPrompt(raw);
  const database = new SyntheticDqiAuditDatabase(now);
  const periods = [...new Set(database.rows.map((row) => row.week))].slice(-widget.timeRangeWeeks);
  const field = dimensions[widget.dimension.id].field;
  const keys = field ? [...new Set(database.rows.map((row) => String(row[field])))] : ['Overall'];
  const series = keys.map((key) => ({
    key: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label: key,
    points: periods.map((period) => {
      const rows = database.rows.filter((row) => row.week === period && (!field || String(row[field]) === key));
      return { period, label: new Date(period).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), value: Number(metricValue(widget.metric.id, rows).toFixed(2)) };
    })
  }));
  const allCurrent = database.rows.filter((row) => row.week === periods.at(-1));
  const allPrevious = database.rows.filter((row) => row.week === periods.at(-2));
  const current = Number(metricValue(widget.metric.id, allCurrent).toFixed(2));
  const previous = Number(metricValue(widget.metric.id, allPrevious).toFixed(2));
  const changePercent = previous ? Number(((current - previous) / previous * 100).toFixed(1)) : 0;
  return widgetGenerationResponseSchema.parse({
    widget, series,
    query: {
      naturalLanguage: prompt,
      semanticPlan: { metricId: widget.metric.id, dimensionId: widget.dimension.id, timeRangeWeeks: widget.timeRangeWeeks, grain: 'week', policyPack: 'eu-ai-act-2024-1689' },
      elasticsearchDsl: {
        size: 0,
        query: { bool: { filter: [{ term: { policy_pack: 'eu-ai-act-2024-1689' } }, { range: { event_timestamp: { gte: `now-${widget.timeRangeWeeks}w/w`, lt: 'now/w' } } }] } },
        aggs: { by_week: { date_histogram: { field: 'event_timestamp', calendar_interval: 'week' }, aggs: { by_dimension: { terms: { field: `${widget.dimension.id.replace('dimension.', '')}.keyword`, size: 20 } } } } }
      }
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
