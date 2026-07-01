export interface DemoAggregateRow {
  week: string;
  integration: string;
  model: string;
  environment: string;
  enforcePolicy: string;
  decision: string;
  severity: string;
  riskTier: string;
  region: string;
  businessUnit: string;
  userRole: string;
  dataClass: string;
  regulation: string;
  control: string;
  vendor: string;
  system: string;
  aiRequests: number;
  policyViolations: number;
  assessments: number;
  assessmentsPassed: number;
  highRiskEvents: number;
  ungroundedResponses: number;
  integrationErrors: number;
  promptInjectionAttempts: number;
  piiExposureAttempts: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMsTotal: number;
  latencyMsP95Total: number;
  uniqueUsers: number;
  humanOverrides: number;
  evidenceComplete: number;
  modelDriftScoreTotal: number;
  exceptionApprovals: number;
  unresolvedFindings: number;
  retentionBreaches: number;
  slaBreaches: number;
}

const integrations = ['DQI Enforce Gateway', 'Assessment Runner', 'Evidence Vault', 'Policy Studio', 'Integration Monitor', 'Red Team Simulator'];
const models = ['Qwen 3.6', 'Qwen 3.6 Guarded', 'GPT-5.4', 'Claude Sonnet', 'Llama 4 Scout', 'Mistral Large'];
const environments = ['Production', 'Staging', 'Development', 'Sandbox'];
const policies = [
  { name: 'No policy match', severity: 'Info', control: 'Allowed use baseline', weight: 0.66 },
  { name: 'Prompt Injection Shield', severity: 'Critical', control: 'Adversarial robustness', weight: 0.055 },
  { name: 'PII & Data Leakage', severity: 'High', control: 'Data governance', weight: 0.052 },
  { name: 'EU AI Act High-Risk Use', severity: 'Critical', control: 'High-risk classification', weight: 0.043 },
  { name: 'Grounding & Citation', severity: 'Medium', control: 'Accuracy and evidence', weight: 0.061 },
  { name: 'Toxicity & Harm', severity: 'High', control: 'Human safety', weight: 0.028 },
  { name: 'Model Allowlist', severity: 'Medium', control: 'Approved model use', weight: 0.028 },
  { name: 'Human Oversight Required', severity: 'High', control: 'Human oversight', weight: 0.032 },
  { name: 'Retention & Purpose Limit', severity: 'Medium', control: 'Data retention', weight: 0.021 },
  { name: 'Cross-Border Transfer Guard', severity: 'High', control: 'Regional data transfer', weight: 0.02 }
] as const;
const decisions = ['Passed', 'Blocked', 'Review'] as const;
const regions = ['EU', 'UK', 'US', 'APAC'];
const businessUnits = ['Audit & Risk', 'Operations', 'Product Engineering', 'Customer Trust'];
const userRoles = ['Auditor', 'Policy Owner', 'Developer', 'Business User'];
const dataClasses = ['Public', 'Internal', 'Confidential', 'Restricted'];
const systems = ['DQI Enforce', 'DQI Assess', 'DQI Integrations', 'DQI Evidence'];
const regulations = ['EU AI Act', 'GDPR', 'ISO 42001', 'NIST AI RMF'];

export const dqiDemoCatalogue = {
  integrations, models, environments,
  policies: policies.map((policy) => policy.name),
  decisions: [...decisions],
  regions, businessUnits, userRoles, dataClasses, systems, regulations,
  controls: [...new Set(policies.map((policy) => policy.control))]
} as const;

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
  readonly version = '2026.2' as const;
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
              const region = regions[(weekIndex + integrationIndex + policyIndex) % regions.length]!;
              const businessUnit = businessUnits[(integrationIndex + modelIndex + decisionIndex) % businessUnits.length]!;
              const userRole = userRoles[(environmentIndex + policyIndex + decisionIndex) % userRoles.length]!;
              const dataClass = dataClasses[(policyIndex + modelIndex + (policy.severity === 'Critical' ? 2 : 0)) % dataClasses.length]!;
              const regulation = policy.name.includes('EU AI Act') || policy.control.includes('High-risk') ? 'EU AI Act' : regulations[(policyIndex + environmentIndex) % regulations.length]!;
              const vendor = model.startsWith('Qwen') ? 'Qwen' : model.startsWith('GPT') ? 'OpenAI' : model.startsWith('Claude') ? 'Anthropic' : model.startsWith('Llama') ? 'Meta' : 'Mistral';
              const system = systems[integrationIndex % systems.length]!;
              const riskTier = policy.severity === 'Critical' ? 'High-risk' : policy.severity === 'High' ? 'Elevated' : policy.severity === 'Medium' ? 'Limited' : 'Minimal';
              const decisionWeight = policy.name === 'No policy match'
                ? (decision === 'Passed' ? 0.985 : decision === 'Review' ? 0.012 : 0.003)
                : (decision === 'Passed' ? 0.42 : decision === 'Review' ? 0.21 : 0.37);
              const events = Math.max(0, Math.round(aiRequests * policy.weight * decisionWeight));
              const assessmentRate = environment === 'Production' ? 0.16 : 0.08;
              const assessments = Math.round(events * assessmentRate);
              const assessmentPassRate = 0.95 - integrationIndex * 0.018 - modelIndex * 0.009 + weekIndex * 0.001 - (decision === 'Blocked' ? 0.2 : 0);
              const groundingRate = policy.name === 'Grounding & Citation' ? 0.38 : 0.018 + modelIndex * 0.004;
              const errorRate = 0.007 + integrationIndex * 0.002 + environmentIndex * 0.003 + Math.abs(Math.cos(weekIndex / 4)) * 0.003;
              const latency = 520 + modelIndex * 115 + environmentIndex * 70 + policyIndex * 9 + (decision === 'Review' ? 220 : decision === 'Blocked' ? 120 : 0);
              const tokensPerEvent = 720 + modelIndex * 95 + integrationIndex * 35 + policyIndex * 18;
              const driftScore = Math.min(0.92, 0.12 + modelIndex * 0.025 + policyIndex * 0.012 + weekIndex * 0.004 + (decision === 'Review' ? 0.08 : 0));
              const evidenceRate = Math.max(0.61, Math.min(0.99, 0.96 - policyIndex * 0.018 - (decision === 'Blocked' ? 0.05 : 0) + weekIndex * 0.001));
              return {
                week: week.toISOString(), integration, model, environment, enforcePolicy: policy.name,
                decision, severity: policy.severity, riskTier, region, businessUnit, userRole, dataClass,
                regulation, control: policy.control, vendor, system, aiRequests: events,
                policyViolations: policy.name === 'No policy match' ? 0 : events,
                assessments,
                assessmentsPassed: Math.round(assessments * Math.max(0.55, Math.min(0.99, assessmentPassRate))),
                highRiskEvents: policy.severity === 'Critical' && decision !== 'Passed' ? Math.round(events * (0.62 + policyIndex * 0.02)) : 0,
                ungroundedResponses: Math.round(events * groundingRate),
                integrationErrors: Math.round(events * errorRate * (1 + decisionIndex * 0.15)),
                promptInjectionAttempts: policy.name === 'Prompt Injection Shield' ? Math.round(events * 0.86) : Math.round(events * 0.006),
                piiExposureAttempts: policy.name === 'PII & Data Leakage' ? Math.round(events * 0.82) : Math.round(events * 0.004),
                totalTokens: Math.round(events * tokensPerEvent),
                estimatedCost: Number((events * tokensPerEvent * (0.0000014 + modelIndex * 0.00000035)).toFixed(2)),
                latencyMsTotal: Math.round(events * latency),
                latencyMsP95Total: Math.round(events * latency * 1.78),
                uniqueUsers: Math.max(1, Math.round(events / (7 + integrationIndex + environmentIndex))),
                humanOverrides: decision === 'Review' ? Math.round(events * 0.18) : decision === 'Blocked' ? Math.round(events * 0.045) : Math.round(events * 0.006),
                evidenceComplete: Math.round(events * evidenceRate),
                modelDriftScoreTotal: Number((events * driftScore).toFixed(4)),
                exceptionApprovals: decision === 'Review' && policy.name !== 'No policy match' ? Math.round(events * 0.06) : Math.round(events * 0.002),
                unresolvedFindings: decision !== 'Passed' && policy.name !== 'No policy match' ? Math.round(events * 0.14) : Math.round(events * 0.003),
                retentionBreaches: policy.name === 'Retention & Purpose Limit' ? Math.round(events * 0.62) : Math.round(events * 0.002),
                slaBreaches: Math.round(events * (errorRate + (decision === 'Review' ? 0.022 : 0.006)))
              };
            }));
          })
        )
      )
    );
  }
}
