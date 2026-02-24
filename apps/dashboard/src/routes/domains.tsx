import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/domains")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  component: DomainsLayout,
});

function DomainsLayout() {
  return <Outlet />;
}
