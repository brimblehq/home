import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/addons")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  component: AddonsLayout,
});

function AddonsLayout() {
  return <Outlet />;
}
