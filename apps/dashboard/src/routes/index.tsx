import { createFileRoute } from "@tanstack/react-router";
import { WelcomeSection } from "../components/overview/welcome-section";
import { StatsRow } from "../components/overview/stats-row";
import { DeployedProjects } from "../components/overview/deployed-projects";
import { ConnectedDomains } from "../components/overview/connected-domains";
import { FeaturedIntegrations } from "../components/overview/featured-integrations";
import { listHomeProjectsServerFn } from "@/server/projects/actions";
import { getHomeOverviewServerFn } from "@/server/overview/actions";
import type { ApiListResponse } from "@/backend";
import type { Project as BackendProject } from "@/backend/projects";
import type { OverviewSummary } from "@/backend/overview";
import type { Project as ProjectCardProject } from "../components/shared/project-card";
import { formatRelativeTime } from "@/utils/dashboard";

export const Route = createFileRoute("/")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.searchStr || "");
    const workspace = params.get("workspace") || undefined;

    const [projectsResult, overviewResult] = await Promise.all([
      (listHomeProjectsServerFn as unknown as (input: {
        data: { workspace?: string };
      }) => Promise<ApiListResponse<BackendProject>>)({
        data: { workspace },
      }),
      (getHomeOverviewServerFn as unknown as (input: {
        data: { workspace?: string };
      }) => Promise<OverviewSummary>)({
        data: { workspace },
      }),
    ]);

    return {
      projects: projectsResult.items,
      overview: overviewResult,
    };
  },
  component: DashboardHome,
});

function DashboardHome() {
  const { projects, overview } = Route.useLoaderData();

  const deployedProjects: ProjectCardProject[] = projects.slice(0, 3).map((project) => ({
    name: project.name,
    commitMessage: project.log?.message || "No recent activity",
    branch: project.repo?.branch || "main",
    updatedAt: formatRelativeTime(project.updatedAt),
  }));

  return (
    <div className="max-w-[1000px]">
      <WelcomeSection />
      <StatsRow />
      <hr className="-mx-4 mb-10 border-dash-border-soft md:-ml-10 md:mr-0" />
      <DeployedProjects projects={deployedProjects} />
      <hr className="-mx-4 mb-10 border-dash-border-soft md:-ml-10 md:mr-0" />
      <ConnectedDomains activeDomains={overview?.total?.domain ?? 0} />
      <hr className="-mx-4 mb-10 border-dash-border-soft md:-ml-10 md:mr-0" />
      <FeaturedIntegrations />
    </div>
  );
}
