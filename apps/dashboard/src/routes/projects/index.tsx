import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../../components/shared/page-header";
import { ProjectCard } from "../../components/shared/project-card";
import type { Project } from "../../components/shared/project-card";
import { CreateProjectCard } from "../../components/shared/create-project-card";
import { NumberPagination } from "../../components/shared/pagination";
import { listProjectsPageServerFn } from "@/server/projects/actions";
import type { Project as BackendProject, PaginatedProjectsResponse } from "@/backend/projects";
import { formatRelativeTime } from "@/utils/dashboard";

export const Route = createFileRoute("/projects/")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  validateSearch: (search: Record<string, unknown>) => {
    const next: { page?: number; workspace?: string } = {};

    const rawPage = search.page;
    if (typeof rawPage === "number" && Number.isFinite(rawPage) && rawPage > 0) {
      next.page = Math.floor(rawPage);
    } else if (typeof rawPage === "string") {
      const parsed = Number(rawPage);
      if (Number.isFinite(parsed) && parsed > 0) {
        next.page = Math.floor(parsed);
      }
    }

    const rawWorkspace = search.workspace;
    if (typeof rawWorkspace === "string" && rawWorkspace.trim()) {
      next.workspace = rawWorkspace.trim();
    }

    return next;
  },
  loaderDeps: ({ search }) => {
    let page = 1;
    if (typeof search.page === "number" && Number.isFinite(search.page) && search.page > 0) {
      page = Math.floor(search.page);
    }

    let workspace: string | undefined;
    if (typeof search.workspace === "string" && search.workspace.trim()) {
      workspace = search.workspace.trim();
    }

    return { page, workspace };
  },
  loader: async ({ deps }) => {
    const page = deps.page;
    const workspace = deps.workspace;

    const result = await (listProjectsPageServerFn as unknown as (input: {
      data: { page?: number; workspace?: string };
    }) => Promise<PaginatedProjectsResponse>)({
      data: { page, workspace },
    });

    const projects = result.items.map((project: BackendProject): Project => ({
      name: project.name,
      slug: project.slug || project.name,
      commitMessage: project.log?.message || "No recent activity",
      branch: project.repo?.branch || "main",
      updatedAt: formatRelativeTime(project.updatedAt),
    }));

    return {
      projects,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        total: result.total,
        overallTotalProjects: result.overallTotalProjects,
      },
    };
  },
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate({ from: "/projects/" });
  const search = Route.useSearch();
  const { projects, pagination } = Route.useLoaderData();

  function handlePageChange(page: number) {
    if (page < 1 || page === pagination.currentPage || page > pagination.totalPages) {
      return;
    }

    navigate({
      to: "/projects/",
      search: {
        ...(search || {}),
        page: page === 1 ? undefined : page,
      },
    });
  }

  return (
    <div className="max-w-[1000px]">
      <PageHeader title="Projects" image="/images/bee.svg">
        Manage your deployed projects from one place. Track recent updates, jump
        into configurations, and spin up new deployments quickly.
      </PageHeader>

      <hr className="border-dash-border-soft mb-8 -mx-4 md:-mx-10" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CreateProjectCard className="col-span-full" />
        {projects.map((project, i) => (
          <ProjectCard key={`${project.name}-${i}`} project={project} />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <NumberPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
