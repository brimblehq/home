import { createServerFn } from "@tanstack/react-start";
import type { FrameworkOption } from "@/backend/frameworks";
import { withTokenRefresh } from "@/server/shared/backend";

export const listFrameworksServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  return withTokenRefresh(async (api) => {
    return api.frameworks.list() as Promise<FrameworkOption[]>;
  });
});
