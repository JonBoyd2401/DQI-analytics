import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { widgetGenerationResponseSchema, type WidgetGenerationResponse } from '@dqi/contracts';

const examples = [
  'Show the EU AI Act control finding rate by integration for the last 12 weeks as a smooth area chart with an aurora palette',
  'Create a blue bar chart of assessment pass rate by model over the past 4 weeks titled "EU AI Act readiness"',
  'Build a dark KPI scorecard for overall high-risk AI events across the last 26 weeks',
  'Show ungrounded response rate by environment for 12 weeks as a minimal light line chart'
];

const palettes = {
  aurora: ['#51e4bb', '#718dff', '#d879ff', '#ffd166'],
  ocean: ['#38bdf8', '#2563eb', '#22d3ee', '#818cf8'],
  sunset: ['#fb7185', '#f97316', '#fbbf24', '#c084fc'],
  mono: ['#f8fafc', '#94a3b8', '#64748b', '#334155']
};

function formatted(value: number, format: WidgetGenerationResponse['widget']['metric']['format']) {
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  if (format === 'score') return value.toFixed(2);
  if (format === 'duration') return `${Math.round(value / 60)}m ${Math.round(value % 60)}s`;
  return Math.round(value).toLocaleString('en-GB');
}

export function DqiAuditStudio() {
  const [prompt, setPrompt] = useState(examples[0]!);
  const [result, setResult] = useState<WidgetGenerationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/v1/widgets/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) });
      if (!response.ok) throw new Error('Add a supported audit metric, dimension, and visual style to the prompt.');
      setResult(widgetGenerationResponseSchema.parse(await response.json()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The audit widget could not be generated.');
    } finally { setLoading(false); }
  }

  return <main className="dqi-shell">
    <nav className="dqi-nav"><div className="dqi-brand"><span>DQI</span><div><strong>Audit Analytics</strong><small>AI evidence & compliance reporting</small></div></div><div className="dqi-demo"><i/>Synthetic audit event store</div></nav>
    <section className="dqi-hero"><div><span className="kicker">NATURAL LANGUAGE → GOVERNED QUERY → AUDIT REPORT</span><h1>Ask the evidence.<br/><em>See the compliance story.</em></h1><p>Turn DQI usage logs, assessments, and integration events into traceable audit reporting—without letting the language model calculate the answer.</p></div><div className="reg-card"><span>REGULATORY PROFILE</span><strong>EU AI Act</strong><small>Regulation (EU) 2024/1689</small><a href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng" target="_blank" rel="noreferrer">Official regulation ↗</a></div></section>
    <section className="prompt-panel"><div className="prompt-heading"><label htmlFor="audit-prompt">Describe your audit report</label><span>Governed prompt</span></div><textarea id="audit-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} maxLength={1000}/><div className="prompt-actions"><small>{prompt.length} / 1,000</small><button onClick={generate} disabled={loading || prompt.trim().length < 10}>{loading ? 'Compiling audit query…' : '✦ Generate compliance widget'}</button></div></section>
    <div className="prompt-examples"><span>Example prompts</span>{examples.map((example, index) => <button key={example} onClick={() => setPrompt(example)}>0{index + 1}</button>)}</div>
    {error && <div className="dqi-error">{error}</div>}
    {result ? <AuditWidget result={result}/> : <section className="blank-canvas"><div className="audit-glyph"><i/><i/><i/></div><div><h2>Your audit canvas is ready</h2><p>Ask about EU AI Act findings, assessment outcomes, high-risk events, model grounding, integrations, or AI usage.</p><button onClick={() => setPrompt(examples[1]!)}>Load a sample prompt →</button></div></section>}
    <section className="audit-catalogue"><div><span className="kicker">GOVERNED SEMANTIC CATALOGUE</span><h2>What DQI understands</h2></div><Catalogue title="Audit metrics" items={['AI usage', 'EU AI Act control finding rate', 'Assessment pass rate', 'High-risk AI events', 'Ungrounded response rate', 'Integration error rate']}/><Catalogue title="Dimensions" items={['Integration', 'Model', 'Environment', 'Overall']}/><Catalogue title="Presentation" items={['Line · Area · Bar · Donut · KPI', 'Aurora · Ocean · Sunset · Mono', 'Dark or light theme']}/></section>
  </main>;
}

function AuditWidget({ result }: { result: WidgetGenerationResponse }) {
  const { widget, series, summary, provenance, query } = result;
  const colors = palettes[widget.visual.palette];
  const light = widget.visual.theme === 'light';
  const option = useMemo(() => {
    const text = light ? '#17233b' : '#dce7f7';
    const muted = light ? '#64748b' : '#8396af';
    const grid = light ? '#dbe3ee' : '#22334c';
    if (widget.visual.chartType === 'donut') return { color: colors, tooltip: { trigger: 'item' }, legend: { show: widget.visual.showLegend, bottom: 0, textStyle: { color: muted } }, series: [{ type: 'pie', radius: ['53%', '76%'], center: ['50%', '43%'], padAngle: 3, itemStyle: { borderRadius: 8 }, label: { color: text }, data: series.map((item) => ({ name: item.label, value: item.points.at(-1)?.value ?? 0 })) }] };
    return { color: colors, tooltip: { trigger: 'axis' }, legend: { show: widget.visual.showLegend, top: 0, textStyle: { color: muted } }, grid: { left: 60, right: 20, top: 48, bottom: 40 }, xAxis: { type: 'category', data: series[0]?.points.map((point) => point.label), axisLabel: { color: muted }, axisLine: { lineStyle: { color: grid } } }, yAxis: { type: 'value', axisLabel: { color: muted }, splitLine: { lineStyle: { color: grid } } }, series: series.map((item, index) => ({ name: item.label, type: widget.visual.chartType === 'bar' ? 'bar' : 'line', smooth: widget.visual.smooth, symbol: 'circle', symbolSize: 7, barMaxWidth: 28, areaStyle: widget.visual.chartType === 'area' ? { opacity: .17 } : undefined, lineStyle: { width: 3 }, data: item.points.map((point) => point.value), itemStyle: { color: colors[index % colors.length] } })) };
  }, [colors, light, series, widget]);
  const lowerIsBetter = ['metric.policy_violation_rate', 'metric.high_risk_events', 'metric.ungrounded_response_rate', 'metric.integration_error_rate'].includes(widget.metric.id);
  const favourable = lowerIsBetter ? summary.direction === 'down' : summary.direction === 'up';
  return <section className={`audit-widget ${light ? 'audit-widget-light' : ''}`}>
    <header><div><span className="kicker">COMPLIANCE WIDGET · V{widget.version}</span><h2>{widget.title}</h2><p>{widget.metric.label} · {widget.dimension.label} · Last {widget.timeRangeWeeks} complete weeks</p></div><div className={`trend ${favourable ? 'positive' : 'attention'}`}>{summary.direction === 'up' ? '↗' : summary.direction === 'down' ? '↘' : '→'} {Math.abs(summary.changePercent).toFixed(1)}%<small>vs previous week</small></div></header>
    <div className="visual-row"><div className="primary-stat"><span>Current result</span><strong>{formatted(summary.current, widget.metric.format)}</strong><small>Previous {formatted(summary.previous, widget.metric.format)}</small><b>EU AI Act</b></div>{widget.visual.chartType !== 'kpi' && <ReactECharts option={option} style={{ height: 390, flex: 1 }} notMerge/>}</div>
    <div className="interpretation"><strong>Prompt interpreted as</strong>{widget.interpretation.map((item) => <span key={item}>{item}</span>)}</div>
    {widget.unsupportedRequests.length > 0 && <div className="dqi-notice">Not applied: {widget.unsupportedRequests.join('; ')}</div>}
    <div className="query-flow"><div><span>01</span><strong>Natural language</strong><p>{query.naturalLanguage}</p></div><div className="flow-arrow">→</div><div><span>02</span><strong>Governed semantic plan</strong><pre>{JSON.stringify(query.semanticPlan, null, 2)}</pre></div><div className="flow-arrow">→</div><div><span>03</span><strong>Elasticsearch query</strong><pre>{JSON.stringify(query.elasticsearchDsl, null, 2)}</pre></div></div>
    <details><summary>Audit evidence & provenance</summary><div className="evidence-grid"><Evidence label="Source" value={provenance.source}/><Evidence label="Policy profile" value={provenance.regulatoryProfile}/><Evidence label="Calculation" value={provenance.calculation}/><Evidence label="Rows scanned" value={provenance.recordsScanned.toLocaleString()}/></div><p>{provenance.disclaimer} This demonstration supports audit exploration and is not legal advice or a determination of compliance.</p></details>
  </section>;
}

function Catalogue({ title, items }: { title: string; items: string[] }) { return <div className="catalogue-column"><strong>{title}</strong>{items.map((item) => <span key={item}>{item}</span>)}</div>; }
function Evidence({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
