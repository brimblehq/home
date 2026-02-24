import type { DateRange } from "react-day-picker";
import { formatDistanceToNow, subDays } from "date-fns";

export const deploymentStatusColor: Record<string, string> = {
  active: "bg-[#13d282]",
  ready: "bg-[#13d282]",
  successful: "bg-[#13d282]",
  failed: "bg-[#fc391e]",
  inprogress: "bg-[#ff7a00]",
  building: "bg-[#ff7a00]",
  pending: "bg-[#ff7a00]",
  queued: "bg-[#ff7a00]",
  cancelled: "bg-dash-text-faded",
  canceled: "bg-dash-text-faded",
};

export const deploymentStatusLabel: Record<string, string> = {
  active: "Successful",
  ready: "Successful",
  successful: "Successful",
  failed: "Failed",
  inprogress: "In Progress",
  building: "Building",
  pending: "Pending",
  queued: "Queued",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

export function defaultDeploymentHistoryDateRange(): DateRange {
  return { from: subDays(new Date(), 30), to: new Date() };
}

export function formatDeploymentTimeAgo(dateStr?: string): string {
  if (!dateStr) {
    return "";
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDistanceToNow(date, { addSuffix: true });
}
