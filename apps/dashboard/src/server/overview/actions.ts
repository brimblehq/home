import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
import type { OverviewSummary } from "@/backend/overview";
import config from "@/config";
import { getServerAccessToken } from "@/server/auth/cookies";

function getServerBackendApi() {
  return createBackendApi({
    baseUrl: config.apiUrl,
    getAccessToken: getServerAccessToken,
  });
}

export const getHomeOverviewServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as unknown as { workspace?: string } | undefined;
  const workspaceSlug = payload?.workspace?.trim().toLowerCase();

  let teamId: string | undefined;

  if (workspaceSlug) {
    const teams = await getServerBackendApi().workspaces.list();
    const match = teams.items.find((item) => item.slug === workspaceSlug);
    if (match?.id) {
      teamId = match.id;
    }
  }

  return getServerBackendApi().overview.get({ teamId }) as Promise<OverviewSummary>;
});
