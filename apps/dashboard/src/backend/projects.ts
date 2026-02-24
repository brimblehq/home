import type { ApiClient, ApiListResponse } from "./types";
import { notImplemented } from "./utils";

export interface Project {
  id: string;
  name: string;
  slug: string;
  screenshot?: string;
  framework?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  region?: string;
  serviceType?: string;
  authEnabled?: boolean;
  maintenance?: boolean;
  passwordEnabled?: boolean;
  previewUrl?: string;
  gitLink?: string;
  statusCode?: number;
  healthCheckPath?: string;
  preStartCommand?: string;
  rootDirectory?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
  diskSize?: number;
  volumeMount?: string;
  whiteListedIps?: string[];
  autoscalingGroup?: {
    id?: string;
    name?: string;
    [key: string]: unknown;
  } | null;
  dbImage?: {
    id?: string;
    name?: string;
    [key: string]: unknown;
  } | null;
  specs?: {
    memory?: number | string;
    cpu?: number | string;
    storage?: number | string;
    region?: {
      id?: string;
      _id?: string;
      name?: string;
      country?: string;
      continent?: string;
      provider?: string;
      [key: string]: unknown;
    } | null;
  };
  domains?: Array<{
    id?: string;
    name: string;
    isDefault?: boolean;
    createdAt?: string;
    status?: string;
  }>;
  repo?: {
    name?: string;
    fullName?: string;
    branch?: string;
    git?: string;
    installationId?: number | string;
  };
  log?: {
    message?: string;
  };
}

export interface ListProjectsInput {
  q?: string;
  sort?: string;
  teamId?: string;
  page?: number;
  limit?: number;
}

export interface CreateProjectInput {
  name: string;
  slug?: string;
  repositoryId?: string;
  framework?: string;
  rootDirectory?: string;
}

export interface UpdateProjectInput {
  name?: string;
  framework?: string;
  rootDirectory?: string;
}

export interface ProjectsApi {
  list(input?: ListProjectsInput): Promise<PaginatedProjectsResponse>;
  getById(projectId: string, input?: { teamId?: string }): Promise<Project>;
  getScreenshot(projectId: string): Promise<string | null>;
  redeploy(
    projectId: string,
    input?: {
      logId?: string;
      startOnly?: boolean;
      teamId?: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<{ id?: string; message?: string }>;
  create(input: CreateProjectInput): Promise<Project>;
  update(projectId: string, input: UpdateProjectInput): Promise<Project>;
  remove(projectId: string): Promise<void>;
}

export interface PaginatedProjectsResponse extends ApiListResponse<Project> {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  overallTotalProjects?: number;
}

export function createProjectsApi(client: ApiClient): ProjectsApi {
  const listEndpoint = "/core/v1/projects";

  function mapProject(project: any): Project {
    let region: string | undefined;
    const regionSource = project?.specs?.region ?? project?.region;
    if (typeof regionSource === "string") {
      region = regionSource;
    } else if (regionSource && typeof regionSource === "object") {
      const regionName =
        typeof regionSource.name === "string" ? regionSource.name.trim() : "";
      const regionCountry =
        typeof regionSource.country === "string" ? regionSource.country.trim() : "";

      if (regionName && regionCountry) {
        region = `${regionName} (${regionCountry})`;
      } else if (regionName) {
        region = regionName;
      } else if (regionCountry) {
        region = regionCountry;
      }
    }

    let passwordEnabled: boolean | undefined;
    if (typeof project?.passwordEnabled === "boolean") {
      passwordEnabled = project.passwordEnabled;
    } else if (typeof project?.password_enabled === "boolean") {
      passwordEnabled = project.password_enabled;
    }

    let previewUrl: string | undefined;
    if (typeof project?.previewUrl === "string") {
      previewUrl = project.previewUrl;
    } else if (typeof project?.url === "string") {
      previewUrl = project.url;
    }

    let gitLink: string | undefined;
    if (typeof project?.gitLink === "string" && project.gitLink.trim()) {
      gitLink = project.gitLink;
    } else if (typeof project?.repo?.url === "string" && project.repo.url.trim()) {
      gitLink = project.repo.url;
    } else if (
      typeof project?.repo?.html_url === "string" &&
      project.repo.html_url.trim()
    ) {
      gitLink = project.repo.html_url;
    }

    let statusCode: number | undefined;
    if (typeof project?.statusCode === "number") {
      statusCode = project.statusCode;
    } else if (typeof project?.status_code === "number") {
      statusCode = project.status_code;
    }

    let domains: Project["domains"];
    if (Array.isArray(project?.domains)) {
      domains = project.domains
        .filter((domain: any) => domain?.name)
        .map((domain: any) => {
          let isDefault: boolean | undefined;
          if (typeof domain?.default === "boolean") {
            isDefault = domain.default;
          } else if (typeof domain?.isDefault === "boolean") {
            isDefault = domain.isDefault;
          }

          return {
            id: domain?.id ?? domain?._id,
            name: String(domain.name),
            isDefault,
            createdAt: domain?.createdAt,
            status: domain?.status,
          };
        });
    }

    let whiteListedIps: string[] | undefined;
    if (Array.isArray(project?.whiteListedIps)) {
      whiteListedIps = project.whiteListedIps
        .filter((ip: unknown) => typeof ip === "string")
        .map((ip: string) => ip);
    }

    let autoscalingGroup: Project["autoscalingGroup"] = null;
    if (project?.autoscalingGroup && typeof project.autoscalingGroup === "object") {
      autoscalingGroup = {
        ...project.autoscalingGroup,
        id: project.autoscalingGroup?._id ?? project.autoscalingGroup?.id,
        name: project.autoscalingGroup?.name,
      };
    }

    let dbImage: Project["dbImage"] = null;
    if (project?.dbImage && typeof project.dbImage === "object") {
      dbImage = {
        ...project.dbImage,
        id: project.dbImage?._id ?? project.dbImage?.id,
        name: project.dbImage?.name,
      };
    }

    let authEnabled: boolean | undefined;
    if (typeof project?.authEnabled === "boolean") {
      authEnabled = project.authEnabled;
    }

    let maintenance: boolean | undefined;
    if (typeof project?.maintenance === "boolean") {
      maintenance = project.maintenance;
    }

    let specsRegion: Project["specs"]["region"] = null;
    if (project?.specs?.region && typeof project.specs.region === "object") {
      specsRegion = {
        ...project.specs.region,
        id: project.specs.region?._id ?? project.specs.region?.id,
      };
    }

    let rootDirectory: string | undefined;
    if (typeof project?.rootDirectory === "string") {
      rootDirectory = project.rootDirectory;
    } else if (typeof project?.rootDir === "string") {
      rootDirectory = project.rootDir;
    }

    return {
      id: String(project?.id ?? project?._id ?? project?.name ?? ""),
      name: String(project?.name ?? ""),
      slug: String(project?.slug ?? project?.name ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-"),
      screenshot:
        typeof project?.screenshot === "string" && project.screenshot.trim()
          ? project.screenshot
          : undefined,
      framework: project?.framework,
      createdAt: project?.createdAt,
      updatedAt: project?.updatedAt,
      status: project?.status,
      region,
      serviceType: project?.serviceType ?? project?.service_type,
      authEnabled,
      maintenance,
      passwordEnabled,
      previewUrl,
      gitLink,
      statusCode,
      healthCheckPath:
        typeof project?.healthCheckPath === "string" ? project.healthCheckPath : undefined,
      preStartCommand:
        typeof project?.preStartCommand === "string" ? project.preStartCommand : undefined,
      rootDirectory,
      installCommand:
        typeof project?.installCommand === "string" ? project.installCommand : undefined,
      buildCommand:
        typeof project?.buildCommand === "string" ? project.buildCommand : undefined,
      startCommand:
        typeof project?.startCommand === "string" ? project.startCommand : undefined,
      outputDirectory:
        typeof project?.outputDirectory === "string" ? project.outputDirectory : undefined,
      diskSize: typeof project?.diskSize === "number" ? project.diskSize : undefined,
      volumeMount: typeof project?.volumeMount === "string" ? project.volumeMount : undefined,
      whiteListedIps,
      autoscalingGroup,
      dbImage,
      specs: project?.specs
        ? {
            memory: project.specs?.memory,
            cpu: project.specs?.cpu,
            storage: project.specs?.storage,
            region: specsRegion,
          }
        : undefined,
      domains,
      repo: project?.repo
        ? {
            name: project.repo?.name,
            fullName: project.repo?.full_name ?? project.repo?.fullName,
            branch: project.repo?.branch,
            git: project.repo?.git,
            installationId: project.repo?.installationId,
          }
        : undefined,
      log: project?.log ? { message: project.log?.message } : undefined,
    };
  }

  return {
    async list(input) {
      const response = await client.request<any>(listEndpoint, {
        method: "GET",
        query: {
          q: input?.q,
          sort: input?.sort ?? "updatedAt",
          teamId: input?.teamId,
          page: input?.page,
          limit: input?.limit,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const rawProjects = Array.isArray(root?.projects)
        ? root.projects
        : Array.isArray(root)
          ? root
          : [];

      let total = rawProjects.length;
      if (typeof root?.total === "number") {
        total = root.total;
      } else if (typeof root?.count === "number") {
        total = root.count;
      } else if (typeof root?.overallTotalProjects === "number") {
        total = root.overallTotalProjects;
      }

      let currentPage = 1;
      if (typeof root?.currentPage === "number") {
        currentPage = root.currentPage;
      } else if (typeof input?.page === "number" && input.page > 0) {
        currentPage = input.page;
      }

      let totalPages = 1;
      if (typeof root?.totalPages === "number") {
        totalPages = root.totalPages;
      } else {
        const pageSize = typeof root?.limit === "number" ? root.limit : input?.limit;
        if (typeof pageSize === "number" && pageSize > 0) {
          totalPages = Math.max(1, Math.ceil(total / pageSize));
        }
      }

      return {
        items: rawProjects.map((project: any) => mapProject(project)),
        total,
        currentPage,
        totalPages,
        pageSize:
          typeof root?.limit === "number"
            ? root.limit
            : typeof input?.limit === "number"
              ? input.limit
              : undefined,
        overallTotalProjects:
          typeof root?.overallTotalProjects === "number"
            ? root.overallTotalProjects
            : undefined,
      } satisfies PaginatedProjectsResponse;
    },
    async getById(projectId, input) {
      const response = await client.request<any>(`${listEndpoint}/${encodeURIComponent(projectId)}`, {
        method: "GET",
        query: {
          teamId: input?.teamId,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      return mapProject(root);
    },
    async getScreenshot(projectId) {
      const response = await client.request<any>(
        `${listEndpoint}/${encodeURIComponent(projectId)}/screenshot`,
        {
          method: "GET",
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? null;

      if (typeof root === "string" && root.trim()) {
        return root;
      }

      if (typeof root?.screenshot === "string" && root.screenshot.trim()) {
        return root.screenshot;
      }

      if (typeof root?.url === "string" && root.url.trim()) {
        return root.url;
      }

      return null;
    },
    async redeploy(projectId, input) {
      const response = await client.request<any>(
        `${listEndpoint}/${encodeURIComponent(projectId)}/redeploy`,
        {
          method: "POST",
          query: {
            teamId: input?.teamId,
          },
          body: {
            ...(input?.payload || {}),
            logId: input?.logId,
            startOnly: input?.startOnly,
          },
        },
      );

      const root = response?.data?.data ?? response?.data ?? response ?? {};

      return {
        id:
          typeof root?.id === "string"
            ? root.id
            : typeof root?._id === "string"
              ? root._id
              : undefined,
        message: typeof root?.message === "string" ? root.message : undefined,
      };
    },
    create: () => notImplemented<Project>("projects", "create"),
    update: () => notImplemented<Project>("projects", "update"),
    remove: () => notImplemented<void>("projects", "remove"),
  };
}
