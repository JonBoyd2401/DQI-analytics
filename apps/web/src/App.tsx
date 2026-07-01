import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { analyticsResponseSchema, type AnalyticsResponse } from '@dqi/contracts';

const request = {
  metricIds: ['metric.ai_requests'], dimensionIds: ['dimension.integration'],
  time: { fieldId: 'dimension.event_timestamp', range: 'last_12_complete_weeks', grain: 'week' },
  visualisationHint: 'line'
};

export function App() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/v1/analytics/query', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) })
      .then(async (response) => { if (!response.ok) throw new Error(`Query failed (${response.status})`); return response.json(); })
      .then((value: unknown) => setData(analyticsResponseSchema.parse(value)))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Query failed'));
  }, []);
  const option = useMemo(() => {
    if (!data) return {};
    const names = [...new Set(data.points.map((point) => point.dimensionValue))];
    return {
      color: ['#76e6c4', '#8ca7ff', '#ffb770'], tooltip: { trigger: 'axis' }, legend: { data: names, textStyle: { color: '#cbd5e1' } },
      grid: { left: 54, right: 20, top: 48, bottom: 48 }, xAxis: { type: 'time', axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', name: 'AI events', nameTextStyle: { color: '#94a3b8' }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#24324a' } } },
      series: names.map((name) => ({ name, type: 'line', smooth: true, symbolSize: 7, data: data.points.filter((point) => point.dimensionValue === name).map((point) => [point.timestamp, point.value]) }))
    };
  }, [data]);
  return <main>
    <header><div><span className="eyebrow">DQI AUDIT ANALYTICS</span><h1>AI usage by integration</h1><p>Last 12 complete weeks · EU AI Act audit evidence</p></div><span className="status">Governed query</span></header>
    <section className="card chart"><div className="card-title"><h2>Weekly AI events</h2><span>Line chart · v1.0</span></div>{error ? <div className="error">{error}</div> : data ? <ReactECharts option={option} style={{ height: 430 }} /> : <div className="loading">Running governed audit query…</div>}</section>
    {data && <section className="provenance"><h2>Evidence & provenance</h2><div className="facts"><Fact label="Metric" value="AI usage"/><Fact label="Semantic model" value={data.semanticModelVersion}/><Fact label="Source" value={data.queryIr.source.index}/><Fact label="Executed" value={new Date(data.executedAt).toLocaleString()}/><Fact label="Freshness" value={new Date(data.dataFreshness).toLocaleString()}/><Fact label="Backend" value={data.backend}/></div><details><summary>Inspect validated query</summary><pre>{JSON.stringify(data.executedQuery, null, 2)}</pre></details>{data.warnings.map((warning) => <p className="warning" key={warning}>ⓘ {warning}</p>)}</section>}
  </main>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
