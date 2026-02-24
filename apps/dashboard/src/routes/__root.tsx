import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { DashboardLayout } from "../components/layout/dashboard-layout";
import { enforceRouteAuth } from "../lib/auth-guards";
import { getSettingsSidebarSnapshotServerFn } from "@/server/settings/actions";
import type { SettingsSidebarSnapshot } from "@/backend/settings";
import { listWorkspacesServerFn } from "@/server/workspaces/actions";
import type { ApiListResponse } from "@/backend";
import type { Workspace } from "@/backend/workspaces";
import { listHomeProjectsServerFn } from "@/server/projects/actions";
import type { Project } from "@/backend/projects";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  staleTime: 60_000,
  preloadStaleTime: 60_000,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Brimble Dashboard" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  beforeLoad: async ({ location }) => {
    await enforceRouteAuth(location.pathname, location.searchStr);
  },
  loader: async ({ location }) => {
    const isAuthRoute = /^\/(login|signup)$/.test(location.pathname);
    const knownPrefixes = /^\/(login|signup|projects|domains|addons|scaling|workspace)?(\/|$)/;
    const isCatchAll = location.pathname !== "/" && !knownPrefixes.test(location.pathname);

    if (isAuthRoute || isCatchAll) {
      return {
        settingsSnapshot: null as SettingsSidebarSnapshot | null,
        workspaces: { items: [] } as ApiListResponse<Workspace>,
        projectSwitcherProjects: null as ApiListResponse<Project> | null,
      };
    }

    try {
      const searchParams = new URLSearchParams(location.searchStr || "");
      const rawWorkspace = searchParams.get("workspace");
      let workspace: string | undefined;
      if (rawWorkspace && rawWorkspace.trim()) {
        workspace = rawWorkspace.trim();
      }

      const isProjectDetailsRoute =
        /^\/projects\/[^/]+(?:\/|$)/.test(location.pathname) &&
        !/^\/projects\/new(?:\/|$)/.test(location.pathname);

      const [settingsSnapshot, workspaces, projectSwitcherProjects] = await Promise.all([
        (getSettingsSidebarSnapshotServerFn as unknown as () => Promise<SettingsSidebarSnapshot>)(),
        (listWorkspacesServerFn as unknown as () => Promise<ApiListResponse<Workspace>>)(),
        isProjectDetailsRoute
          ? (listHomeProjectsServerFn as unknown as (input: {
              data: { workspace?: string };
            }) => Promise<ApiListResponse<Project>>)({
              data: { workspace },
            })
          : Promise.resolve(null as ApiListResponse<Project> | null),
      ]);

      return {
        settingsSnapshot,
        workspaces,
        projectSwitcherProjects,
      };
    } catch {
      return {
        settingsSnapshot: null as SettingsSidebarSnapshot | null,
        workspaces: { items: [] } as ApiListResponse<Workspace>,
        projectSwitcherProjects: null as ApiListResponse<Project> | null,
      };
    }
  },
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');var dark=t==='dark'||((!t)&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(dark){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { settingsSnapshot, workspaces, projectSwitcherProjects } = Route.useLoaderData();

  return (
    <DashboardLayout
      initialSettingsSnapshot={settingsSnapshot}
      initialWorkspaces={workspaces}
      initialProjectSwitcherProjects={projectSwitcherProjects}
    >
      <Outlet />
    </DashboardLayout>
  );
}
