import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return <Outlet />;
}
