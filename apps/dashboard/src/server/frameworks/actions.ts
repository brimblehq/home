import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
import type { FrameworkOption } from "@/backend/frameworks";
import config from "@/config";
import { getServerAccessToken } from "@/server/auth/cookies";

function getServerBackendApi() {
  return createBackendApi({
    baseUrl: config.apiUrl,
    getAccessToken: getServerAccessToken,
  });
}

export const listFrameworksServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  return getServerBackendApi().frameworks.list() as Promise<FrameworkOption[]>;
});
