export function clampValue(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function normalizeCpuValue(raw: unknown): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return clampValue(parsed, 0.5, 8);
}

export function normalizeMemoryGbValue(raw: unknown): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0.5;
  }

  let valueInGb = parsed;
  if (parsed > 64) {
    valueInGb = parsed / 1024;
  }

  const rounded = Math.round(valueInGb * 2) / 2;
  return clampValue(rounded, 0.5, 12);
}

export function formatMemory(memoryGb: number): string {
  if (Number.isInteger(memoryGb)) {
    return `${memoryGb} GB`;
  }
  return `${memoryGb.toFixed(1)} GB`;
}
