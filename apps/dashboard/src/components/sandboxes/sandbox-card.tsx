import { motion } from "motion/react";
import { StatusChip } from "@/components/shared/status-chip";
import type { Sandbox } from "@/lib/sandboxes/mock-data";

const cardMetaIconClass = "size-3.5 shrink-0 opacity-60 invert dark:invert-0";

interface SandboxCardProps {
  sandbox: Sandbox;
  onOpen: () => void;
}

function templateIcon(template: string): string | null {
  const t = template.toLowerCase();
  if (t.includes("python")) return "/icons/python.svg";
  if (t.includes("node")) return "/icons/nodejs.svg";
  if (t.includes("ubuntu")) return "/icons/ubuntu.svg";
  if (t.includes("bun")) return "/icons/bun.svg";
  return null;
}

export function SandboxCard({ sandbox, onOpen }: SandboxCardProps) {
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left">
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex min-h-[168px] cursor-pointer flex-col overflow-clip rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 px-3.5 pt-3 pb-2 text-sm tracking-[-0.02px]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {(() => {
                const icon = templateIcon(sandbox.template);
                if (icon) {
                  return <img src={icon} alt="" className="size-5 shrink-0 object-contain" />;
                }
                return (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-dash-bg-elevated text-[10px] font-semibold uppercase text-dash-text-faded">
                    {sandbox.name.charAt(0)}
                  </span>
                );
              })()}
              <span className="min-w-0 shrink truncate font-medium leading-5 text-dash-text-strong">{sandbox.name}</span>
            </div>
            <StatusChip status={sandbox.status} className="shrink-0 origin-top-right scale-[0.92]" />
          </div>
          <span className="line-clamp-1 font-light leading-[22px] text-dash-text-faded">
            {sandbox.description ?? sandbox.template}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3 px-3.5 pb-2 text-xs text-dash-text-faded">
          <span className="inline-flex items-center gap-1.5">
            <img src="/icons/cpu.svg" alt="" className={cardMetaIconClass} />
            {sandbox.cpu} vCPU
          </span>
          <span className="inline-flex items-center gap-1.5">
            <img src="/icons/memory.svg" alt="" className={cardMetaIconClass} />
            {sandbox.memoryGb} GB
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <img src="/icons/region.svg" alt="" className={cardMetaIconClass} />
            <span className="truncate">{sandbox.region}</span>
          </span>
        </div>

        <div className="flex h-10 shrink-0 items-center justify-between border-t-[0.5px] border-dash-border px-3.5">
          <span className="font-mono text-xs uppercase leading-[18px] tracking-[-0.02px] text-dash-text-extra-faded opacity-80">
            {sandbox.lastActiveAt}
          </span>
          <span className="text-xs text-dash-text-extra-faded">{sandbox.template}</span>
        </div>
      </motion.div>
    </button>
  );
}
