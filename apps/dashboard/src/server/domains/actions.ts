import { createServerFn } from "@tanstack/react-start";
import { createBackendApi } from "@/backend";
import type {
  DomainDetailsRecord,
  DomainRecord,
  PaginatedDomainsResponse,
} from "@/backend/domains";
import type { PaginatedProjectsResponse } from "@/backend/projects";
import config from "@/config";
import { getServerAccessToken } from "@/server/auth/cookies";

function getServerBackendApi() {
  return createBackendApi({
    baseUrl: config.apiUrl,
    getAccessToken: getServerAccessToken,
  });
}

async function resolveTeamIdFromWorkspace(workspace?: string) {
  const workspaceSlug = workspace?.trim().toLowerCase();
  if (!workspaceSlug) {
    return undefined;
  }

  const teams = await getServerBackendApi().workspaces.list();
  const match = teams.items.find((item) => item.slug === workspaceSlug);
  if (match?.id) {
    return match.id;
  }

  return undefined;
}

export const listDomainsPageServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        page?: number;
        q?: string;
        projectName?: string;
      }
    | undefined;

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);

  return getServerBackendApi().domains.list({
    page: payload?.page,
    q: payload?.q,
    projectName: payload?.projectName,
    teamId,
  });
});

export const refreshDomainStatusServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        domainName: string;
      }
    | undefined;

  const domainName = payload?.domainName?.trim();
  if (!domainName) {
    throw new Error("Domain name is required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);
  return getServerBackendApi().domains.getStatus(domainName, { teamId });
});

export const getDomainDetailsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        domainName: string;
      }
    | undefined;

  const domainName = payload?.domainName?.trim();
  if (!domainName) {
    throw new Error("Domain name is required");
  }

  const api = getServerBackendApi();
  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);

  let domain = await api.domains.getByName(domainName, { teamId });

  if (!domain && teamId) {
    domain = await api.domains.getByName(domainName, {});
  }

  if (!domain) {
    throw new Error(`Domain not found: ${domainName}`);
  }

  return domain;
});

export const createProjectDomainServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        projectId?: string;
        name: string;
      }
    | undefined;

  const name = payload?.name?.trim().toLowerCase();
  if (!name) {
    throw new Error("Domain name is required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);
  return getServerBackendApi().domains.add({
    name,
    projectId: payload?.projectId,
    teamId,
  });
});

export const updateDomainServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        id: string;
        name?: string;
        redirect?: {
          url?: string;
          status?: number;
        } | null;
      }
    | undefined;

  const id = payload?.id?.trim();
  if (!id) {
    throw new Error("Domain id is required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);
  return getServerBackendApi().domains.update({
    id,
    name: payload?.name?.trim(),
    redirect: payload?.redirect ?? null,
    teamId,
  });
});

export const transferDomainServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        domainId: string;
        projectId: string;
      }
    | undefined;

  const domainId = payload?.domainId?.trim();
  const projectId = payload?.projectId?.trim();
  if (!domainId) {
    throw new Error("Domain id is required");
  }
  if (!projectId) {
    throw new Error("Project id is required");
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);
  await getServerBackendApi().domains.transfer({
    domainId,
    projectId,
    teamId,
  });

  return { success: true };
});

export const deleteDomainServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
        domainId: string;
        projectId?: string;
      }
    | undefined;

  const domainId = payload?.domainId?.trim();
  if (!domainId) {
    throw new Error("Domain id is required");
  }

  let projectId: string | undefined;
  if (typeof payload?.projectId === "string" && payload.projectId.trim()) {
    projectId = payload.projectId.trim();
  }

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);
  await getServerBackendApi().domains.remove({
    domainId,
    projectId,
    teamId,
  });

  return { success: true };
});

export const searchDomainSaleServerFn = createServerFn({
  method: "POST",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        name: string;
      }
    | undefined;

  const name = payload?.name?.trim().toLowerCase();
  if (!name) {
    return [];
  }

  return getServerBackendApi().domains.searchSale(name);
});

export const listDomainProjectsServerFn = createServerFn({
  method: "GET",
}).handler(async ({ data }) => {
  const payload = data as
    | {
        workspace?: string;
      }
    | undefined;

  const teamId = await resolveTeamIdFromWorkspace(payload?.workspace);

  return getServerBackendApi().projects.list({
    teamId,
    sort: "updatedAt",
    page: 1,
    limit: 100,
  }) as Promise<PaginatedProjectsResponse>;
});

export type { DomainDetailsRecord, DomainRecord, PaginatedDomainsResponse };
