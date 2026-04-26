import { Link, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useHaptics } from "@/hooks/use-haptics";
import { withWorkspaceQuery } from "@/utils/topbar-navigation";

interface CreateSandboxCardProps {
  className?: string;
}

export function CreateSandboxCard({ className }: CreateSandboxCardProps) {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const haptics = useHaptics();

  return (
    <div
      className={`flex h-full min-h-[120px] items-center justify-center overflow-clip rounded-[4px] border-[0.5px] border-dash-border ${className ?? ""}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(217,218,221,0.35) 10px, rgba(217,218,221,0.35) 11px)",
      }}
    >
      <Link
        to={withWorkspaceQuery({ pathname: "/sandboxes/new", searchStr }) as any}
        onClick={() => haptics.light()}
        className="flex items-center gap-2 rounded-lg border border-dash-border bg-dash-bg px-4 py-2 text-sm font-medium text-dash-text-body shadow-sm transition-colors hover:bg-dash-bg-elevated"
      >
        <Plus className="size-4" />
        Create new sandbox
      </Link>
    </div>
  );
}
