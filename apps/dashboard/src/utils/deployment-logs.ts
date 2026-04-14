import { format } from "date-fns";
import type { RawDeploymentRunLogRow } from "@/backend/deployment-run-logs";

export type DeploymentDrawerLogEntryType = "section" | "detail";
export type DeploymentDrawerLogSectionStatus = "success" | "error";

export interface DeploymentDrawerLogEntry {
  type: DeploymentDrawerLogEntryType;
  message: string;
  timestamp: string;
  status?: DeploymentDrawerLogSectionStatus;
}

interface SectionRule {
  pattern: RegExp;
  status?: DeploymentDrawerLogSectionStatus;
}

const SECTION_RULES: SectionRule[] = [
  { pattern: /deployment queued starting soon/i },
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
    const timestampValue = row.timestamp ?? row.timeStamp ?? parsedLine.embeddedTimestamp;
    entries.push({
      type: classification.type,
      message,
      timestamp: formatTimestamp(timestampValue),
      status: classification.status,
    });
  }

  return entries;
}
