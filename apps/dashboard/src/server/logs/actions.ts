import { createServerFn } from "@tanstack/react-start";
import type { RequestLogsPage } from "@/backend/logs";
import { withTokenRefresh } from "@/server/shared/backend";

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

  return withTokenRefresh(async (api) => {
    const workspaceSlug = payload?.workspace?.trim().toLowerCase();
    let teamId: string | undefined;

    if (workspaceSlug) {
      const teams = await api.workspaces.list();
      const match = teams.items.find((item) => item.slug === workspaceSlug);
      teamId = match?.id ?? undefined;
    }

    return api.logs.listRequestLogs(projectId, {
      page: payload?.page,
      limit: payload?.limit,
      status: payload?.status,
      methods: payload?.methods,
      hostname: payload?.hostname,
      teamId,
    });
  });
});

export type { RequestLogsPage };
