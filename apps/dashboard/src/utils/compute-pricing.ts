import type { MeteredRates } from "@/types/pricing";

const PLAN_COMPUTE_DEFAULTS: Record<string, { cpu: number; memory: number }> = {
  free: { cpu: 0.25, memory: 0.25 },
  hacker: { cpu: 0.5, memory: 0.5 },
  developer: { cpu: 1, memory: 1 },
  team: { cpu: 1, memory: 1 },
};

export interface CostBreakdown {
  cpu: { excess: number; cost: number; rate: number };
  memory: { excess: number; cost: number; rate: number };
  storage: { amount: number; cost: number; rate: number };
  total: number;
}

export function estimateComputeCost(
  config: { cpu: number; memory: number; storage: number },
  planKey: string,
  metered: MeteredRates,
): CostBreakdown {
  const defaults = PLAN_COMPUTE_DEFAULTS[planKey] ?? PLAN_COMPUTE_DEFAULTS.free;
  const cpuExcess = Math.max(0, config.cpu - defaults.cpu);
  const memExcess = Math.max(0, config.memory - defaults.memory);
  const cpuCost = cpuExcess * metered.cpuPerGbMonth;
  const memCost = memExcess * metered.memoryPerGbMonth;
  const storageCost = config.storage * metered.storagePerGbMonth;
  return {
    cpu: { excess: cpuExcess, cost: cpuCost, rate: metered.cpuPerGbMonth },
    memory: { excess: memExcess, cost: memCost, rate: metered.memoryPerGbMonth },
    storage: { amount: config.storage, cost: storageCost, rate: metered.storagePerGbMonth },
    total: cpuCost + memCost + storageCost,
  };
}
