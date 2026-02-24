import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
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
  if (match?.id) {
    return match.id;
  }

  return undefined;
}

export const getProjectObservabilityMetricsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        workspace?: string;
        hrsAgo?: number;
        container?: string;
        breakdown?: "per-replica";
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);

  return getServerBackendApi().observability.getProjectMetrics({
    projectId,
    teamId,
    hrsAgo: payload?.hrsAgo,
    container: payload?.container,
    breakdown: payload?.breakdown,
  });
});

export const getObservabilityGrafanaUrlServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
      }
    | undefined;

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);

  return getServerBackendApi().observability.getGrafanaUrl({
    teamId,
  });
});
