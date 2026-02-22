import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId/domains")({
  component: ProjectDomainsLayout,
});

function ProjectDomainsLayout() {
  return <Outlet />;
}
