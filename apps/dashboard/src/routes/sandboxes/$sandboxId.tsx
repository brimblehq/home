import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { StatusChip } from "@/components/shared/status-chip";
import { SandboxSubnav } from "@/components/sandboxes/sandbox-subnav";
import { getSandboxScopedAblyOptions } from "@/lib/ably-auth";
import { snapshotEventBus } from "@/lib/sandboxes/snapshot-event-bus";
import { getSandboxServerFn } from "@/server/sandboxes/actions";
import { withWorkspaceQuery } from "@/utils/topbar-navigation";
import { workspaceLoaderDeps } from "@/utils/workspace-route-search";
import { SandboxStatus } from "@/backend/sandboxes";
import type { SandboxResponse } from "@/backend/sandboxes";

export const Route = createFileRoute("/sandboxes/$sandboxId")({
  staleTime: 60_000,
  preloadStaleTime: 60_000,
  loaderDeps: ({ search }) => workspaceLoaderDeps(search),
  loader: async ({ params, deps }) => {
    const workspace = deps.workspace;

    try {
      const sandbox = await (
        getSandboxServerFn as unknown as (input: {
          data: { sandboxId: string; workspace?: string };
        }) => Promise<SandboxResponse>
      )({
        data: { sandboxId: params.sandboxId, workspace },
      });

      return { sandbox, workspace };
    } catch {
      throw redirect({
        to: "/sandboxes",
        search: workspace ? { workspace } : {},
      });
    }
  },
  component: SandboxDetailLayout,
});

function templateIcon(template: string): string | null {
  const t = template.toLowerCase();
  if (t.includes("python")) return "/icons/python.svg";
  if (t.includes("node")) return "/icons/nodejs.svg";
  if (t.includes("ubuntu")) return "/icons/ubuntu.svg";
  if (t.includes("bun")) return "/icons/bun.svg";
  return null;
}

function SandboxDetailLayout() {
  const { sandbox } = Route.useLoaderData();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const router = useRouter();
  const icon = templateIcon(sandbox.template);

  const [status, setStatus] = useState<SandboxStatus>(sandbox.status);

  useEffect(() => {
    setStatus(sandbox.status);
  }, [sandbox.status]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      const authOptions = await getSandboxScopedAblyOptions(sandbox.id);
      if (!authOptions || cancelled) return;

      const { Realtime } = await import("ably");
      const ably = new Realtime(authOptions);
      const channel = ably.channels.get(`sandbox:${sandbox.id}`);

      const onPaused = () => setStatus(SandboxStatus.Paused);
      const onResumed = () => setStatus(SandboxStatus.Ready);
      const onDestroyed = () => {
        setStatus(SandboxStatus.Destroyed);
        void router.invalidate();
      };
      const onSnapshotCompleted = (message: { data?: unknown }) => {
        const data = (message?.data ?? {}) as { snapshotId?: string; sizeBytes?: number; imageTag?: string };
        if (!data.snapshotId) return;
        snapshotEventBus.dispatch(sandbox.id, {
          type: "completed",
          snapshotId: data.snapshotId,
          sizeBytes: typeof data.sizeBytes === "number" ? data.sizeBytes : null,
          imageTag: typeof data.imageTag === "string" ? data.imageTag : null,
        });
      };
      const onSnapshotFailed = (message: { data?: unknown }) => {
        const data = (message?.data ?? {}) as { snapshotId?: string; reason?: string };
        if (!data.snapshotId) return;
        snapshotEventBus.dispatch(sandbox.id, {
          type: "failed",
          snapshotId: data.snapshotId,
          reason: typeof data.reason === "string" ? data.reason : null,
        });
      };

      void channel.subscribe("sandbox:paused", onPaused);
      void channel.subscribe("sandbox:resumed", onResumed);
      void channel.subscribe("sandbox:destroyed", onDestroyed);
      void channel.subscribe("sandbox:snapshot:completed", onSnapshotCompleted);
      void channel.subscribe("sandbox:snapshot:failed", onSnapshotFailed);

      cleanup = () => {
        try {
          channel.unsubscribe("sandbox:paused", onPaused);
          channel.unsubscribe("sandbox:resumed", onResumed);
          channel.unsubscribe("sandbox:destroyed", onDestroyed);
          channel.unsubscribe("sandbox:snapshot:completed", onSnapshotCompleted);
          channel.unsubscribe("sandbox:snapshot:failed", onSnapshotFailed);
          ably.close();
        } catch {
          // ignore teardown errors
        }
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [sandbox.id, router]);

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-4">
        <Link
          to={withWorkspaceQuery({ pathname: "/sandboxes", searchStr }) as any}
          className="inline-flex items-center gap-1.5 text-xs font-light text-dash-text-faded transition-colors hover:text-dash-text-strong"
        >
          <ArrowLeft className="size-3.5" />
          Sandboxes
        </Link>
      </div>

      <div className="mb-6 flex items-start gap-3">
        {icon ? (
          <img src={icon} alt="" className="size-10 shrink-0 object-contain" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[4px] bg-dash-bg-elevated text-sm font-semibold uppercase text-dash-text-faded">
            {sandbox.name.charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-medium tracking-[-0.03px] text-dash-text-strong">{sandbox.name}</h1>
            <StatusChip status={status} className="origin-left scale-[0.92]" />
          </div>
          <p className="mt-1 truncate text-sm font-light text-dash-text-faded">{sandbox.template}</p>
        </div>
      </div>

      <SandboxSubnav sandbox={sandbox} status={status} onStatusChange={setStatus} />

      <div className="pt-6">
        <Outlet />
      </div>
    </div>
  );
}
