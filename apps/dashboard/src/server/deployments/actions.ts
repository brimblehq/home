import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
import { listDeploymentRunLogsFromSupabase } from "@/backend/deployment-run-logs";
import type {
  PaginatedDeploymentsResponse,
  DeploymentLog,
} from "@/backend/deployments";
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
  if (!workspaceSlug) return undefined;

  const teams = await getServerBackendApi().workspaces.list();
  const match = teams.items.find((item) => item.slug === workspaceSlug);
  return match?.id ?? undefined;
}

async function resolveLogOwnerId(workspace?: string) {
  const workspaceSlug = workspace?.trim();
  const teamId = await resolveTeamIdFromWorkspace(workspace);
  if (teamId) {
    return teamId;
  }

  if (workspaceSlug) {
    throw new Error("Workspace not found for deployment logs");
  }

  const session = await getServerBackendApi().auth.getCurrentSession();
  const userId = session?.user?.id?.trim();

  if (!userId) {
    throw new Error("Unable to resolve current user for deployment logs");
  }

  return userId;
}

export const listDeploymentsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        workspace?: string;
        page?: number;
        limit?: number;
        statuses?: string;
        environment?: string;
        start?: string;
        end?: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);

  return getServerBackendApi().deployments.list(projectId, {
    page: payload?.page,
    limit: payload?.limit,
    statuses: payload?.statuses,
    environment: payload?.environment,
    start: payload?.start,
    end: payload?.end,
    teamId,
  });
});

export const getDeploymentDetailsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        logId: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  const logId = payload?.logId?.trim();
  if (!projectId || !logId) {
    throw new Error("Project ID and Log ID are required");
  }

  return getServerBackendApi().deployments.getById(projectId, logId);
});

export const redeployServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        logId: string;
        workspace?: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  const logId = payload?.logId?.trim();
  if (!projectId || !logId) {
    throw new Error("Project ID and Log ID are required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);
  return getServerBackendApi().deployments.redeploy(projectId, logId, { teamId });
});

export const cancelDeploymentServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        logId: string;
        workspace?: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  const logId = payload?.logId?.trim();
  if (!projectId || !logId) {
    throw new Error("Project ID and Log ID are required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);
  await getServerBackendApi().deployments.cancel(projectId, logId, { teamId });
  return { success: true };
});

export interface DeploymentRunLogsResponse {
  entries: import("@/utils/deployment-logs").DeploymentDrawerLogEntry[];
}

export const listDeploymentRunLogsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        logId: string;
        workspace?: string;
      }
    | undefined;

  const logId = payload?.logId?.trim();
  if (!logId) {
    throw new Error("Deployment log ID is required");
  }

  const ownerId = await resolveLogOwnerId(payload?.workspace);

  const rows = await listDeploymentRunLogsFromSupabase({
    supabaseUrl: config.supabaseUrl,
    supabaseKey: config.supabaseKey,
    tableName: config.supabaseTableName,
    filter: {
      logId,
      ownerId,
    },
  });

  const { mapDeploymentRunLogsToDrawerEntries } = await import(
    "@/utils/deployment-logs"
  );

  return {
    entries: mapDeploymentRunLogsToDrawerEntries(rows),
  };
});

export type { PaginatedDeploymentsResponse, DeploymentLog };
