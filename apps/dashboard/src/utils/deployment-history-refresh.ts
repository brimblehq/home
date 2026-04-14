const DEPLOYMENT_HISTORY_REFRESH_KEY = "brimble:deployment-history:refresh";
const DEPLOYMENT_HISTORY_REFRESH_TTL_MS = 10 * 60_000;

type PendingDeploymentHistoryRefresh = {
  projectId: string;
  workspace?: string;
  createdAt: number;
};

type DeploymentHistoryRefreshInput = {
  projectId: string;
  workspace?: string;
};

function normalizeWorkspace(value?: string): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function readPendingRefresh(): PendingDeploymentHistoryRefresh | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(DEPLOYMENT_HISTORY_REFRESH_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PendingDeploymentHistoryRefresh>;
    if (typeof parsed?.projectId !== "string" || !parsed.projectId.trim() || typeof parsed?.createdAt !== "number") {
      window.sessionStorage.removeItem(DEPLOYMENT_HISTORY_REFRESH_KEY);
      return null;
    }

    if (Date.now() - parsed.createdAt > DEPLOYMENT_HISTORY_REFRESH_TTL_MS) {
      window.sessionStorage.removeItem(DEPLOYMENT_HISTORY_REFRESH_KEY);
      return null;
    }

    return {
      projectId: parsed.projectId.trim(),
      workspace: parsed.workspace?.trim() || undefined,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function markDeploymentHistoryForRefresh(input: DeploymentHistoryRefreshInput) {
  if (typeof window === "undefined") {
    return;
  }

  const projectId = input.projectId.trim();
  if (!projectId) {
    return;
  }

  const payload: PendingDeploymentHistoryRefresh = {
    projectId,
    workspace: normalizeWorkspace(input.workspace) ?? undefined,
    createdAt: Date.now(),
  };

  try {
    window.sessionStorage.setItem(DEPLOYMENT_HISTORY_REFRESH_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

export function consumeDeploymentHistoryRefresh(input: DeploymentHistoryRefreshInput): boolean {
  const pending = readPendingRefresh();
  if (!pending) {
    return false;
  }

  const projectId = input.projectId.trim();
  if (!projectId || pending.projectId !== projectId) {
    return false;
  }

  const pendingWorkspace = normalizeWorkspace(pending.workspace);
  const targetWorkspace = normalizeWorkspace(input.workspace);
  if (pendingWorkspace !== targetWorkspace) {
    return false;
  }

  try {
    window.sessionStorage.removeItem(DEPLOYMENT_HISTORY_REFRESH_KEY);
  } catch {
    // ignore storage failures
  }

  return true;
}
