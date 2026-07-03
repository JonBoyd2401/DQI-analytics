import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { widgetGenerationResponseSchema, type WidgetGenerationResponse } from '@dqi/contracts';

const examples = ['Show the top EU AI Act control findings by control for the last 12 weeks as a sunset bar chart', 'Compare blocked vs passed AI usage by decision in production over the past 12 weeks as a smooth ocean area chart', 'Trend model drift score for Qwen 3.6 by business unit over the last 26 weeks with a dark line chart', 'Show audit coverage and evidence completeness for EU AI Act by regulation in the EU region as a light KPI', 'Which DQI Enforce policy picked up prompt injection attempts in production for Qwen 3.6?', 'Show estimated model cost by vendor for confidential data over 12 weeks as ranked horizontal bars', 'Rank unresolved EU AI Act findings by business unit and severity using sunset columns', 'Trend hallucination rate by model in production over 26 weeks as a smooth area chart', 'Show human override rate by user role for high-risk systems as a donut chart', 'Compare assessment pass rate by regulation in the EU region as horizontal bars', 'Which integrations have the highest SLA breach rate for restricted data?', 'Show evidence completeness by DQI system as a light ocean KPI', 'Trend token cost by model vendor for production over the last 12 weeks'];

const guidedMetrics = ['AI requests', 'Passed events', 'Pass rate', 'Blocked events', 'Blocked rate', 'Events requiring review', 'DQI Enforce policy hits', 'Policy violation rate', 'Assessment pass rate', 'High-risk events', 'High-risk usage rate', 'Ungrounded response rate', 'Integration error rate', 'Prompt injection attempts', 'PII exposure attempts', 'Total tokens', 'Estimated cost', 'Average latency', 'P95 latency', 'Unique users', 'Human overrides', 'Override rate', 'Audit coverage', 'Evidence completeness', 'Model drift score', 'Exception approvals', 'Unresolved findings', 'Retention breaches', 'SLA breach rate'];
const guidedDimensions = ['Overall', 'Integration', 'Model', 'Model vendor', 'Environment', 'DQI Enforce policy', 'Decision', 'Severity', 'Risk tier', 'Region', 'Business unit', 'User role', 'Data class', 'Regulation', 'Control', 'DQI system'];
const guidedCalculations = [
  { label: 'Simple value', phrase: '' },
  { label: 'Blocked ÷ total × 100', phrase: 'blocked rate' },
  { label: 'Passed ÷ total × 100', phrase: 'pass rate' },
  { label: 'Violations ÷ total × 100', phrase: 'policy violation rate' },
  {
    label: 'Evidence complete ÷ total × 100',
    phrase: 'evidence completeness rate',
  },
];
const guidedViews = ['line chart', 'area chart', 'column chart', 'horizontal bar chart', 'stacked bar chart', 'donut chart', 'KPI scorecard'];
const chatSuggestions = ['By policy instead', 'EU and Production only', 'Make this a 26-week trend', 'Rank highest to lowest', 'Use horizontal blue bars', 'Show as a light KPI', 'Focus on high-risk usage', 'Split by model vendor'];

const capabilities = [
  {
    title: 'Usage and decisions',
    items: ['AI usage events', 'Passed events and pass rate', 'Blocked events and blocked rate', 'Events requiring human review', 'Unique users', 'Human overrides and override rate'],
  },
  {
    title: 'Safety and policy',
    items: ['DQI Enforce policy hits', 'Prompt injection and jailbreak attempts', 'PII and privacy exposure attempts', 'High-risk events and usage rate', 'Toxicity, model allowlist and grounding controls', 'Retention and cross-border controls'],
  },
  {
    title: 'Audit and compliance',
    items: ['EU AI Act control findings', 'Assessment pass rate', 'Audit coverage', 'Evidence completeness', 'Exception approvals', 'Open and unresolved findings'],
  },
  {
    title: 'Model and operations',
    items: ['Model drift score', 'Ungrounded or hallucinated response rate', 'Integration error rate', 'Tokens and estimated cost', 'Average and P95 latency', 'SLA breach rate'],
  },
  {
    title: 'Breakdowns',
    items: ['Integration or DQI system', 'Model or model vendor', 'Environment or decision', 'Enforce policy or control', 'Regulation or risk tier', 'Severity or data class', 'Region or business unit', 'User role'],
  },
  {
    title: 'Filters and presentation',
    items: ['EU, UK, US or APAC', 'Production, staging, development or sandbox', 'Named models, policies, systems and teams', '4, 12 or 26 complete weeks', 'Line, area, bar, donut or KPI', 'Aurora, ocean, sunset or mono; dark or light'],
  },
];

const palettes = {
  aurora: ['#51e4bb', '#718dff', '#d879ff', '#ffd166'],
  ocean: ['#38bdf8', '#2563eb', '#22d3ee', '#818cf8'],
  sunset: ['#fb7185', '#f97316', '#fbbf24', '#c084fc'],
  mono: ['#f8fafc', '#94a3b8', '#64748b', '#334155'],
};

type SemanticEngineStatus = {
  configured: boolean;
  modelId: string;
  execution: 'qwen-endpoint-configured' | 'deterministic-fallback';
};

function formatted(value: number, format: WidgetGenerationResponse['widget']['metric']['format']) {
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  if (format === 'score') return value.toFixed(2);
  if (format === 'currency')
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(value);
  if (format === 'duration') return `${Math.round(value)}ms`;
  return Math.round(value).toLocaleString('en-GB');
}

function friendlyError(reason: unknown, fallback: string) {
  if (reason instanceof Error && reason.name === 'ZodError') return 'The report service has been updated. Refresh this page and try again.';
  return reason instanceof Error && !reason.message.startsWith('[') ? reason.message : fallback;
}

async function apiError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json() as { message?: string };
    return new Error(payload.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

export function DqiAuditStudio() {
  const [prompt, setPrompt] = useState(examples[0]!);
  const [result, setResult] = useState<WidgetGenerationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [engineStatus, setEngineStatus] = useState<SemanticEngineStatus | null>(null);
  const [useCustomAi, setUseCustomAi] = useState(false);
  const [aiBaseUrl, setAiBaseUrl] = useState('http://localhost:11434/v1');
  const [aiModelId, setAiModelId] = useState('qwen3.6');
  const [aiApiKey, setAiApiKey] = useState('');
  const [guidedMetric, setGuidedMetric] = useState(guidedMetrics[0]!);
  const [guidedDimension, setGuidedDimension] = useState(guidedDimensions[1]!);
  const [guidedCalculation, setGuidedCalculation] = useState(guidedCalculations[0]!.phrase);
  const [guidedView, setGuidedView] = useState(guidedViews[0]!);
  const [guidedRange, setGuidedRange] = useState('12');
  const guidedPrompt = `Show ${guidedCalculation || guidedMetric.toLowerCase()}${guidedDimension === 'Overall' ? ' overall' : ` by ${guidedDimension.toLowerCase()}`} for the last ${guidedRange} weeks as a ${guidedView}`;
  const aiConnection = useCustomAi
    ? {
        baseUrl: aiBaseUrl.trim(),
        modelId: aiModelId.trim(),
        ...(aiApiKey ? { apiKey: aiApiKey } : {}),
      }
    : undefined;

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/health', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Health check failed'))))
      .then((health: { semanticEngine?: SemanticEngineStatus }) => setEngineStatus(health.semanticEngine ?? null))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function generate(promptOverride?: string) {
    const requestPrompt = promptOverride ?? prompt;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/widgets/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: requestPrompt, aiMode: useCustomAi ? 'custom' : 'auto', aiConnection }),
      });
      if (!response.ok) throw await apiError(response, 'Add a supported audit metric, dimension, and visual style to the prompt.');
      setResult(widgetGenerationResponseSchema.parse(await response.json()));
      setOriginalPrompt(requestPrompt);
      setPrompt('');
    } catch (reason) {
      setError(friendlyError(reason, 'The audit widget could not be generated. Try a metric such as blocked events and a breakdown such as policy.'));
    } finally {
      setLoading(false);
    }
  }

  async function refineView(editInstruction: string) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/widgets/refine', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          originalPrompt,
          editPrompt: editInstruction,
          aiMode: useCustomAi ? 'custom' : 'auto',
          aiConnection,
        }),
      });
      if (!response.ok) throw await apiError(response, 'Try naming what to change: metric, breakdown, filter, timeframe, or chart style. Your existing report will supply the rest.');
      const refined = widgetGenerationResponseSchema.parse(await response.json());
      setResult(refined);
      setOriginalPrompt(refined.query.naturalLanguage);
      setPrompt('');
    } catch (reason) {
      setError(friendlyError(reason, 'The report could not be updated. Describe one change, such as “by policy”, “EU only”, or “use blue bars”.'));
    } finally {
      setLoading(false);
    }
  }

  function submitPrompt() {
    if (result && originalPrompt) void refineView(prompt);
    else void generate();
  }

  return (
    <main className="dqi-shell">
      <nav className="dqi-nav">
        <div className="dqi-brand">
          <span>DQI</span>
          <div>
            <strong>Audit Analytics</strong>
            <small>AI evidence & compliance reporting</small>
          </div>
        </div>
        <div className="nav-actions">
          <a className="wheel-link" href="/dqi-wheel.html">
            Explore DQI →
          </a>
          <div className="dqi-demo">
            <i />
            Synthetic audit event store
          </div>
        </div>
      </nav>
      <section className="dqi-hero">
        <div>
          <span className="kicker">QWEN PROPOSAL -&gt; GOVERNED SEMANTIC PLAN -&gt; AUDIT REPORT</span>
          <h1>
            Ask the evidence.
            <br />
            <em>See the compliance story.</em>
          </h1>
          <p>Turn DQI usage, governance, assessment, integration, model drift, evidence, policy and cost logs into traceable audit reporting — without letting the language model calculate the answer.</p>
        </div>
        <div className="reg-card">
          <span>SEMANTIC ENGINE</span>
          <strong>{engineStatus?.modelId ?? 'Qwen 3.6'}</strong>
          <small>{engineStatus?.configured ? 'Live endpoint configured · output validated' : 'Deterministic fallback · Qwen endpoint not configured'}</small>
          <a href="https://github.com/JonBoyd2401/Qwen3.6" target="_blank" rel="noreferrer">
            Model fork -&gt;
          </a>
        </div>
      </section>
      <section className="studio-workspace">
        <aside className="studio-controls">
          <section className="prompt-panel">
            <div className="prompt-heading">
              <label htmlFor="audit-prompt">{result ? 'What would you like to change?' : 'Describe your audit report'}</label>
              <span>{result ? 'Conversational edit' : 'Governed prompt'}</span>
            </div>
            <textarea
              id="audit-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !loading && prompt.trim().length >= 3) submitPrompt();
              }}
              placeholder={result ? 'e.g. By policy instead, EU only, make it a trend, or use blue bars…' : 'Ask a question about your DQI audit evidence…'}
              rows={4}
              maxLength={1000}
            />
            <div className="chat-suggestions">
              {chatSuggestions.map((item) => (
                <button key={item} onClick={() => setPrompt(item)}>
                  {item}
                </button>
              ))}
            </div>
            <details className="ai-connection">
              <summary>AI connection</summary>
              <label className="ai-toggle">
                <input type="checkbox" checked={useCustomAi} onChange={(event) => setUseCustomAi(event.target.checked)} />
                <span>Use my OpenAI-compatible model for this session</span>
              </label>
              {useCustomAi && (
                <div className="ai-fields">
                  <label>
                    Endpoint URL
                    <input value={aiBaseUrl} onChange={(event) => setAiBaseUrl(event.target.value)} placeholder="http://localhost:11434/v1" />
                  </label>
                  <label>
                    Model name
                    <input value={aiModelId} onChange={(event) => setAiModelId(event.target.value)} placeholder="qwen3.6" />
                  </label>
                  <label>
                    API key (optional)
                    <input type="password" autoComplete="off" value={aiApiKey} onChange={(event) => setAiApiKey(event.target.value)} placeholder="Kept in this browser tab only" />
                  </label>
                  <small>Local HTTP works when DQI runs locally. The hosted demo requires HTTPS. Credentials are not stored.</small>
                </div>
              )}
            </details>
            <div className="prompt-actions">
              <small>{prompt.length} / 1,000 · Ctrl/Cmd + Enter</small>
              <button onClick={submitPrompt} disabled={loading || prompt.trim().length < (result ? 3 : 10) || (useCustomAi && (!aiBaseUrl.trim() || !aiModelId.trim()))}>
                {loading ? 'Updating report…' : result ? 'Apply to report →' : 'Generate compliance widget'}
              </button>
            </div>
          </section>
          <details className="guided-builder">
            <summary>Build a report step by step</summary>
            <p>Pick governed semantic building blocks, then edit the generated sentence however you like.</p>
            <div className="builder-flow">
              <label>
                <span>1 · Metric</span>
                <select value={guidedMetric} onChange={(event) => setGuidedMetric(event.target.value)}>
                  {guidedMetrics.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>2 · Dimension</span>
                <select value={guidedDimension} onChange={(event) => setGuidedDimension(event.target.value)}>
                  {guidedDimensions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>3 · Calculation</span>
                <select value={guidedCalculation} onChange={(event) => setGuidedCalculation(event.target.value)}>
                  {guidedCalculations.map((item) => (
                    <option key={item.label} value={item.phrase}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>4 · Visual</span>
                <select value={guidedView} onChange={(event) => setGuidedView(event.target.value)}>
                  {guidedViews.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>5 · Window</span>
                <select value={guidedRange} onChange={(event) => setGuidedRange(event.target.value)}>
                  <option value="4">4 weeks</option>
                  <option value="12">12 weeks</option>
                  <option value="26">26 weeks</option>
                </select>
              </label>
            </div>
            <div className="builder-preview">
              <code>{guidedPrompt}</code>
              <button
                onClick={() => {
                  setPrompt(guidedPrompt);
                  void generate(guidedPrompt);
                }}
                disabled={loading}
              >
                {loading ? 'Building widget…' : 'Use prompt & build →'}
              </button>
            </div>
            <small>Calculations are governed formula presets. Qwen may interpret your wording, but only the deterministic engine performs the arithmetic.</small>
          </details>
          <div className="prompt-examples">
            <span>Example prompts</span>
            {examples.map((example, index) => (
              <button key={example} onClick={() => setPrompt(example)}>
                0{index + 1}
              </button>
            ))}
          </div>
          <details className="capability-browser">
            <summary>Explore everything you can ask</summary>
            <p>Use your own wording. Qwen maps it to the closest governed metric, breakdown and filters.</p>
            <div>
              {capabilities.map((group) => (
                <section key={group.title}>
                  <strong>{group.title}</strong>
                  {group.items.map((item) => (
                    <button key={item} onClick={() => setPrompt(`Show ${item.toLowerCase()} by integration for the last 12 weeks`)}>
                      {item}
                    </button>
                  ))}
                </section>
              ))}
            </div>
            <small>Prompt pattern: “Show [metric] by [breakdown], filtered to [value], over [time], as [visual style].” Exact wording is not required.</small>
          </details>
          {error && <div className="dqi-error">{error}</div>}
        </aside>
        <section className="studio-preview">
          <div className="preview-heading">
            <span className="kicker">LIVE REPORT PREVIEW</span>
            <small>Widget, interpretation and audit trace</small>
          </div>
          {result ? (
            <AuditWidget result={result} />
          ) : (
            <section className="blank-canvas">
              <div className="audit-glyph">
                <i />
                <i />
                <i />
              </div>
              <div>
                <h2>Your audit canvas is ready</h2>
                <p>Ask what was allowed, blocked, reviewed, overridden, drifting, incomplete, expensive, slow, or missing evidence; then split it by model, system, policy, control, region, business unit, role, risk tier, data class or regulation.</p>
                <button onClick={() => setPrompt(examples[1]!)}>Load a sample prompt -&gt;</button>
              </div>
            </section>
          )}
        </section>
      </section>
      <section className="audit-catalogue">
        <div>
          <span className="kicker">GOVERNED SEMANTIC CATALOGUE</span>
          <h2>Ask DQI almost anything</h2>
        </div>
        <Catalogue title="Governance metrics" items={['Usage · Passed · Blocked · Review', 'Prompt injection · PII leakage · Retention breaches', 'Model drift · Grounding · Evidence completeness', 'Cost · Tokens · Latency · SLA breaches']} />
        <Catalogue title="Break down or filter" items={['System · Model · Vendor · Integration', 'Policy · Control · Regulation · Risk tier', 'Region · Business unit · User role', 'Environment · Decision · Data class']} />
        <Catalogue title="Guardrails" items={['Qwen proposes semantic intent only', 'Deterministic compiler builds ES/OpenSearch DSL', 'Published catalogue identifiers only', '4, 12 or 26 complete weeks']} />
      </section>
    </main>
  );
}

function AuditWidget({ result }: { result: WidgetGenerationResponse }) {
  const { widget, series, summary, provenance, query, semanticEngine } = result;
  const colors = palettes[widget.visual.palette];
  const light = widget.visual.theme === 'light';
  const option = useMemo(() => {
    const text = light ? '#17233b' : '#dce7f7';
    const muted = light ? '#64748b' : '#8396af';
    const grid = light ? '#dbe3ee' : '#22334c';
    if (widget.visual.chartType === 'donut')
      return {
        color: colors,
        tooltip: { trigger: 'item' },
        legend: {
          show: widget.visual.showLegend,
          bottom: 0,
          textStyle: { color: muted },
        },
        series: [
          {
            type: 'pie',
            radius: ['53%', '76%'],
            center: ['50%', '43%'],
            padAngle: 3,
            itemStyle: { borderRadius: 8 },
            label: { color: text },
            data: series.map((item) => ({
              name: item.label,
              value: item.points.at(-1)?.value ?? 0,
            })),
          },
        ],
      };
    if (widget.visual.chartType === 'horizontalBar')
      return {
        color: colors,
        tooltip: { trigger: 'axis' },
        grid: { left: 130, right: 24, top: 20, bottom: 35 },
        xAxis: {
          type: 'value',
          axisLabel: { color: muted },
          splitLine: {
            show: widget.visual.showGrid,
            lineStyle: { color: grid },
          },
        },
        yAxis: {
          type: 'category',
          data: series.map((item) => item.label),
          axisLabel: { color: muted },
          axisLine: { lineStyle: { color: grid } },
        },
        series: [
          {
            name: widget.metric.label,
            type: 'bar',
            barMaxWidth: 26,
            data: series.map((item) => item.points.at(-1)?.value ?? 0),
            itemStyle: { borderRadius: [0, 6, 6, 0] },
          },
        ],
      };
    const legend = widget.visual.legendPosition === 'right' ? { right: 0, top: 'middle', orient: 'vertical' } : widget.visual.legendPosition === 'bottom' ? { bottom: 0 } : { top: 0 };
    if (widget.grain === 'none')
      return {
        color: colors,
        tooltip: { trigger: 'axis' },
        grid: { left: 60, right: 20, top: 30, bottom: 70 },
        xAxis: {
          type: 'category',
          data: series.map((item) => item.label),
          axisLabel: { color: muted, rotate: widget.visual.xAxisLabelRotation },
          axisLine: { lineStyle: { color: grid } },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: muted },
          splitLine: {
            show: widget.visual.showGrid,
            lineStyle: { color: grid },
          },
        },
        series: [
          {
            name: widget.metric.label,
            type: widget.visual.chartType === 'line' || widget.visual.chartType === 'area' ? 'line' : 'bar',
            smooth: widget.visual.smooth,
            areaStyle: widget.visual.chartType === 'area' ? { opacity: 0.17 } : undefined,
            data: series.map((item) => item.points[0]?.value ?? 0),
          },
        ],
      };
    return {
      color: colors,
      animationDurationUpdate: 450,
      tooltip: { trigger: 'axis' },
      legend: {
        show: widget.visual.showLegend,
        ...legend,
        textStyle: { color: muted },
      },
      grid: {
        left: 60,
        right: widget.visual.legendPosition === 'right' ? 150 : 20,
        top: widget.visual.xAxisPosition === 'top' ? 75 : 48,
        bottom: widget.visual.legendPosition === 'bottom' ? 70 : 48,
      },
      xAxis: {
        show: widget.visual.showXAxis,
        type: 'category',
        position: widget.visual.xAxisPosition,
        data: series[0]?.points.map((point) => point.label),
        axisLabel: { color: muted, rotate: widget.visual.xAxisLabelRotation },
        axisLine: { lineStyle: { color: grid } },
      },
      yAxis: {
        show: widget.visual.showYAxis,
        type: 'value',
        axisLabel: { color: muted },
        splitLine: { show: widget.visual.showGrid, lineStyle: { color: grid } },
      },
      series: series.map((item, index) => ({
        name: item.label,
        type: widget.visual.chartType === 'bar' || widget.visual.chartType === 'stackedBar' ? 'bar' : 'line',
        stack: widget.visual.chartType === 'stackedBar' ? 'total' : undefined,
        smooth: widget.visual.smooth,
        symbol: widget.visual.showPoints ? 'circle' : 'none',
        symbolSize: 7,
        barMaxWidth: 28,
        areaStyle: widget.visual.chartType === 'area' ? { opacity: 0.17 } : undefined,
        lineStyle: { width: 3 },
        data: item.points.map((point) => point.value),
        itemStyle: { color: colors[index % colors.length] },
      })),
    };
  }, [colors, light, series, widget]);
  const lowerIsBetter = ['metric.blocked_events', 'metric.blocked_rate', 'metric.reviewed_events', 'metric.policy_violation_rate', 'metric.high_risk_events', 'metric.high_risk_usage_rate', 'metric.ungrounded_response_rate', 'metric.integration_error_rate', 'metric.prompt_injection_attempts', 'metric.pii_exposure_attempts', 'metric.estimated_cost', 'metric.avg_latency_ms', 'metric.p95_latency_ms', 'metric.human_overrides', 'metric.override_rate', 'metric.model_drift_score', 'metric.exception_approvals', 'metric.unresolved_findings', 'metric.retention_breaches', 'metric.sla_breach_rate'].includes(widget.metric.id);
  const favourable = lowerIsBetter ? summary.direction === 'down' : summary.direction === 'up';
  return (
    <section className={`audit-widget ${light ? 'audit-widget-light' : ''}`}>
      <header>
        <div>
          <span className="kicker">COMPLIANCE WIDGET - V{widget.version}</span>
          <h2>{widget.title}</h2>
          <p>
            {widget.metric.label} - {widget.dimension.label} - Last {widget.timeRangeWeeks} complete weeks {widget.grain === 'none' ? '(categorical aggregation)' : '(weekly trend)'}
          </p>
        </div>
        <div className={`trend ${favourable ? 'positive' : 'attention'}`}>
          {summary.direction === 'up' ? 'up' : summary.direction === 'down' ? 'down' : 'flat'} {Math.abs(summary.changePercent).toFixed(1)}%<small>vs previous week</small>
        </div>
      </header>
      <div className="visual-row">
        <div className="primary-stat">
          <span>Current result</span>
          <strong>{formatted(summary.current, widget.metric.format)}</strong>
          <small>Previous {formatted(summary.previous, widget.metric.format)}</small>
          <b>EU AI Act</b>
        </div>
        {widget.visual.chartType !== 'kpi' && <ReactECharts className="report-chart" key={widget.id} option={option} style={{ height: 390, flex: 1 }} notMerge lazyUpdate={false} />}
      </div>
      <div className="interpretation">
        <strong>Prompt interpreted as</strong>
        {widget.interpretation.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="interpretation">
        <strong>Qwen semantic safety</strong>
        <span>{semanticEngine.modelId}</span>
        <span>{semanticEngine.mode}</span>
        <span>{Math.round(semanticEngine.confidence * 100)}% confidence</span>
        {semanticEngine.safeguards.slice(0, 2).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      {widget.unsupportedRequests.length > 0 && <div className="dqi-notice">Not applied: {widget.unsupportedRequests.join('; ')}</div>}
      <div className="trace-heading">
        <div>
          <span className="kicker">AUDITABLE EXECUTION TRACE</span>
          <strong>Exactly how this report was produced</strong>
        </div>
        <small>Exact request → validated semantics → deterministic query</small>
      </div>
      <div className="query-flow">
        <div>
          <span>01 · USER EVIDENCE</span>
          <strong>Exact natural-language request</strong>
          <p>{query.naturalLanguage}</p>
        </div>
        <div className="flow-arrow">→</div>
        <div>
          <span>02 · VALIDATED MEANING</span>
          <strong>Governed semantic plan</strong>
          <pre>{JSON.stringify(query.semanticPlan, null, 2)}</pre>
        </div>
        <div className="flow-arrow">→</div>
        <div>
          <span>03 · EXECUTABLE EVIDENCE</span>
          <strong>Elasticsearch / OpenSearch query</strong>
          <pre>{JSON.stringify(query.elasticsearchDsl, null, 2)}</pre>
        </div>
      </div>
      <details>
        <summary>Audit evidence & provenance</summary>
        <div className="evidence-grid">
          <Evidence label="Source" value={provenance.source} />
          <Evidence label="Policy profile" value={provenance.regulatoryProfile} />
          <Evidence label="Calculation" value={provenance.calculation} />
          <Evidence label="Rows scanned" value={provenance.recordsScanned.toLocaleString()} />
        </div>
        <p>{provenance.disclaimer} This demonstration supports audit exploration and is not legal advice or a determination of compliance.</p>
      </details>
    </section>
  );
}

function Catalogue({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="catalogue-column">
      <strong>{title}</strong>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
function Evidence({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
