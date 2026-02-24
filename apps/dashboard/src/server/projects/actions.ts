import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
import config from "@/config";
import { getServerAccessToken } from "@/server/auth/cookies";

function getServerBackendApi() {
  return createBackendApi({
    baseUrl: config.apiUrl,
    getAccessToken: getServerAccessToken,
  });
}

export const listHomeProjectsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as unknown as { workspace?: string } | undefined;
  const workspaceSlug = payload?.workspace?.trim().toLowerCase();

  let teamId: string | undefined;

  if (workspaceSlug) {
    const teams = await getServerBackendApi().workspaces.list();
    const match = teams.items.find((item) => item.slug === workspaceSlug);
    if (match?.id) {
      teamId = match.id;
    }
  }

  return getServerBackendApi().projects.list({
    sort: "updatedAt",
    teamId,
  });
});

export const listProjectsPageServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        page?: number;
      }
    | undefined;

  const workspaceSlug = payload?.workspace?.trim().toLowerCase();
  const requestedPage = payload?.page;

  let page = 1;
  if (typeof requestedPage === "number" && Number.isFinite(requestedPage) && requestedPage > 0) {
    page = Math.floor(requestedPage);
  }

  let teamId: string | undefined;

  if (workspaceSlug) {
    const teams = await getServerBackendApi().workspaces.list();
    const match = teams.items.find((item) => item.slug === workspaceSlug);
    if (match?.id) {
      teamId = match.id;
    }
  }

  return getServerBackendApi().projects.list({
    sort: "updatedAt",
    page,
    teamId,
  });
});

export const getProjectDetailsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        workspace?: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const workspaceSlug = payload?.workspace?.trim().toLowerCase();
  let teamId: string | undefined;

  if (workspaceSlug) {
    const teams = await getServerBackendApi().workspaces.list();
    const match = teams.items.find((item) => item.slug === workspaceSlug);
    if (match?.id) {
      teamId = match.id;
    }
  }

  return getServerBackendApi().projects.getById(projectId, { teamId });
});

export const getProjectScreenshotServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  return getServerBackendApi().projects.getScreenshot(projectId);
});

export const redeployProjectServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        workspace?: string;
        logId?: string;
        startOnly?: boolean;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const workspaceSlug = payload?.workspace?.trim().toLowerCase();
  let teamId: string | undefined;

  if (workspaceSlug) {
    const teams = await getServerBackendApi().workspaces.list();
    const match = teams.items.find((item) => item.slug === workspaceSlug);
    if (match?.id) {
      teamId = match.id;
    }
  }

  return getServerBackendApi().projects.redeploy(projectId, {
    teamId,
    logId: payload?.logId,
    startOnly: payload?.startOnly,
  });
});

export const saveProjectGeneralConfigServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        projectId: string;
        workspace?: string;
        name: string;
        branch?: string;
        rootDirectory?: string;
        framework?: string;
      }
    | undefined;

  const projectId = payload?.projectId?.trim();
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const name = payload?.name?.trim();
  if (!name) {
    throw new Error("Project name is required");
  }

  const workspaceSlug = payload?.workspace?.trim().toLowerCase();
  let teamId: string | undefined;

  if (workspaceSlug) {
    const teams = await getServerBackendApi().workspaces.list();
    const match = teams.items.find((item) => item.slug === workspaceSlug);
    if (match?.id) {
      teamId = match.id;
    }
  }

  const body: Record<string, unknown> = {
    name,
  };

  if (typeof payload?.framework === "string") {
    body.framework = payload.framework;
  }

  if (typeof payload?.rootDirectory === "string") {
    if (payload.rootDirectory === "./") {
      body.rootDirectory = "";
    } else {
      body.rootDirectory = payload.rootDirectory;
    }
  }

  if (typeof payload?.branch === "string" && payload.branch.trim()) {
    body.repo = {
      branch: payload.branch.trim(),
    };
  }

  return getServerBackendApi().projects.redeploy(projectId, {
    teamId,
    payload: body,
  });
});
