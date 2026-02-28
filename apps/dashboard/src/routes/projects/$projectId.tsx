import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ProjectSubnav } from "../../components/project/project-subnav";
import { DeploymentLogsDrawer } from "../../components/shared/deployment-logs-drawer";
import { getProjectDetailsServerFn, listHomeProjectsServerFn } from "@/server/projects/actions";
import { listDeploymentRunLogsServerFn } from "@/server/deployments/actions";
import type { Project as BackendProject } from "@/backend/projects";
import type { ApiListResponse } from "@/backend";
import type { DeploymentLog } from "@/backend/deployments";
import type { DeploymentDrawerLogEntry } from "@/utils/deployment-logs";
import {
  ProjectDeploymentLogsDrawerContext,
  type ProjectDeploymentLogsDrawerContextValue,
} from "@/contexts/project-deployment-logs-drawer-context";
import { getSupabaseClient } from "@/lib/supabase";
import { mapDeploymentRunLogsToDrawerEntries } from "@/utils/deployment-logs";
import config from "@/config";

const PROJECT_CACHE_MS = 60_000;
const projectCache = new Map<string, { project: BackendProject; timestamp: number }>();

async function fetchProjectCached(projectId: string, workspace?: string) {
  const key = `${projectId}:${workspace ?? ""}`;
  const cached = projectCache.get(key);

  if (cached && Date.now() - cached.timestamp < PROJECT_CACHE_MS) {
    return cached.project;
  }

  const project = await (getProjectDetailsServerFn as unknown as (input: {
    data: { projectId: string; workspace?: string };
  }) => Promise<BackendProject>)({
    data: { projectId, workspace },
  });

  projectCache.set(key, { project, timestamp: Date.now() });
  return project;
}

export function invalidateProjectCache(projectId?: string) {
  if (projectId) {
    for (const key of projectCache.keys()) {
      if (key.startsWith(`${projectId}:`)) {
        projectCache.delete(key);
      }
    }
  } else {
    projectCache.clear();
  }
}

export const Route = createFileRoute("/projects/$projectId")({
  staleTime: 300_000,
  preloadStaleTime: 300_000,
  beforeLoad: async ({ params, location }) => {
    const searchParams = new URLSearchParams(location.searchStr || "");
    const workspace = searchParams.get("workspace") || undefined;
    const [project, projectSwitcherProjects] = await Promise.all([
      fetchProjectCached(params.projectId, workspace),
      (listHomeProjectsServerFn as unknown as (input: {
        data: { workspace?: string };
      }) => Promise<ApiListResponse<BackendProject>>)({
        data: { workspace },
      }),
    ]);

    return { project, workspace, projectSwitcherProjects };
  },
  loader: ({ context }) => {
    return {
      project: (context as any).project,
      workspace: (context as any).workspace,
      projectSwitcherProjects: (context as any).projectSwitcherProjects,
    };
  },
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const { project, workspace } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const getDeploymentRunLogs = useServerFn(
    listDeploymentRunLogsServerFn as any,
  ) as (args: {
    data: {
      logId: string;
      workspace?: string;
    };
  }) => Promise<{ entries: DeploymentDrawerLogEntry[] }>;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] =
    useState<DeploymentLog | null>(null);
  const [drawerLogsByDeploymentId, setDrawerLogsByDeploymentId] = useState<
    Record<string, DeploymentDrawerLogEntry[]>
  >({});
  const [drawerLogsLoading, setDrawerLogsLoading] = useState(false);
  const [drawerLogsError, setDrawerLogsError] = useState<string | null>(null);

  const isDomainSettings = new RegExp(
    `^/projects/[^/]+/domains/[^/]+`,
  ).test(pathname);

  const selectedDeploymentLogs = selectedDeployment
    ? drawerLogsByDeploymentId[selectedDeployment.id] ?? []
    : [];

  let drawerStatus: "Successful" | "Failed" | "Pending" = "Pending";
  const selectedStatus = selectedDeployment?.status?.toLowerCase();
  if (selectedStatus === "active" || selectedStatus === "ready") {
    drawerStatus = "Successful";
  } else if (selectedStatus === "failed") {
    drawerStatus = "Failed";
  }

  const fetchLogsForDeployment = useCallback(
    async (deployment: DeploymentLog) => {
      if (!deployment.id) {
        setDrawerLogsError("Missing deployment log ID.");
        setDrawerLogsLoading(false);
        return;
      }

      const cached = drawerLogsByDeploymentId[deployment.id];
      if (cached) {
        setDrawerLogsError(null);
        setDrawerLogsLoading(false);
        return;
      }

      setDrawerLogsLoading(true);
      setDrawerLogsError(null);

      try {
        const result = await getDeploymentRunLogs({
          data: {
            logId: deployment.id,
            workspace,
          },
        });

        setDrawerLogsByDeploymentId((prev) => ({
          ...prev,
          [deployment.id]: Array.isArray(result?.entries) ? result.entries : [],
        }));
      } catch (error) {
        let message = "Failed to load deployment logs.";
        if (error instanceof Error && error.message.trim()) {
          message = error.message;
        }
        setDrawerLogsError(message);
      } finally {
        setDrawerLogsLoading(false);
      }
    },
    [drawerLogsByDeploymentId, getDeploymentRunLogs, workspace],
  );

  useEffect(() => {
    if (!drawerOpen || !selectedDeployment) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const logId = selectedDeployment.id;
    const channel = supabase
      .channel(`deployment-logs-${logId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: config.supabaseTableName,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.logId !== logId) return;

          const [entry] = mapDeploymentRunLogsToDrawerEntries([row]);
          if (!entry) return;

          setDrawerLogsByDeploymentId((prev) => ({
            ...prev,
            [logId]: [...(prev[logId] ?? []), entry],
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [drawerOpen, selectedDeployment]);

  const openDeploymentDrawer = useCallback(
    (deployment: DeploymentLog) => {
      setSelectedDeployment(deployment);
      setDrawerOpen(true);
      void fetchLogsForDeployment(deployment);
    },
    [fetchLogsForDeployment],
  );

  const closeDeploymentDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const drawerContextValue = useMemo<ProjectDeploymentLogsDrawerContextValue>(
    () => ({
      drawerOpen,
      selectedDeployment,
      openDeploymentDrawer,
      closeDeploymentDrawer,
    }),
    [closeDeploymentDrawer, drawerOpen, openDeploymentDrawer, selectedDeployment],
  );

  return (
    <ProjectDeploymentLogsDrawerContext.Provider value={drawerContextValue}>
      <div>
        {!isDomainSettings && <ProjectSubnav projectId={projectId} />}
        <Outlet />
        {selectedDeployment ? (
          <DeploymentLogsDrawer
            open={drawerOpen}
            onOpenChange={(open) => {
              if (!open) {
                closeDeploymentDrawer();
              }
            }}
            environment={selectedDeployment.environment || "Production"}
            status={drawerStatus}
            logs={selectedDeploymentLogs}
            loading={drawerLogsLoading}
            emptyMessage={drawerLogsError || "No logs available for this deployment yet."}
          />
        ) : null}
      </div>
    </ProjectDeploymentLogsDrawerContext.Provider>
  );
}
