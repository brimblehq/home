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

export const listWorkspacesServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  return getServerBackendApi().workspaces.list();
});
