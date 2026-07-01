import type { AnalyticsPoint, Connector, QueryIr } from '@cx/contracts';

const teams = ['Billing', 'Retention', 'Support'];

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
      for (let teamIndex = 0; teamIndex < teams.length; teamIndex += 1) {
        points.push({
          timestamp: cursor.toISOString(), dimensionId: query.dimensions[0]!.id,
          dimensionValue: teams[teamIndex]!, metricId: query.metric.id,
          value: 82 + teamIndex * 19 + ((week * 13 + teamIndex * 7) % 31)
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 7);
      week += 1;
    }
    return { points, dataFreshness: new Date(end.getTime() - 60_000).toISOString() };
  }
}
