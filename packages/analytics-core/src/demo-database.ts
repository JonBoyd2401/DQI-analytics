export interface DemoAggregateRow {
  week: string;
  integration: string;
  model: string;
  environment: string;
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
          environments.map((environment, environmentIndex) => {
            const seasonal = Math.sin((weekIndex / 26) * Math.PI * 4) * 180;
            const growth = weekIndex * (45 + integrationIndex * 8);
            const base = 850 + integrationIndex * 280 + modelIndex * 190 - environmentIndex * 240;
            const aiRequests = Math.max(120, Math.round(base + seasonal + growth + ((weekIndex * 97 + modelIndex * 53) % 170)));
            const violationRate = 0.012 + integrationIndex * 0.004 + modelIndex * 0.002 + (integrationIndex === 3 ? weekIndex * 0.00045 : -weekIndex * 0.00012);
            const assessmentRate = environment === 'Production' ? 0.16 : 0.08;
            const assessments = Math.max(20, Math.round(aiRequests * assessmentRate));
            const passRate = 0.94 - integrationIndex * 0.018 - modelIndex * 0.009 + weekIndex * 0.001;
            const groundingRate = 0.021 + integrationIndex * 0.006 + modelIndex * 0.003 - weekIndex * 0.00035;
            const errorRate = 0.007 + integrationIndex * 0.002 + environmentIndex * 0.003 + Math.abs(Math.cos(weekIndex / 4)) * 0.003;
            return {
              week: week.toISOString(), integration, model, environment, aiRequests,
              policyViolations: Math.max(0, Math.round(aiRequests * violationRate)),
              assessments,
              assessmentsPassed: Math.round(assessments * Math.max(0.72, Math.min(0.98, passRate))),
              highRiskEvents: Math.max(0, Math.round(aiRequests * violationRate * (0.21 + modelIndex * 0.025))),
              ungroundedResponses: Math.max(0, Math.round(aiRequests * groundingRate)),
              integrationErrors: Math.max(0, Math.round(aiRequests * errorRate))
            };
          })
        )
      )
    );
  }
}
