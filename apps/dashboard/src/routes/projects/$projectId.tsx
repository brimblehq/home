import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ProjectSubnav } from "../../components/project/project-subnav";
import { getProjectDetailsServerFn, listHomeProjectsServerFn } from "@/server/projects/actions";
import type { Project as BackendProject } from "@/backend/projects";
import type { ApiListResponse } from "@/backend";

const PROJECT_CACHE_MS = 60_000;
const projectCache = new Map<string, { project: BackendProject; timestamp: number }>();

async function fetchProjectCached(projectId: string, workspace?: string) {
  const key = `${projectId}:${workspace ?? ""}`;
  const cached = projectCache.get(key);

  if (cached && Date.now() - cached.timestamp < PROJECT_CACHE_MS) {
    return cached.project;
  }

  const project = await (getProjectDetailsServerFn as unknown as (input: {
    data: { projectId: string; workspace?: string };
  }) => Promise<BackendProject>)({
    data: { projectId, workspace },
  });

  projectCache.set(key, { project, timestamp: Date.now() });
  return project;
}

export function invalidateProjectCache(projectId?: string) {
  if (projectId) {
    for (const key of projectCache.keys()) {
      if (key.startsWith(`${projectId}:`)) {
        projectCache.delete(key);
      }
    }
  } else {
    projectCache.clear();
  }
}

export const Route = createFileRoute("/projects/$projectId")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  beforeLoad: async ({ params, location }) => {
    const searchParams = new URLSearchParams(location.searchStr || "");
    const workspace = searchParams.get("workspace") || undefined;
    const [project, projectSwitcherProjects] = await Promise.all([
      fetchProjectCached(params.projectId, workspace),
      (listHomeProjectsServerFn as unknown as (input: {
        data: { workspace?: string };
      }) => Promise<ApiListResponse<BackendProject>>)({
        data: { workspace },
      }),
    ]);

    return { project, workspace, projectSwitcherProjects };
  },
  loader: ({ context }) => {
    return {
      project: (context as any).project,
      workspace: (context as any).workspace,
      projectSwitcherProjects: (context as any).projectSwitcherProjects,
    };
  },
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isDomainSettings = new RegExp(
    `^/projects/[^/]+/domains/[^/]+`,
  ).test(pathname);

  return (
    <div>
      {!isDomainSettings && <ProjectSubnav projectId={projectId} />}
      <Outlet />
    </div>
  );
}
