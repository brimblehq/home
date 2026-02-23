/**
 * Billing plan constants and backend-to-UI mapping.
 *
 * Source of truth: DASHBOARD_BILLING_GUIDE.md
 */

/* ─── Backend → UI name mapping ─── */

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  FREE_PLAN: "Free",
  HACKER_PLAN: "Hacker",
  DEVELOPER_PLAN: "Pro",
  TEAM_PLAN: "Team",
};

export function getPlanDisplayName(backendName: string): string {
  return PLAN_DISPLAY_NAMES[backendName] ?? backendName;
}

/* ─── Personal plan pricing (monthly only) ─── */

export const PERSONAL_PLANS = [
  { name: "Free", backendKey: "FREE_PLAN", price: 0, projects: 5, bandwidth: 10, concurrentBuilds: 0, logRetention: 3 },
  { name: "Hacker", backendKey: "HACKER_PLAN", price: 7, projects: 10, bandwidth: 30, concurrentBuilds: 1, logRetention: 7 },
  { name: "Pro", backendKey: "DEVELOPER_PLAN", price: 19, projects: 150, bandwidth: 150, concurrentBuilds: 2, logRetention: 30 },
] as const;

/* ─── Team plan pricing ─── */

export const TEAM_COST_PER_MEMBER = 5;
export const TEAM_COST_PER_BUILD = 7.5;
export const TEAM_MAX_PROJECTS = 500;
export const TEAM_BANDWIDTH_GB = 500;
export const TEAM_CONCURRENT_BUILDS = 2;
export const TEAM_LOG_RETENTION_DAYS = 30;

export function calculateTeamCost(members: number, builds: number): number {
  return members * TEAM_COST_PER_MEMBER + builds * TEAM_COST_PER_BUILD;
}

/* ─── Overage rates ─── */

export const OVERAGE_BANDWIDTH_PER_GB = 0.25;
export const OVERAGE_BUILD_MINUTES_PER_MIN = 0.002;

/* ─── Team roles ─── */

export const TEAM_ROLES = ["Creator", "Administrator", "Member"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

/**
 * Roles available when inviting — Creator is assigned automatically to the
 * workspace creator, so it's excluded from invite dropdowns.
 */
export const INVITABLE_ROLES: TeamRole[] = ["Administrator", "Member"];
