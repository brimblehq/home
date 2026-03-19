import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectId/domains")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  component: ProjectDomainsLayout,
});

function ProjectDomainsLayout() {
  return <Outlet />;
}
