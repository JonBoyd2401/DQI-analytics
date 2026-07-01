export interface DemoAggregateRow {
  week: string;
  integration: string;
  model: string;
  environment: string;
  enforcePolicy: string;
  decision: string;
  severity: string;
  aiRequests: number;
  policyViolations: number;
  assessments: number;
  assessmentsPassed: number;
  highRiskEvents: number;
  ungroundedResponses: number;
  integrationErrors: number;
}

const integrations = ['Customer Service Copilot', 'Knowledge Search', 'Quality Monitor', 'Developer Assistant'];
const models = ['Qwen 3.6', 'GPT-5.4', 'Claude Sonnet', 'Llama 4 Scout'];
const environments = ['Production', 'Staging', 'Development'];
const policies = [
  { name: 'No policy match', severity: 'Info', weight: 0.74 },
  { name: 'Prompt Injection Shield', severity: 'Critical', weight: 0.055 },
  { name: 'PII & Data Leakage', severity: 'High', weight: 0.052 },
  { name: 'EU AI Act High-Risk Use', severity: 'Critical', weight: 0.036 },
  { name: 'Grounding & Citation', severity: 'Medium', weight: 0.061 },
  { name: 'Toxicity & Harm', severity: 'High', weight: 0.028 },
  { name: 'Model Allowlist', severity: 'Medium', weight: 0.028 }
] as const;
const decisions = ['Passed', 'Blocked', 'Review'] as const;

function mondayWeeks(weeks: number, now: Date): Date[] {
  const end = new Date(now);
  const day = (end.getUTCDay() + 6) % 7;
  end.setUTCDate(end.getUTCDate() - day);
  end.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: weeks }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (weeks - index) * 7);
    return date;
  });
}

export class SyntheticDqiAuditDatabase {
  readonly version = '2026.1' as const;
  readonly rows: DemoAggregateRow[];

  constructor(now = new Date('2026-07-01T10:00:00.000Z')) {
    this.rows = mondayWeeks(26, now).flatMap((week, weekIndex) =>
      integrations.flatMap((integration, integrationIndex) =>
        models.flatMap((model, modelIndex) =>
          environments.flatMap((environment, environmentIndex) => {
            const seasonal = Math.sin((weekIndex / 26) * Math.PI * 4) * 180;
            const growth = weekIndex * (45 + integrationIndex * 8);
            const base = 850 + integrationIndex * 280 + modelIndex * 190 - environmentIndex * 240;
            const aiRequests = Math.max(120, Math.round(base + seasonal + growth + ((weekIndex * 97 + modelIndex * 53) % 170)));
            return policies.flatMap((policy, policyIndex) => decisions.map((decision, decisionIndex) => {
              const decisionWeight = policy.name === 'No policy match'
                ? (decision === 'Passed' ? 0.985 : decision === 'Review' ? 0.012 : 0.003)
                : (decision === 'Passed' ? 0.42 : decision === 'Review' ? 0.21 : 0.37);
              const events = Math.max(0, Math.round(aiRequests * policy.weight * decisionWeight));
              const assessmentRate = environment === 'Production' ? 0.16 : 0.08;
              const assessments = Math.round(events * assessmentRate);
              const assessmentPassRate = 0.95 - integrationIndex * 0.018 - modelIndex * 0.009 + weekIndex * 0.001 - (decision === 'Blocked' ? 0.2 : 0);
              const groundingRate = policy.name === 'Grounding & Citation' ? 0.38 : 0.018 + modelIndex * 0.004;
              const errorRate = 0.007 + integrationIndex * 0.002 + environmentIndex * 0.003 + Math.abs(Math.cos(weekIndex / 4)) * 0.003;
              return {
                week: week.toISOString(), integration, model, environment, enforcePolicy: policy.name,
                decision, severity: policy.severity, aiRequests: events,
                policyViolations: policy.name === 'No policy match' ? 0 : events,
                assessments,
                assessmentsPassed: Math.round(assessments * Math.max(0.55, Math.min(0.99, assessmentPassRate))),
                highRiskEvents: policy.severity === 'Critical' && decision !== 'Passed' ? Math.round(events * (0.62 + policyIndex * 0.02)) : 0,
                ungroundedResponses: Math.round(events * groundingRate),
                integrationErrors: Math.round(events * errorRate * (1 + decisionIndex * 0.15))
              };
            }));
          })
        )
      )
    );
  }
}
