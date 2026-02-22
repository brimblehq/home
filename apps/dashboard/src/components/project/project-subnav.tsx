import { cn } from "@brimble/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Pin,
  Share2,
  Globe,
  Settings,
  BarChart3,
  FileText,
  Lock,
  Rocket,
  ScrollText,
} from "lucide-react";

const tabs = [
  { label: "Projects details", slug: "", Icon: Globe },
  { label: "Configuration", slug: "configuration", Icon: Settings },
  { label: "Analytics", slug: "analytics", Icon: BarChart3 },
  { label: "Domains", slug: "domains", Icon: FileText },
  { label: "Environment", slug: "environment", Icon: Lock },
  { label: "Deployment history", slug: "deployment-history", Icon: Rocket },
  { label: "Logs", slug: "logs", Icon: ScrollText },
];

export function ProjectSubnav({ projectId }: { projectId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div data-subnav className="flex items-center justify-between border-b-[0.5px] border-dash-border">
      {/* Tabs */}
      <div className="flex items-start">
        {tabs.map((tab) => {
          const tabPath = tab.slug
            ? `/projects/${projectId}/${tab.slug}`
            : `/projects/${projectId}`;
          const isActive = tab.slug
            ? pathname === tabPath || pathname === `${tabPath}/`
            : pathname === `/projects/${projectId}` ||
              pathname === `/projects/${projectId}/`;

          return (
            <Link
              key={tab.label}
              to={tabPath}
              className={cn(
                "flex h-14 items-center gap-2 px-2 text-sm tracking-[-0.09px] transition-colors",
                isActive
                  ? "border-b border-[#3c6ce7] text-dash-text-strong"
                  : "text-dash-text-faded font-light hover:text-dash-text-body"
              )}
            >
              <tab.Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-5 px-3.5">
        <button className="text-sm font-light text-dash-text-body hover:text-dash-text-strong transition-colors">
          Redeploy project
        </button>
        <div className="flex items-center gap-4">
          <button className="text-dash-text-faded hover:text-dash-text-strong transition-colors">
            <Pin className="size-4" />
          </button>
          <button className="text-dash-text-faded hover:text-dash-text-strong transition-colors">
            <Share2 className="size-4" />
          </button>
          <button className="text-dash-text-faded hover:text-dash-text-strong transition-colors">
            <img src="/icons/folder-trash.svg" alt="Delete" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
