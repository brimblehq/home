import { createServerFn } from "@tanstack/react-start";
import { withTokenRefresh } from "@/server/shared/backend";
import { BackendApiError } from "@/backend/errors";
import type {
  AnalyticsGetInput,
  AnalyticsPayload,
  AnalyticsRecord,
} from "@/backend/analytics";

export type AnalyticsLoadResult =
  | { state: "enabled"; data: AnalyticsPayload }
  | { state: "empty" }
  | { state: "plan-locked"; message: string }
  | { state: "error"; message: string };

export type EnableAnalyticsResult =
  | { ok: true; data: AnalyticsRecord }
  | { ok: false; planLocked: boolean; message: string };

export const enableAnalyticsServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }): Promise<EnableAnalyticsResult> => {
    const payload = data as { projectId?: string } | undefined;
    const projectId = payload?.projectId?.trim();
    if (!projectId) {
      return { ok: false, planLocked: false, message: "Project ID is required." };
    }
    try {
      const record = await withTokenRefresh((api) => api.analytics.enable(projectId));
      return { ok: true, data: record };
    } catch (error) {
      if (error instanceof BackendApiError) {
        const raw = (error.message ?? "").toLowerCase();
        if (raw.includes("not available for your subscription")) {
          return {
            ok: false,
            planLocked: true,
            message: "Web analytics is part of a paid plan. Upgrade to enable it.",
          };
        }
        if (raw.includes("domain")) {
          return {
            ok: false,
            planLocked: false,
            message: "Add a domain to this project before enabling analytics.",
          };
        }
        if (error.status === 401 || error.status === 403) {
          return {
            ok: false,
            planLocked: false,
            message: "You don't have permission to enable analytics.",
          };
        }
      }
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't enable analytics right now. Please try again.";
      return { ok: false, planLocked: false, message };
    }
  },
);

export const disableAnalyticsServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const payload = data as { projectId?: string } | undefined;
    const projectId = payload?.projectId?.trim();
    if (!projectId) throw new Error("Project ID is required");
    return withTokenRefresh(async (api) => {
      await api.analytics.disable(projectId);
      return { ok: true } as const;
    });
  },
);

export const getAnalyticsServerFn = createServerFn({ method: "GET" }).handler(
  async ({ data }): Promise<AnalyticsLoadResult> => {
    const payload = data as Partial<AnalyticsGetInput> | undefined;
    const projectId = payload?.projectId?.trim();
    if (!projectId) {
      return { state: "error", message: "Project ID is required." };
    }
    if (!payload?.startAt || !payload?.endAt) {
      return { state: "error", message: "Date range is required." };
    }

    try {
      const result = await withTokenRefresh((api) =>
        api.analytics.get({
          projectId,
          startAt: Number(payload.startAt),
          endAt: Number(payload.endAt),
          unit: payload.unit,
          timezone: payload.timezone,
          type: payload.type,
          host:
            typeof payload.host === "string" && payload.host.trim().length > 0
              ? payload.host.trim()
              : undefined,
        }),
      );
      return { state: "enabled", data: result as AnalyticsPayload };
    } catch (error) {
      if (error instanceof BackendApiError) {
        if (error.status === 404) return { state: "empty" };
        const raw = (error.message ?? "").toLowerCase();
        if (
          error.status === 400 &&
          raw.includes("not available for your subscription")
        ) {
          return {
            state: "plan-locked",
            message: "Web analytics is part of a paid plan. Upgrade to enable it.",
          };
        }
      }
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't load analytics right now.";
      return { state: "error", message };
    }
  },
);

export type { AnalyticsRecord };
