import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
import type { RequestLogsPage } from "@/backend/logs";
import config from "@/config";
import { getServerAccessToken } from "@/server/auth/cookies";

function getServerBackendApi() {
  return createBackendApi({
    baseUrl: config.apiUrl,
    getAccessToken: getServerAccessToken,
  });
}

async function resolveTeamIdFromWorkspace(workspace?: string) {
  const workspaceSlug = workspace?.trim().toLowerCase();
  if (!workspaceSlug) {
    return undefined;
  }

  const teams = await getServerBackendApi().workspaces.list();
  const match = teams.items.find((item) => item.slug === workspaceSlug);
  return match?.id ?? undefined;
}

export const listRequestLogsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        workspace?: string;
        page?: number;
        limit?: number;
        status?: string;
        methods?: string;
        hostname?: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);

  return getServerBackendApi().logs.listRequestLogs(projectId, {
    page: payload?.page,
    limit: payload?.limit,
    status: payload?.status,
    methods: payload?.methods,
    hostname: payload?.hostname,
    teamId,
  });
});

export type { RequestLogsPage };
