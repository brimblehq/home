import type { ApiClient } from "./types";

export interface ActivityLogUser {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface ActivityLogItem {
  _id: string;
  user_id: ActivityLogUser;
  team_id: string | null;
  action: string;
  description: string;
  context: string;
  metadata: Record<string, string> | null;
  status: "success" | "failure";
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogGroup {
  label: string;
  items: ActivityLogItem[];
}

export interface ActivityLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActivityLogsResponse {
  logs: ActivityLogGroup[];
  pagination: ActivityLogPagination;
}

export interface ListActivityLogsInput {
  teamId?: string;
  page?: number;
  limit?: number;
  action?: string;
  context?: string;
}

export interface ActivityLogsApi {
  list(input?: ListActivityLogsInput): Promise<ActivityLogsResponse>;
}

export function createActivityLogsApi(client: ApiClient): ActivityLogsApi {
  return {
    async list(input) {
      const response = await client.request<any>("/core/v1/activity-logs", {
        method: "GET",
        query: {
          teamId: input?.teamId,
          page: input?.page,
          limit: input?.limit,
          action: input?.action,
          context: input?.context,
        },
      });

      const root = response?.data ?? response ?? {};
      const rawLogs = Array.isArray(root.logs) ? root.logs : [];

      const logs: ActivityLogGroup[] = rawLogs.map((group: any) => ({
        label: typeof group?.label === "string" ? group.label : "",
        items: Array.isArray(group?.items)
          ? group.items.map((item: any) => ({
              _id: String(item?._id ?? ""),
              user_id: {
                _id: String(item?.user_id?._id ?? ""),
                name: String(item?.user_id?.name ?? ""),
                email: String(item?.user_id?.email ?? ""),
                avatar: item?.user_id?.avatar ?? null,
              },
              team_id: item?.team_id ?? null,
              action: String(item?.action ?? ""),
              description: String(item?.description ?? ""),
              context: String(item?.context ?? ""),
              metadata: item?.metadata ?? null,
              status: item?.status === "failure" ? "failure" : "success",
              resource_type: item?.resource_type ?? null,
              resource_id: item?.resource_id ?? null,
              ip_address: item?.ip_address ?? null,
              user_agent: item?.user_agent ?? null,
              created_at: String(item?.created_at ?? ""),
              updated_at: String(item?.updated_at ?? ""),
            }))
          : [],
      }));

      return {
        logs,
        pagination: {
          page: Number(root.pagination?.page ?? 1),
          limit: Number(root.pagination?.limit ?? 20),
          total: Number(root.pagination?.total ?? 0),
          totalPages: Number(root.pagination?.totalPages ?? 0),
        },
      };
    },
  };
}
