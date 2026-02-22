import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { TooltipProvider } from "../shared/tooltip";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isProjectDetail = /^\/projects\/[^/]+/.test(pathname);

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-dash-bg">
        <Topbar />
        {isProjectDetail ? (
          <main className="mx-auto w-full max-w-screen-xl flex-1">
            {children}
          </main>
        ) : (
          <div className="mx-auto flex w-full max-w-screen-xl flex-1">
            <Sidebar />
            <main className="flex-1 pl-10 py-8">
              {children}
            </main>
          </div>
        )}
        <Footer />
      </div>
    </TooltipProvider>
  );
}
