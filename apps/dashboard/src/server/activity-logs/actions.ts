import { createServerFn } from "@tanstack/react-start";
import type { ActivityLogsResponse } from "@/backend/activity-logs";
import { withTokenRefresh } from "@/server/shared/backend";

export const listActivityLogsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        page?: number;
        limit?: number;
        action?: string;
        context?: string;
      }
    | undefined;

  return withTokenRefresh(async (api) => {
    let teamId: string | undefined;

    const workspaceSlug = payload?.workspace?.trim().toLowerCase();
    if (workspaceSlug) {
      const teams = await api.workspaces.list();
      const match = teams.items.find((item) => item.slug === workspaceSlug);
      teamId = match?.id ?? undefined;
    }

    return api.activityLogs.list({
      teamId,
      page: payload?.page,
      limit: payload?.limit,
      action: payload?.action,
      context: payload?.context,
    });
  });
});

export type { ActivityLogsResponse };
