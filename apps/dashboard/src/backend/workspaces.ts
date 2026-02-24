import type { ApiClient, ApiListResponse } from "./types";
import { notImplemented } from "./utils";

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  avatarUrl?: string;
  role?: "creator" | "administrator" | "member";
  accepted?: boolean;
}

export interface CreateWorkspaceInput {
  name: string;
  teamSize?: number;
}

export interface WorkspacesApi {
  list(): Promise<ApiListResponse<Workspace>>;
  getById(workspaceId: string): Promise<Workspace>;
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  switchWorkspace(workspaceId: string): Promise<void>;
}

export function createWorkspacesApi(client: ApiClient): WorkspacesApi {
  const listEndpoint = "/core/v1/teams";

  return {
    async list() {
      const response = await client.request<any>(listEndpoint, {
        method: "GET",
      });

      const root = response?.data?.data ?? response?.data ?? response ?? [];
      const teams = Array.isArray(root) ? root : [];

      return {
        items: teams.map((team: any) => ({
          id: String(team?.id ?? team?._id ?? ""),
          name: String(team?.name ?? ""),
          slug: team?.name ? String(team.name).toLowerCase() : undefined,
          avatarUrl: team?.avatar || undefined,
          role: team?.isCreator ? "creator" : "member",
          accepted: team?.accepted !== undefined ? Boolean(team.accepted) : undefined,
        })),
      } satisfies ApiListResponse<Workspace>;
    },
    getById: () => notImplemented<Workspace>("workspaces", "getById"),
    create: () => notImplemented<Workspace>("workspaces", "create"),
    switchWorkspace: () => notImplemented<void>("workspaces", "switchWorkspace"),
  };
}
