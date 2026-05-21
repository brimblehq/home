import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";

export const Route = createFileRoute("/sandboxes")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  component: SandboxesLayout,
});

function SandboxesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isListRoot = pathname === "/sandboxes" || pathname === "/sandboxes/";
  const showHeader = isListRoot;

  if (!showHeader) {
    return <Outlet />;
  }

  return (
    <div className="max-w-[1000px]">
      <PageHeader title="Sandboxes" image="/images/leaves.svg">
        Spin up isolated AI sandboxes and manage their persistent storage. Configure resources, attach volumes, and interact with them in real time.
      </PageHeader>
      <Outlet />
    </div>
  );
}
