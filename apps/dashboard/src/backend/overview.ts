import type { ApiClient } from "./types";

export interface OverviewTotals {
  project: number;
  domain: number;
  team: number;
}

export interface OverviewSummary {
  total: OverviewTotals;
}

export interface OverviewApi {
  get(input?: { teamId?: string }): Promise<OverviewSummary>;
}

export function createOverviewApi(client: ApiClient): OverviewApi {
  return {
    async get(input) {
      const response = await client.request<any>("/core/v1/overview", {
        method: "GET",
        query: {
          teamId: input?.teamId,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const totals = root?.total ?? root ?? {};

      return {
        total: {
          project: typeof totals?.project === "number" ? totals.project : 0,
          domain: typeof totals?.domain === "number" ? totals.domain : 0,
          team: typeof totals?.team === "number" ? totals.team : 0,
        },
      };
    },
  };
}
