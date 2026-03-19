import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/scaling")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  component: ScalingLayout,
});

function ScalingLayout() {
  return <Outlet />;
}
