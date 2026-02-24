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
      };
    }

    try {
      const [settingsSnapshot, workspaces] = await Promise.all([
        (getSettingsSidebarSnapshotServerFn as unknown as () => Promise<SettingsSidebarSnapshot>)(),
        (listWorkspacesServerFn as unknown as () => Promise<ApiListResponse<Workspace>>)(),
      ]);

      return {
        settingsSnapshot,
        workspaces,
      };
    } catch {
      return {
        settingsSnapshot: null as SettingsSidebarSnapshot | null,
        workspaces: { items: [] } as ApiListResponse<Workspace>,
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
  const { settingsSnapshot, workspaces } = Route.useLoaderData();

  return (
    <DashboardLayout
      initialSettingsSnapshot={settingsSnapshot}
      initialWorkspaces={workspaces}
    >
      <Outlet />
    </DashboardLayout>
  );
}
