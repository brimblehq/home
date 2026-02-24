import { type ReactNode, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { CommandPalette } from "./command-palette";
import { TooltipProvider } from "../shared/tooltip";
import { Snackbar } from "../shared/snackbar";
import { OnboardingChecklist } from "../shared/onboarding-checklist";
import { DashToaster } from "../shared/toaster";
import { UserProfileDrawer } from "../shared/user-profile-drawer";
import { ScoutBarProvider } from "../../contexts/scoutbar-context";
import type { SettingsSidebarSnapshot } from "@/backend/settings";
import type { ApiListResponse } from "@/backend";
import type { Workspace } from "@/backend/workspaces";
import type { Project } from "@/backend/projects";

export function DashboardLayout({
  children,
  initialSettingsSnapshot,
  initialWorkspaces,
  initialProjectSwitcherProjects,
}: {
  children: ReactNode;
  initialSettingsSnapshot?: SettingsSidebarSnapshot | null;
  initialWorkspaces?: ApiListResponse<Workspace>;
  initialProjectSwitcherProjects?: ApiListResponse<Project> | null;
}) {
  const pathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname ?? s.location.pathname,
  });
  const matchedProjectSwitcherProjects = useRouterState({
    select: (s) => {
      const projectMatch = s.matches.find((match) => match.routeId === "/projects/$projectId");
      const loaderData = projectMatch?.loaderData as
        | { projectSwitcherProjects?: ApiListResponse<Project> | null }
        | undefined;

      return loaderData?.projectSwitcherProjects?.items ?? null;
    },
  });
  const navigate = useNavigate();
  const isAuthRoute = /^\/(login|signup)$/.test(pathname);
  const knownPrefixes = /^\/(login|signup|projects|domains|addons|scaling|workspace)?(\/|$)/;
  const isCatchAll = pathname !== "/" && !knownPrefixes.test(pathname);
  const isFullWidth = /^\/projects\/[^/]+/.test(pathname) || /^\/workspace\/new/.test(pathname);

  // Settings drawer — shared between sidebar & topbar
  const [profileOpen, setProfileOpen] = useState(false);

  // Welcome snackbar — shown by default for new users
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  // Demo variants — set to true to preview all three
  const showVariantDemo = true;
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);

  if (isAuthRoute || isCatchAll) {
    return (
      <TooltipProvider>
        <DashToaster />
        {children}
      </TooltipProvider>
    );
  }

  return (
    <ScoutBarProvider>
    <TooltipProvider>
      <DashToaster />
      <CommandPalette />
      <div className="flex h-dvh flex-col bg-dash-bg">
        <Topbar
          onSettingsClick={() => setProfileOpen(true)}
          settingsSnapshot={initialSettingsSnapshot ?? null}
          workspaces={initialWorkspaces?.items ?? []}
          projectSwitcherProjects={
            matchedProjectSwitcherProjects ?? initialProjectSwitcherProjects?.items ?? []
          }
        />
        <AnimatePresence>
          {!welcomeDismissed && (
            <Snackbar
              key="welcome"
              variant="info"
              message="Welcome to Brimble! Get started by creating your first project."
              action={{ label: "Create project", onClick: () => navigate({ to: "/projects/new" }) }}
              onDismiss={() => setWelcomeDismissed(true)}
            />
          )}
          {showVariantDemo && !warningDismissed && (
            <Snackbar
              key="warning-demo"
              variant="warning"
              message="Your payment method expires soon. Update it to avoid service interruption."
              action={{ label: "Update payment method", onClick: () => {} }}
              onDismiss={() => setWarningDismissed(true)}
            />
          )}
          {showVariantDemo && !errorDismissed && (
            <Snackbar
              key="error-demo"
              variant="error"
              message="We're experiencing degraded performance in the US-East region. Our team is investigating."
              action={{ label: "View status", onClick: () => {} }}
              onDismiss={() => setErrorDismissed(true)}
            />
          )}
        </AnimatePresence>
        {isFullWidth ? (
          <main className="scrollbar-hidden flex flex-1 flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-screen-xl flex-1">
              {children}
            </div>
            <Footer />
          </main>
        ) : (
          <div className="mx-auto flex w-full max-w-screen-xl flex-1 overflow-hidden">
            <Sidebar profileOpen={profileOpen} onProfileOpenChange={setProfileOpen} />
            <main className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="flex-1 py-8 pl-10">
                {children}
              </div>
              <Footer />
            </main>
          </div>
        )}
        <OnboardingChecklist />
        <UserProfileDrawer
          open={profileOpen}
          onOpenChange={setProfileOpen}
          initialSnapshot={initialSettingsSnapshot ?? null}
        />
      </div>
    </TooltipProvider>
    </ScoutBarProvider>
  );
}
