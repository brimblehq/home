import type { ApiClient } from "./types";

export interface RepositoryMetadata {
  name?: string;
  fullName?: string;
  installationId?: number | string;
  branches: string[];
}

export interface RepositoryFrameworkDefaults {
  slug?: string;
  name?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
  logo?: string;
}

export interface RepositoryDirectoryEntry {
  name: string;
  type: "dir" | "file";
  path: string;
  sha?: string;
  framework?: RepositoryFrameworkDefaults;
}

export interface RepositoryRootDirResult {
  rootDir: RepositoryDirectoryEntry[];
  framework?: RepositoryFrameworkDefaults;
}

export interface RepositoriesApi {
  getGithubRepo(input: {
    repoName: string;
    installationId?: number | string;
  }): Promise<RepositoryMetadata>;
  getGithubRootDir(input: {
    repoName: string;
    branch: string;
    installationId?: number | string;
    path?: string;
  }): Promise<RepositoryRootDirResult>;
}

export function createRepositoriesApi(client: ApiClient): RepositoriesApi {
  return {
    async getGithubRepo(input) {
      const response = await client.request<any>("/core/v1/repos/github/repo", {
        method: "GET",
        query: {
          repoName: input.repoName,
          installationId: input.installationId,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const rawBranches = Array.isArray(root?.branches) ? root.branches : [];

      const branches = rawBranches
        .map((branch: unknown) => {
          if (typeof branch === "string") {
            return branch;
          }

          if (branch && typeof branch === "object") {
            const branchName = (branch as { name?: unknown }).name;
            if (typeof branchName === "string") {
              return branchName;
            }
          }

          return "";
        })
        .filter(Boolean);

      return {
        name: typeof root?.name === "string" ? root.name : undefined,
        fullName:
          typeof root?.full_name === "string"
            ? root.full_name
            : typeof root?.fullName === "string"
              ? root.fullName
              : undefined,
        installationId:
          typeof root?.installationId === "number" ||
          typeof root?.installationId === "string"
            ? root.installationId
            : typeof input.installationId === "number" ||
                typeof input.installationId === "string"
              ? input.installationId
              : undefined,
        branches,
      };
    },
    async getGithubRootDir(input) {
      const response = await client.request<any>("/core/v1/repos/github/rootDir", {
        method: "GET",
        query: {
          repoName: input.repoName,
          installationId: input.installationId,
          branch: input.branch,
          path: input.path,
        },
      });

      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const rawDirs = Array.isArray(root?.rootDir) ? root.rootDir : [];

      const mappedDirs: RepositoryDirectoryEntry[] = rawDirs
        .map((entry: any) => {
          let type: "dir" | "file" = "file";
          if (entry?.type === "dir") {
            type = "dir";
          }

          let framework: RepositoryFrameworkDefaults | undefined;
          if (entry?.framework && typeof entry.framework === "object") {
            framework = {
              slug: entry.framework?.slug,
              name: entry.framework?.name,
              installCommand: entry.framework?.installCommand,
              buildCommand: entry.framework?.buildCommand,
              startCommand: entry.framework?.startCommand,
              outputDirectory: entry.framework?.outputDirectory,
              logo: entry.framework?.logo,
            };
          }

          return {
            name: typeof entry?.name === "string" ? entry.name : "",
            type,
            path: typeof entry?.path === "string" ? entry.path : "",
            sha: typeof entry?.sha === "string" ? entry.sha : undefined,
            framework,
          } satisfies RepositoryDirectoryEntry;
        })
        .filter((entry) => entry.name && entry.path);

      let framework: RepositoryFrameworkDefaults | undefined;
      if (root?.framework && typeof root.framework === "object") {
        framework = {
          slug: root.framework?.slug,
          name: root.framework?.name,
          installCommand: root.framework?.installCommand,
          buildCommand: root.framework?.buildCommand,
          startCommand: root.framework?.startCommand,
          outputDirectory: root.framework?.outputDirectory,
          logo: root.framework?.logo,
        };
      }

      return {
        rootDir: mappedDirs,
        framework,
      };
    },
  };
}
