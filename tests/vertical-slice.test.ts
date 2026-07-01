import { describe, expect, it } from 'vitest';
import { compileQuery, dqiAuditModel, evaluate, explain, generateWidget, interpretWidgetPrompt, normalizeCompleteWeeks, planQuery, refineWidget, runAnalytics, SyntheticConnector, type Expression } from '@dqi/analytics-core';

const validRequest = { metricIds: ['metric.ai_requests'], dimensionIds: ['dimension.integration'], time: { fieldId: 'dimension.event_timestamp', range: 'last_12_complete_weeks', grain: 'week' }, visualisationHint: 'line' };
const now = new Date('2026-07-01T10:00:00.000Z');

describe('deterministic analytics vertical slice', () => {
  it('normalises to 12 complete Monday-based weeks', () => {
    expect(normalizeCompleteWeeks('last_12_complete_weeks', now)).toEqual({ from: '2026-04-06T00:00:00.000Z', to: '2026-06-29T00:00:00.000Z' });
  });
  it('plans only governed semantic identifiers', () => {
    const query = planQuery(validRequest, dqiAuditModel, now);
    expect(query.metric.id).toBe('metric.ai_requests');
    expect(() => planQuery({ ...validRequest, metricIds: ['metric.secret'] }, dqiAuditModel, now)).toThrow(/Unknown or unauthorised/);
  });
  it('rejects extra model-authored properties', () => {
    expect(() => planQuery({ ...validRequest, queryDsl: { match_all: {} } }, dqiAuditModel, now)).toThrow();
  });
  it('compiles constrained Elasticsearch and OpenSearch queries', () => {
    const ir = planQuery(validRequest, dqiAuditModel, now);
    expect(JSON.stringify(compileQuery(ir, 'elasticsearch'))).toContain('date_histogram');
    expect(compileQuery(ir, 'opensearch')).toHaveProperty('_cx_backend', 'opensearch');
  });
  it('executes synthetic data with complete provenance', async () => {
    const response = await runAnalytics(validRequest, dqiAuditModel, new SyntheticConnector(), 'elasticsearch', now);
    expect(response.points).toHaveLength(36);
    expect(response.points.every((point) => Boolean(point.provenanceId))).toBe(true);
    expect(response.errors).toEqual([]);
  });
});

describe('safe calculation foundation', () => {
  const findingRate: Expression = { type: 'binary', operator: 'multiply', left: { type: 'binary', operator: 'divide', left: { type: 'reference', name: 'control_findings' }, right: { type: 'reference', name: 'ai_requests' } }, right: { type: 'literal', value: 100 } };
  it('calculates a known control finding rate deterministically', () => { expect(evaluate(findingRate, { control_findings: 25, ai_requests: 500 })).toBe(5); expect(explain(findingRate)).toContain('control_findings'); });
  it('returns null for division by zero', () => { expect(evaluate(findingRate, { control_findings: 2, ai_requests: 0 })).toBeNull(); });
});

describe('natural-language DQI audit widgets', () => {
  it('only introduces a date histogram for an explicit time trend', () => {
    const categorical = generateWidget({ prompt: 'Show blocked events by business unit for the last 12 weeks as a bar chart' });
    expect(categorical.widget.grain).toBe('none');
    expect(JSON.stringify(categorical.query.elasticsearchDsl)).not.toContain('date_histogram');

    const trend = generateWidget({ prompt: 'Trend blocked events over time for the last 12 weeks as a line chart' });
    expect(trend.widget.grain).toBe('week');
    expect(JSON.stringify(trend.query.elasticsearchDsl)).toContain('date_histogram');
  });

  it('compiles an EU AI Act prompt into a governed query and visual result', () => {
    const result = generateWidget({ prompt: 'Show EU AI Act policy violations by model for the last 12 weeks as an area chart with an ocean palette' }, now);
    expect(result.widget.metric.id).toBe('metric.policy_violation_rate');
    expect(result.widget.dimension.id).toBe('dimension.model');
    expect(result.widget.visual.chartType).toBe('area');
    expect(result.query.semanticPlan.policyPack).toBe('eu-ai-act-2024-1689');
    expect(result.series).toHaveLength(6);
    expect(result.provenance.recordsScanned).toBe(112320);
    expect(result.semanticEngine.modelId).toBe('JonBoyd2401/Qwen3.6');
  });

  it('understands decision comparisons and named governance filters', () => {
    const comparison = generateWidget({ prompt: 'Compare blocked vs passed AI usage by decision for the last 12 weeks as an area chart' }, now);
    expect(comparison.widget.metric.id).toBe('metric.ai_requests');
    expect(comparison.widget.dimension.id).toBe('dimension.decision');
    expect(comparison.series.map((series) => series.label)).toEqual(['Passed', 'Blocked', 'Review']);

    const policy = generateWidget({ prompt: 'Which DQI Enforce policy picked up critical events in production over the last 26 weeks as a donut chart' }, now);
    expect(policy.widget.metric.id).toBe('metric.enforce_policy_hits');
    expect(policy.widget.dimension.id).toBe('dimension.enforce_policy');
    expect(policy.widget.filters).toEqual(expect.arrayContaining([
      { field: 'environment', operator: 'equals', value: 'Production' },
      { field: 'severity', operator: 'equals', value: 'Critical' }
    ]));
    expect(JSON.stringify(policy.query.elasticsearchDsl)).toContain('environment.keyword');
  });

  it('refines visual styling without changing the governed report meaning', () => {
    const originalPrompt = 'Show blocked events by DQI Enforce policy for the last 12 weeks as a smooth area chart with an aurora palette';
    const original = generateWidget({ prompt: originalPrompt }, now);
    const refined = refineWidget({
      originalPrompt,
      editPrompt: 'Change to sunset bars, put the legend on the right, move x axis to the top, rotate labels 45 degrees, hide grid and remove points'
    }, now);
    expect(refined.widget.metric.id).toBe(original.widget.metric.id);
    expect(refined.widget.dimension.id).toBe(original.widget.dimension.id);
    expect(refined.widget.filters).toEqual(original.widget.filters);
    expect(refined.widget.visual).toMatchObject({ chartType: 'bar', palette: 'sunset', legendPosition: 'right', xAxisPosition: 'top', xAxisLabelRotation: 45, showGrid: false, showPoints: false });
    expect(refined.series).toEqual(original.series);
  });

  it('understands expanded governance catalogue prompts', () => {
    const drift = generateWidget({ prompt: 'Trend model drift score for Qwen 3.6 by business unit over the last 26 weeks with a dark line chart' }, now);
    expect(drift.widget.metric.id).toBe('metric.model_drift_score');
    expect(drift.widget.dimension.id).toBe('dimension.business_unit');
    expect(drift.widget.filters).toEqual(expect.arrayContaining([{ field: 'model', operator: 'equals', value: 'Qwen 3.6' }]));

    const evidence = generateWidget({ prompt: 'Show evidence completeness for EU AI Act by regulation in the EU region as a light KPI' }, now);
    expect(evidence.widget.metric.id).toBe('metric.evidence_completeness_rate');
    expect(evidence.widget.dimension.id).toBe('dimension.regulation');
    expect(evidence.query.semanticPlan.intent).toBe('coverage_report');
    expect(evidence.widget.filters).toEqual(expect.arrayContaining([
      { field: 'region', operator: 'equals', value: 'EU' },
      { field: 'regulation', operator: 'equals', value: 'EU AI Act' }
    ]));

    const injection = generateWidget({ prompt: 'Which DQI Enforce policy picked up prompt injection attempts in production for Qwen 3.6?' }, now);
    expect(injection.widget.metric.id).toBe('metric.prompt_injection_attempts');
    expect(injection.widget.dimension.id).toBe('dimension.enforce_policy');
    expect(JSON.stringify(injection.query.elasticsearchDsl)).toContain('model.keyword');
  });

  it('maps custom wording to the closest governed catalogue entry', () => {
    const custom = generateWidget({ prompt: 'How many privacy leaks are happening across teams in prod during the last month? make it a bar chart' }, now);
    expect(custom.widget.metric.id).toBe('metric.pii_exposure_attempts');
    expect(custom.widget.dimension.id).toBe('dimension.business_unit');
    expect(custom.widget.filters).toEqual(expect.arrayContaining([{ field: 'environment', operator: 'equals', value: 'Production' }]));
    expect(custom.widget.timeRangeWeeks).toBe(4);
  });

  it('uses a validated Qwen proposal to choose the closest catalogue ids', () => {
    const widget = interpretWidgetPrompt(
      { prompt: 'Build me the audit story for risky Qwen behaviour by department' },
      {
        metricId: 'metric.model_drift_score',
        dimensionId: 'dimension.business_unit',
        intent: 'trend',
        timeRangeWeeks: 26,
        filters: [{ field: 'vendor', value: 'Qwen' }],
        confidence: 0.91,
        rationale: 'Risky behaviour is closest to model drift, and department maps to business unit.'
      }
    );
    expect(widget.metric.id).toBe('metric.model_drift_score');
    expect(widget.dimension.id).toBe('dimension.business_unit');
    expect(widget.filters).toEqual(expect.arrayContaining([{ field: 'vendor', operator: 'equals', value: 'Qwen' }]));
    expect(widget.interpretation.join(' ')).toContain('Qwen rationale');
  });
});
