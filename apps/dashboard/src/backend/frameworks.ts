import type { ApiClient } from "./types";

export interface FrameworkOption {
  slug: string;
  name: string;
  logo?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
}

export interface FrameworksApi {
  list(): Promise<FrameworkOption[]>;
}

export function createFrameworksApi(client: ApiClient): FrameworksApi {
  return {
    async list() {
      const response = await client.request<any>("/core/v1/frameworks", {
        method: "GET",
      });

      const root = response?.data?.data ?? response?.data ?? response ?? [];
      const items = Array.isArray(root) ? root : [];

      const frameworks = items
        .map((item: any) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const slug = typeof item.slug === "string" ? item.slug : "";
          const name = typeof item.name === "string" ? item.name : "";

          if (!slug || !name) {
            return null;
          }

          return {
            slug,
            name,
            logo: typeof item.logo === "string" ? item.logo : undefined,
            installCommand:
              typeof item.installCommand === "string"
                ? item.installCommand
                : undefined,
            buildCommand:
              typeof item.buildCommand === "string" ? item.buildCommand : undefined,
            startCommand:
              typeof item.startCommand === "string" ? item.startCommand : undefined,
            outputDirectory:
              typeof item.outputDirectory === "string"
                ? item.outputDirectory
                : undefined,
          } satisfies FrameworkOption;
        })
        .filter((item): item is FrameworkOption => item !== null);

      frameworks.sort((a, b) => a.name.localeCompare(b.name));

      return frameworks;
    },
  };
}
