import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sandboxes")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  component: SandboxesLayout,
});

function SandboxesLayout() {
  return <Outlet />;
}
