import type { ApiClient } from "./types";

export interface ReplicaInfo {
  id: string;
  container: string;
  shortName?: string;
}

export interface ReplicaMetrics {
  memory: number;
  cpu: number;
  network: {
    bytesPerSecond: number | null;
  };
}

export interface AggregateMetricsPoint {
  date: string;
  memory: number;
  cpu: number;
  network: {
    bytesPerSecond: number | null;
  };
}

export interface PerReplicaMetricsPoint {
  date: string;
  aggregate: ReplicaMetrics;
  replicas: Record<string, ReplicaMetrics>;
}

export interface ResponseTimeMetricsPoint {
  date: string;
  p90: number | null;
  p95: number | null;
  p99: number | null;
  avg: number | null;
}

export interface ResourceObservabilityMetrics {
  average: {
    memory: {
      totalInPercentage: number;
      size: number;
    };
    cpu: {
      totalInPercentage: number;
      size: number;
    };
    network: {
      value: number | null;
      bytesPerSecond: number | null;
    };
  };
  replicas: ReplicaInfo[];
  replicaCount: number;
  results: AggregateMetricsPoint[] | PerReplicaMetricsPoint[];
  responseTime?: {
    average: {
      p90: number | null;
      p95: number | null;
      p99: number | null;
      avg: number | null;
    };
    results: ResponseTimeMetricsPoint[];
  } | null;
}

export interface ObservabilityApi {
  getProjectMetrics(input: {
    projectId: string;
    hrsAgo?: number;
    container?: string;
    breakdown?: "per-replica";
    teamId?: string;
  }): Promise<ResourceObservabilityMetrics>;
  getGrafanaUrl(input?: { teamId?: string }): Promise<string | null>;
}

function parseNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

export function createObservabilityApi(client: ApiClient): ObservabilityApi {
  return {
    async getProjectMetrics(input) {
      const response = await client.request<any>(
        `/core/v1/projects/stats/${encodeURIComponent(input.projectId)}`,
        {
          method: "GET",
          query: {
            hrsAgo: input.hrsAgo,
            container: input.container,
            breakdown: input.breakdown,
            teamId: input.teamId,
          },
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const rawReplicas = Array.isArray(root?.replicas) ? root.replicas : [];
      const rawResults = Array.isArray(root?.results) ? root.results : [];
      const rawResponseTimeResults = Array.isArray(root?.responseTime?.results)
        ? root.responseTime.results
        : [];

      const replicas: ReplicaInfo[] = rawReplicas
        .map((item: any) => {
          const container = typeof item?.container === "string" ? item.container : "";
          const id = String(item?.id ?? item?._id ?? container);
          if (!container) {
            return null;
          }

          return {
            id,
            container,
            shortName:
              typeof item?.shortName === "string"
                ? item.shortName
                : typeof item?.short_name === "string"
                  ? item.short_name
                  : undefined,
          } satisfies ReplicaInfo;
        })
        .filter((item): item is ReplicaInfo => item !== null);

      const results = rawResults.map((point: any) => {
        if (point?.aggregate && point?.replicas) {
          return {
            date: typeof point?.date === "string" ? point.date : "",
            aggregate: {
              memory: parseNumber(point?.aggregate?.memory),
              cpu: parseNumber(point?.aggregate?.cpu),
              network: {
                bytesPerSecond:
                  point?.aggregate?.network?.bytesPerSecond == null
                    ? null
                    : parseNumber(point.aggregate.network.bytesPerSecond),
              },
            },
            replicas: point.replicas,
          } satisfies PerReplicaMetricsPoint;
        }

        return {
          date: typeof point?.date === "string" ? point.date : "",
          memory: parseNumber(point?.memory),
          cpu: parseNumber(point?.cpu),
          network: {
            bytesPerSecond:
              point?.network?.bytesPerSecond == null
                ? null
                : parseNumber(point.network.bytesPerSecond),
          },
        } satisfies AggregateMetricsPoint;
      });

      const responseTime = root?.responseTime
        ? {
            average: {
              p90: root.responseTime?.average?.p90 == null ? null : parseNumber(root.responseTime.average.p90),
              p95: root.responseTime?.average?.p95 == null ? null : parseNumber(root.responseTime.average.p95),
              p99: root.responseTime?.average?.p99 == null ? null : parseNumber(root.responseTime.average.p99),
              avg: root.responseTime?.average?.avg == null ? null : parseNumber(root.responseTime.average.avg),
            },
            results: rawResponseTimeResults.map((item: any) => ({
              date: typeof item?.date === "string" ? item.date : "",
              p90: item?.p90 == null ? null : parseNumber(item.p90),
              p95: item?.p95 == null ? null : parseNumber(item.p95),
              p99: item?.p99 == null ? null : parseNumber(item.p99),
              avg: item?.avg == null ? null : parseNumber(item.avg),
            })),
          }
        : null;

      return {
        average: {
          memory: {
            totalInPercentage: parseNumber(root?.average?.memory?.totalInPercentage),
            size: parseNumber(root?.average?.memory?.size),
          },
          cpu: {
            totalInPercentage: parseNumber(root?.average?.cpu?.totalInPercentage),
            size: parseNumber(root?.average?.cpu?.size),
          },
          network: {
            value: root?.average?.network?.value == null ? null : parseNumber(root.average.network.value),
            bytesPerSecond:
              root?.average?.network?.bytesPerSecond == null
                ? null
                : parseNumber(root.average.network.bytesPerSecond),
          },
        },
        replicas,
        replicaCount:
          typeof root?.replicaCount === "number"
            ? root.replicaCount
            : replicas.length,
        results,
        responseTime,
      };
    },
    async getGrafanaUrl(input) {
      const response = await client.request<any>("/core/v1/projects/stats/grafana", {
        method: "GET",
        query: {
          teamId: input?.teamId,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? {};

      if (typeof root === "string" && root.trim()) {
        return root;
      }

      if (typeof root?.url === "string" && root.url.trim()) {
        return root.url;
      }

      return null;
    },
  };
}
