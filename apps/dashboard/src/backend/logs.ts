import type { ApiClient } from "./types";

export interface RequestLogEntry {
  status: number;
  url: string;
  browser: string;
  timestamp: string;
  hostname: string;
  project?: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  method: string;
  message: string;
}

export interface RequestLogsPage {
  items: RequestLogEntry[];
  totalLogs: number;
  totalPages: number;
  currentPage: number;
  hostnames: string[];
  statuses: string[];
  methods: string[];
}

export interface ListRequestLogsInput {
  page?: number;
  limit?: number;
  status?: string;
  methods?: string;
  hostname?: string;
  teamId?: string;
}

export interface LogsApi {
  listRequestLogs(projectId: string, input?: ListRequestLogsInput): Promise<RequestLogsPage>;
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val === null || val === undefined) {
      continue;
    }
    result[key] = String(val);
  }
  return result;
}

function mapRequestLogEntry(log: any): RequestLogEntry {
  return {
    status: Number(log?.status ?? 0),
    url: String(log?.url ?? ""),
    browser: String(log?.browser ?? ""),
    timestamp: String(log?.timestamp ?? ""),
    hostname: String(log?.hostname ?? log?.host ?? ""),
    project: typeof log?.project === "string" ? log.project : undefined,
    headers: toStringRecord(log?.headers),
    query:
      log?.query && typeof log.query === "object"
        ? toStringRecord(log.query)
        : undefined,
    method: String(log?.method ?? "").toUpperCase(),
    message: String(log?.message ?? log?.response ?? ""),
  };
}

export function createLogsApi(client: ApiClient): LogsApi {
  return {
    async listRequestLogs(projectId, input) {
      const response = await client.request<any>(
        `/core/v1/logs/requests/${encodeURIComponent(projectId)}`,
        {
          method: "GET",
          query: {
            page: input?.page,
            limit: input?.limit,
            status: input?.status,
            methods: input?.methods,
            hostname: input?.hostname,
            teamId: input?.teamId,
          },
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const rawLogs = Array.isArray(root.logs) ? root.logs : [];
      const items = rawLogs.map(mapRequestLogEntry);

      const hostnames = [...new Set(items.map((item) => item.hostname).filter(Boolean))];
      const statuses = [...new Set(items.map((item) => String(item.status)).filter(Boolean))];
      const methods = [...new Set(items.map((item) => item.method).filter(Boolean))];

      return {
        items,
        totalLogs: Number(root.totalLogs ?? root.total ?? items.length ?? 0),
        totalPages: Number(root.totalPages ?? 1),
        currentPage: Number(root.currentPage ?? 1),
        hostnames,
        statuses,
        methods,
      };
    },
  };
}
