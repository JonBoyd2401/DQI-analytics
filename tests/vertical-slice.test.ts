import { describe, expect, it } from 'vitest';
import { compileQuery, contactCentreModel, evaluate, explain, normalizeCompleteWeeks, planQuery, runAnalytics, SyntheticConnector, type Expression } from '@cx/analytics-core';

const validRequest = { metricIds: ['metric.contact_volume'], dimensionIds: ['dimension.team'], time: { fieldId: 'dimension.contact_started_at', range: 'last_12_complete_weeks', grain: 'week' }, visualisationHint: 'line' };
const now = new Date('2026-07-01T10:00:00.000Z');

describe('deterministic analytics vertical slice', () => {
  it('normalises to 12 complete Monday-based weeks', () => {
    expect(normalizeCompleteWeeks('last_12_complete_weeks', now)).toEqual({ from: '2026-04-06T00:00:00.000Z', to: '2026-06-29T00:00:00.000Z' });
  });
  it('plans only governed semantic identifiers', () => {
    const query = planQuery(validRequest, contactCentreModel, now);
    expect(query.metric.id).toBe('metric.contact_volume');
    expect(() => planQuery({ ...validRequest, metricIds: ['metric.secret'] }, contactCentreModel, now)).toThrow(/Unknown or unauthorised/);
  });
  it('rejects extra model-authored properties', () => {
    expect(() => planQuery({ ...validRequest, queryDsl: { match_all: {} } }, contactCentreModel, now)).toThrow();
  });
  it('compiles constrained Elasticsearch and OpenSearch queries', () => {
    const ir = planQuery(validRequest, contactCentreModel, now);
    expect(JSON.stringify(compileQuery(ir, 'elasticsearch'))).toContain('date_histogram');
    expect(compileQuery(ir, 'opensearch')).toHaveProperty('_cx_backend', 'opensearch');
  });
  it('executes synthetic data with complete provenance', async () => {
    const response = await runAnalytics(validRequest, contactCentreModel, new SyntheticConnector(), 'elasticsearch', now);
    expect(response.points).toHaveLength(36);
    expect(response.points.every((point) => Boolean(point.provenanceId))).toBe(true);
    expect(response.errors).toEqual([]);
  });
});

describe('safe calculation foundation', () => {
  const complaintRate: Expression = { type: 'binary', operator: 'multiply', left: { type: 'binary', operator: 'divide', left: { type: 'reference', name: 'complaints' }, right: { type: 'reference', name: 'completed_contacts' } }, right: { type: 'literal', value: 100 } };
  it('calculates a known complaint rate deterministically', () => { expect(evaluate(complaintRate, { complaints: 25, completed_contacts: 500 })).toBe(5); expect(explain(complaintRate)).toContain('complaints'); });
  it('returns null for division by zero', () => { expect(evaluate(complaintRate, { complaints: 2, completed_contacts: 0 })).toBeNull(); });
});
