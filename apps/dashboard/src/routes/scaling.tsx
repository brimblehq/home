import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/scaling")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  component: ScalingLayout,
});

function ScalingLayout() {
  return <Outlet />;
}
