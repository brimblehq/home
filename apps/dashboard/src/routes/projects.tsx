import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return <Outlet />;
}
