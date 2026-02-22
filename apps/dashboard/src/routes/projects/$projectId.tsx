import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ProjectSubnav } from "../../components/project/project-subnav";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide project subnav when viewing individual domain settings
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
