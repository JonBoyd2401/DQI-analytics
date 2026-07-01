import type { AnalyticsPoint, Connector, QueryIr } from '@dqi/contracts';

const integrations = ['Customer Service Copilot', 'Knowledge Search', 'Quality Monitor'];

export class SyntheticConnector implements Connector {
  readonly id = 'connection.demo';
  async execute(query: QueryIr, compiledQuery: Record<string, unknown>, signal?: AbortSignal): Promise<{ points: Omit<AnalyticsPoint, 'provenanceId'>[]; dataFreshness: string }> {
    void compiledQuery;
    signal?.throwIfAborted();
    const points: Omit<AnalyticsPoint, 'provenanceId'>[] = [];
    const cursor = new Date(query.time.from);
    const end = new Date(query.time.to);
    let week = 0;
    while (cursor < end) {
      for (let integrationIndex = 0; integrationIndex < integrations.length; integrationIndex += 1) {
        points.push({
          timestamp: cursor.toISOString(), dimensionId: query.dimensions[0]!.id,
          dimensionValue: integrations[integrationIndex]!, metricId: query.metric.id,
          value: 8200 + integrationIndex * 1900 + week * 310 + ((week * 97 + integrationIndex * 71) % 530)
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 7);
      week += 1;
    }
    return { points, dataFreshness: new Date(end.getTime() - 60_000).toISOString() };
  }
}
