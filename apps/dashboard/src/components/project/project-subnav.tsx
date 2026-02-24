import { useState } from "react";
import { cn } from "@brimble/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Star, Share2, Check, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "../shared/spinner";
import {
  GlobeSimple,
  GearSix,
  ChartBar,
  FileText,
  LockKey,
  RocketLaunch,
  Scroll,
} from "@phosphor-icons/react";
import { FolderTrashIcon } from "../shared/folder-trash-icon";
import { WarningModal } from "../shared/warning-modal";
import { redeployProjectServerFn } from "@/server/projects/actions";

const tabs = [
  { label: "Projects details", slug: "", Icon: GlobeSimple },
  { label: "Configuration", slug: "configuration", Icon: GearSix },
  { label: "Observability", slug: "observability", Icon: ChartBar },
  { label: "Domains", slug: "domains", Icon: FileText },
  { label: "Environment", slug: "environment", Icon: LockKey },
  { label: "Deployment history", slug: "deployment-history", Icon: RocketLaunch },
  { label: "Logs", slug: "logs", Icon: Scroll },
];

export function ProjectSubnav({ projectId }: { projectId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const redeployProject = useServerFn(redeployProjectServerFn as any) as (args: {
    data: {
      projectId: string;
      workspace?: string;
    };
  }) => Promise<{ id?: string; message?: string }>;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [copied, setCopied] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // TODO: replace with real project name from API
  const projectName = projectId;

  async function handleRedeploy() {
    if (deploying) {
      return;
    }

    const params = new URLSearchParams(searchStr || "");
    const workspace = params.get("workspace") || undefined;

    try {
      setDeploying(true);
      toast.loading("Redeploying project...", { id: "redeploy" });

      await redeployProject({
        data: {
          projectId,
          workspace,
        },
      });

      toast.success("Redeploy started", {
        id: "redeploy",
        description: `${projectName} is being redeployed to production.`,
      });
    } catch (error: any) {
      toast.error("Failed to redeploy project", {
        id: "redeploy",
        description:
          typeof error?.message === "string" ? error.message : "Please try again.",
      });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <>
      <div data-subnav className="flex items-center justify-between border-b-[0.5px] border-dash-border">
        {/* Tabs */}
        <div className="scrollbar-hidden flex min-w-0 flex-1 items-start overflow-x-auto">
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
                key=<span className="hidden md:inline">{tab.label}</span>
                to={tabPath}
                preload={
                  tab.slug === "configuration" || tab.slug === "observability"
                    ? "render"
                    : "intent"
                }
                className={cn(
                  "flex h-14 items-center gap-2 px-2 text-sm tracking-[-0.09px] transition-colors",
                  isActive
                    ? "border-b border-[#3c6ce7] text-dash-text-strong"
                    : "text-dash-text-faded font-light hover:text-dash-text-body"
                )}
              >
                <tab.Icon className={cn("size-4", !isActive && "dark:invert dark:sepia dark:saturate-[3] dark:hue-rotate-[345deg] dark:opacity-80")} weight="fill" />
                <span className="hidden md:inline">{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-5 px-3.5">
          <button
            disabled={deploying}
            onClick={() => {
              void handleRedeploy();
            }}
            className="flex items-center gap-1.5 text-sm font-light text-dash-text-body transition-colors hover:text-dash-text-strong disabled:opacity-50"
          >
            {deploying ? (
              <Spinner size="size-3.5" />
            ) : (
              <Rocket className="size-4 sm:hidden" />
            )}
            <span className="hidden sm:inline">{deploying ? "Redeploying..." : "Redeploy"}</span>
          </button>
          <div className="flex items-center gap-4">
            <button className="text-dash-text-faded hover:text-dash-text-strong transition-colors">
              <Star className="size-4" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-dash-text-faded hover:text-dash-text-strong transition-colors"
            >
              {copied ? <Check className="size-4 text-[#28c840]" /> : <Share2 className="size-4" />}
            </button>
            <button
              onClick={() => {
                setConfirmName("");
                setDeleteOpen(true);
              }}
              className="transition-opacity hover:opacity-70"
            >
              <FolderTrashIcon className="size-4" color="#ef2f1f" />
            </button>
          </div>
        </div>
      </div>

      <WarningModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description={`This action cannot be undone. All deployments, domains, and environment variables associated with this project will be permanently deleted.`}
        confirmLabel="Delete project"
        cancelLabel="Cancel"
        confirmDisabled={confirmName !== projectName}
        onConfirm={() => {
          // TODO: wire to API
          console.log("Delete project:", projectId);
        }}
      >
        <div className="flex flex-col gap-2 text-left">
          <label className="text-sm leading-5 text-dash-text-faded">
            Type <span className="font-medium text-dash-text-strong">{projectName}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={projectName}
            className="input-base input-focus-red w-full px-3 py-2.5 text-sm leading-6 text-dash-text-strong placeholder:text-[#9ca3af]"
          />
        </div>
      </WarningModal>
    </>
  );
}
