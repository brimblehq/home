import { createAuthApi, type AuthApi } from "./auth";
import { createBackendClient, type BackendClient, type BackendClientConfig } from "./client";
import { createDeploymentsApi, type DeploymentsApi } from "./deployments";
import { createDomainsApi, type DomainsApi } from "./domains";
import { createFrameworksApi, type FrameworksApi } from "./frameworks";
import { createLogsApi, type LogsApi } from "./logs";
import { createObservabilityApi, type ObservabilityApi } from "./observability";
import { createOverviewApi, type OverviewApi } from "./overview";
import { createProjectsApi, type ProjectsApi } from "./projects";
import { createRepositoriesApi, type RepositoriesApi } from "./repositories";
import { createSettingsApi, type SettingsApi } from "./settings";
import { createWorkspacesApi, type WorkspacesApi } from "./workspaces";

export * from "./auth";
export * from "./client";
export * from "./deployments";
export * from "./domains";
export * from "./errors";
export * from "./frameworks";
export * from "./logs";
export * from "./observability";
export * from "./overview";
export * from "./projects";
export * from "./repositories";
export * from "./settings";
export * from "./types";
export * from "./workspaces";

export interface BackendApi {
  client: BackendClient;
  auth: AuthApi;
  projects: ProjectsApi;
  repositories: RepositoriesApi;
  domains: DomainsApi;
  frameworks: FrameworksApi;
  observability: ObservabilityApi;
  logs: LogsApi;
  overview: OverviewApi;
  deployments: DeploymentsApi;
  workspaces: WorkspacesApi;
  settings: SettingsApi;
}

export function createBackendApi(config: BackendClientConfig): BackendApi {
  const client = createBackendClient(config);

  return {
    client,
    auth: createAuthApi(client),
    projects: createProjectsApi(client),
    repositories: createRepositoriesApi(client),
    domains: createDomainsApi(client),
    frameworks: createFrameworksApi(client),
    observability: createObservabilityApi(client),
    logs: createLogsApi(client),
    overview: createOverviewApi(client),
    deployments: createDeploymentsApi(client),
    workspaces: createWorkspacesApi(client),
    settings: createSettingsApi(client),
  };
}
