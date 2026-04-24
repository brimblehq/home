import { format } from "date-fns";
import type { RawDeploymentRunLogRow } from "@/backend/deployment-run-logs";

export type DeploymentDrawerLogEntryType = "section" | "detail";
export type DeploymentDrawerLogSectionStatus = "success" | "error" | "pending";

export interface DeploymentDrawerLogEntry {
  rawId?: string;
  type: DeploymentDrawerLogEntryType;
  message: string;
  timestamp: string;
  timestampRaw?: string;
  timestampMs?: number | null;
  status?: DeploymentDrawerLogSectionStatus;
}

interface SectionRule {
  pattern: RegExp;
  status?: DeploymentDrawerLogSectionStatus;
}

const SECTION_RULES: SectionRule[] = [
  { pattern: /^(?:⚡(?:\uFE0F)?\s*)?starting\b/i },
  { pattern: /deployment queued starting soon/i, status: "pending" },
  { pattern: /deployment started/i, status: "success" },
  { pattern: /site (is )?(live|running)\b/i, status: "success" },
  { pattern: /deployment failed/i, status: "error" },
  { pattern: /build failed/i, status: "error" },
  { pattern: /failed to deploy/i, status: "error" },
];

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return format(date, "MMM dd yyyy  HH:mm:ss");
}

function parseTimestampMs(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

function tryParseEmbeddedLogLine(content: string): {
  message: string;
  embeddedTimestamp?: string;
} {
  const trimmed = content.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\s+---\s+(.+)$/i);

  if (!match) {
    return { message: trimmed };
  }

  return {
    embeddedTimestamp: match[1],
    message: match[2].trim(),
  };
}

function classifyLogMessage(message: string): {
  type: DeploymentDrawerLogEntryType;
  status?: DeploymentDrawerLogSectionStatus;
} {
  for (const rule of SECTION_RULES) {
    if (rule.pattern.test(message)) {
      return { type: "section", status: rule.status };
    }
  }

  return { type: "detail" };
}

export function mapDeploymentRunLogsToDrawerEntries(rows: RawDeploymentRunLogRow[]): DeploymentDrawerLogEntry[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const entries: DeploymentDrawerLogEntry[] = [];

  for (const row of rows) {
    const rawContent = typeof row.content === "string" ? row.content : "";
    if (!rawContent.trim()) {
      continue;
    }

    const parsedLine = tryParseEmbeddedLogLine(rawContent);
    const message = parsedLine.message;

    const classification = classifyLogMessage(message);
    const timestampValue = parsedLine.embeddedTimestamp ?? row.timestamp ?? row.timeStamp;
    entries.push({
      rawId: row.id,
      type: classification.type,
      message,
      timestamp: formatTimestamp(timestampValue),
      timestampRaw: timestampValue ?? undefined,
      timestampMs: parseTimestampMs(timestampValue),
      status: classification.status,
    });
  }

  return sortDeploymentDrawerEntries(entries);
}

export function sortDeploymentDrawerEntries(entries: DeploymentDrawerLogEntry[]): DeploymentDrawerLogEntry[] {
  if (entries.length <= 1) {
    return entries;
  }

  return [...entries].sort((a, b) => {
    const aMs = typeof a.timestampMs === "number" ? a.timestampMs : null;
    const bMs = typeof b.timestampMs === "number" ? b.timestampMs : null;

    if (aMs !== null && bMs !== null && aMs !== bMs) {
      return aMs - bMs;
    }

    if (aMs !== null && bMs === null) {
      return -1;
    }

    if (aMs === null && bMs !== null) {
      return 1;
    }

    return 0;
  });
}
