import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/addons")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  component: AddonsLayout,
});

function AddonsLayout() {
  return <Outlet />;
}
