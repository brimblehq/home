import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId/domains")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  component: ProjectDomainsLayout,
});

function ProjectDomainsLayout() {
  return <Outlet />;
}
