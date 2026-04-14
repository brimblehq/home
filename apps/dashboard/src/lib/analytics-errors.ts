import { BackendApiError } from "@/backend/errors";

export interface FriendlyAnalyticsError {
  message: string;
  planLocked: boolean;
  notFound: boolean;
}

export function friendlyAnalyticsError(error: unknown): FriendlyAnalyticsError {
  // Server functions serialize errors to plain Error objects across the boundary,
  // so we can't always rely on `instanceof BackendApiError`. Match by message too.
  const status = error instanceof BackendApiError ? (error.status ?? 0) : 0;
  const raw = error instanceof Error ? (error.message ?? "").toLowerCase() : "";

  if (raw.includes("not available for your subscription")) {
    return {
      message: "Web analytics is not supported on your plan. Upgrade to enable it.",
      planLocked: true,
      notFound: false,
    };
  }
  if (raw.includes("no domain") || raw.includes("add a domain")) {
    return {
      message: "Add a domain to this project before enabling analytics.",
      planLocked: false,
      notFound: false,
    };
  }
  if (raw.includes("not found") && raw.includes("analytics")) {
    return {
      message: "We couldn't find this project's analytics.",
      planLocked: false,
      notFound: true,
    };
  }
  if (raw.includes("permission") || raw.includes("forbidden")) {
    return {
      message: "You don't have permission to manage analytics for this project.",
      planLocked: false,
      notFound: false,
    };
  }

  if (error instanceof BackendApiError) {
    if (status === 400) {
      return {
        message: "That request couldn't be processed. Please try again.",
        planLocked: false,
        notFound: false,
      };
    }
    if (status === 401) {
      return {
        message: "Please sign in again to view analytics.",
        planLocked: false,
        notFound: false,
      };
    }
    if (status === 403) {
      return {
        message: "You don't have permission to manage analytics for this project.",
        planLocked: false,
        notFound: false,
      };
    }
    if (status === 404) {
      return {
        message: "We couldn't find this project's analytics.",
        planLocked: false,
        notFound: true,
      };
    }
    if (status >= 500) {
      return {
        message: "Analytics is having a moment. Please try again in a bit.",
        planLocked: false,
        notFound: false,
      };
    }
  }

  if (error instanceof Error && /network|fetch|reach/i.test(error.message)) {
    return {
      message: "Couldn't reach analytics. Check your connection and try again.",
      planLocked: false,
      notFound: false,
    };
  }

  return {
    message: "Something went wrong loading analytics. Please try again.",
    planLocked: false,
    notFound: false,
  };
}
