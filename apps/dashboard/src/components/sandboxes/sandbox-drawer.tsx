import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { motion } from "motion/react";
import { Check, Copy, X } from "lucide-react";
import { Play, Pause } from "@phosphor-icons/react";

const detailIconClass = "size-4 shrink-0 opacity-60 invert dark:invert-0";
import { StatusChip } from "@/components/shared/status-chip";
import { DashButton } from "@/components/shared/dash-button";
import { dashInputClassName } from "@/components/shared/dash-input";
import { RangeSlider } from "@/components/shared/range-slider";
import { DiskSizeSelect } from "@/components/shared/disk-size-select";
import { useHaptics } from "@/hooks/use-haptics";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { SandboxTerminal } from "./sandbox-terminal";
import { SandboxFileTree } from "./sandbox-file-tree";
import type { Sandbox } from "@/lib/sandboxes/mock-data";

type TabId = "overview" | "terminal" | "files" | "configuration";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "terminal", label: "Terminal" },
  { id: "files", label: "Files" },
  { id: "configuration", label: "Configuration" },
];

interface SandboxDrawerProps {
  sandbox: Sandbox | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MIN_DRAWER_WIDTH = 360;

export function SandboxDrawer({ sandbox, open, onOpenChange }: SandboxDrawerProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [width, setWidth] = useState<number | null>(null);
  const haptics = useHaptics();

  useEffect(() => {
    if (open) setTab("overview");
  }, [open, sandbox?.id]);

  useEffect(() => {
    function compute() {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 640) {
        setWidth(null);
        return;
      }
      setWidth((current) => {
        const max = Math.floor(window.innerWidth * 0.5);
        if (current == null) return Math.min(640, max);
        return Math.max(MIN_DRAWER_WIDTH, Math.min(max, current));
      });
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
    if (width == null) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const onMove = (e: PointerEvent) => {
      const max = Math.floor(window.innerWidth * 0.5);
      const delta = startX - e.clientX;
      const next = Math.max(MIN_DRAWER_WIDTH, Math.min(max, startWidth + delta));
      setWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }

  if (!sandbox) return null;

  const isRunning = sandbox.status === "ACTIVE";
  const isBuilding = sandbox.status === "BUILDING";

  function handleStartStop() {
    haptics.medium();
    toast(`${isRunning ? "Stop" : "Start"} command queued (mock)`);
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right" handleOnly>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full outline-none"
          style={width != null ? { width: `${width}px` } : undefined}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative flex h-full w-full flex-col overflow-hidden bg-dash-bg shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.18)] dark:shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.6)]"
          >
            {width != null ? (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sandbox panel"
                onPointerDown={handleResizeStart}
                className="group absolute inset-y-0 left-0 z-20 flex w-2 cursor-grab items-center justify-center active:cursor-grabbing"
              >
                <div className="h-10 w-[3px] rounded-full bg-dash-border opacity-60 transition-opacity group-hover:opacity-100 group-active:opacity-100" />
              </div>
            ) : null}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b-[0.5px] border-dash-border px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Drawer.Title className="truncate text-base font-medium text-dash-text-strong">{sandbox.name}</Drawer.Title>
                  <StatusChip status={sandbox.status} className="origin-left scale-[0.92]" />
                </div>
                <Drawer.Description className="mt-1 truncate text-xs font-light text-dash-text-faded">
                  {sandbox.template} · {sandbox.region}
                </Drawer.Description>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartStop}
                  disabled={isBuilding}
                  aria-label={isRunning ? "Pause sandbox" : "Start sandbox"}
                  className="flex size-8 items-center justify-center rounded-[4px] text-dash-text-faded transition-colors hover:bg-dash-bg-elevated hover:text-dash-text-strong disabled:pointer-events-none disabled:opacity-40"
                >
                  {isRunning ? <Pause weight="fill" className="size-4" /> : <Play weight="fill" className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    onOpenChange(false);
                  }}
                  aria-label="Close"
                  className="flex size-8 items-center justify-center rounded-[4px] text-dash-text-faded transition-colors hover:bg-dash-bg-elevated hover:text-dash-text-strong"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="shrink-0 overflow-x-auto overflow-y-hidden border-b-[0.5px] border-dash-border-soft px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-1">
                {TABS.map((entry) => {
                  const active = tab === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        haptics.selection();
                        setTab(entry.id);
                      }}
                      className={`relative px-3 py-3 text-sm transition-colors ${
                        active ? "text-dash-text-strong" : "text-dash-text-faded hover:text-dash-text-body"
                      }`}
                    >
                      {entry.label}
                      {active ? (
                        <motion.span
                          layoutId="sandbox-tab-underline"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="absolute inset-x-2 -bottom-px h-[2px] bg-[#4879f8]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
              {tab === "overview" ? <OverviewPanel sandbox={sandbox} /> : null}
              {tab === "terminal" ? <SandboxTerminal /> : null}
              {tab === "files" ? <SandboxFileTree /> : null}
              {tab === "configuration" ? <ConfigurationPanel sandbox={sandbox} /> : null}
            </div>
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function OverviewPanel({ sandbox }: { sandbox: Sandbox }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.04em] text-dash-text-extra-faded">Public URL</h3>
        <CopyableValue value={sandbox.publicUrl} link />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.04em] text-dash-text-extra-faded">Internal URL</h3>
        <CopyableValue value={sandbox.internalUrl} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-medium uppercase tracking-[0.04em] text-dash-text-extra-faded">Resources</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ResourceTile icon={<img src="/icons/cpu.svg" alt="" className={detailIconClass} />} label="CPU" value={`${sandbox.cpu} vCPU`} />
          <ResourceTile icon={<img src="/icons/memory.svg" alt="" className={detailIconClass} />} label="Memory" value={`${sandbox.memoryGb} GB`} />
          <ResourceTile icon={<img src="/icons/disk.svg" alt="" className={detailIconClass} />} label="Disk" value={`${sandbox.diskGb} GB`} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-[0.04em] text-dash-text-extra-faded">Details</h3>
        <dl className="flex flex-col text-sm">
          <DetailRow icon={<img src="/icons/region.svg" alt="" className={detailIconClass} />} label="Region" value={sandbox.region} />
          <DetailRow icon={<img src="/icons/template.svg" alt="" className={detailIconClass} />} label="Template" value={sandbox.template} />
          <DetailRow icon={<img src="/icons/clock.svg" alt="" className={detailIconClass} />} label="Created" value={sandbox.createdAt} />
          <DetailRow icon={<img src="/icons/status.svg" alt="" className={detailIconClass} />} label="Last active" value={sandbox.lastActiveAt} />
          <DetailRow
            icon={<img src="/icons/stop.svg" alt="" className={detailIconClass} />}
            label="Auto-stop"
            value={sandbox.autoStop ? `After ${sandbox.idleTimeoutMins} min idle` : "Disabled"}
          />
        </dl>
      </section>

      {sandbox.envVars.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-[0.04em] text-dash-text-extra-faded">Environment</h3>
          <div className="flex flex-col rounded-[4px] bg-dash-bg-elevated">
            {sandbox.envVars.map((entry, i) => (
              <div
                key={entry.key}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-xs ${
                  i === 0 ? "" : "border-t-[0.5px] border-dash-border-soft"
                }`}
              >
                <span className="font-mono text-dash-text-body">{entry.key}</span>
                <span className="truncate font-mono text-dash-text-faded">{entry.value}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ResourceTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[4px] bg-dash-bg-elevated px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-dash-text-faded">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-dash-text-strong">{value}</span>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-[0.5px] border-dash-border-soft py-3 last:border-b-0">
      <span className="flex items-center gap-2 text-dash-text-faded">
        {icon}
        {label}
      </span>
      <span className="truncate text-dash-text-body">{value}</span>
    </div>
  );
}

function CopyableValue({ value, link = false }: { value: string; link?: boolean }) {
  const [copied, setCopied] = useState(false);
  const haptics = useHaptics();

  return (
    <div className="flex items-center gap-2 rounded-[4px] bg-dash-bg-elevated px-3 py-2">
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate font-mono text-xs text-[#4879f8] hover:underline dark:text-[#f5a623]"
        >
          {value}
        </a>
      ) : (
        <span className="flex-1 truncate font-mono text-xs text-dash-text-body">{value}</span>
      )}
      <button
        type="button"
        onClick={() => {
          haptics.light();
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex size-7 shrink-0 items-center justify-center rounded-[3px] text-dash-text-faded transition-colors hover:bg-dash-bg hover:text-dash-text-strong"
        aria-label={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

function ConfigurationPanel({ sandbox }: { sandbox: Sandbox }) {
  const [editing, setEditing] = useState(false);
  const [cpu, setCpu] = useState(sandbox.cpu);
  const [memoryGb, setMemoryGb] = useState(sandbox.memoryGb);
  const [diskSize, setDiskSize] = useState(String(sandbox.diskGb));
  const haptics = useHaptics();

  useEffect(() => {
    setCpu(sandbox.cpu);
    setMemoryGb(sandbox.memoryGb);
    setDiskSize(String(sandbox.diskGb));
  }, [sandbox.id]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm text-dash-text-faded">
          {editing ? "Editing configuration · changes not persisted in this preview." : "Read-only view of the current configuration."}
        </p>
        <DashButton
          variant={editing ? "primary" : "outline"}
          size="sm"
          onClick={() => {
            haptics.selection();
            setEditing((prev) => !prev);
          }}
        >
          {editing ? "Save" : "Edit"}
        </DashButton>
      </div>

      <ReadOnlyField label="Name" value={sandbox.name} disabled={!editing} />
      <ReadOnlyField label="Description" value={sandbox.description ?? "—"} disabled={!editing} />
      <ReadOnlyField label="Template" value={sandbox.template} disabled={!editing} />
      <ReadOnlyField label="Region" value={sandbox.region} disabled={!editing} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm text-dash-text-body">CPU</label>
          <span className="text-sm font-medium text-dash-text-strong">{cpu} vCPU</span>
        </div>
        <RangeSlider value={cpu} onChange={setCpu} min={0.25} max={8} step={0.25} disabled={!editing} hideValue />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm text-dash-text-body">Memory</label>
          <span className="text-sm font-medium text-dash-text-strong">{memoryGb} GB</span>
        </div>
        <RangeSlider value={memoryGb} onChange={setMemoryGb} min={0.5} max={16} step={0.5} disabled={!editing} hideValue />
      </div>

      <DiskSizeSelect label="Disk" value={diskSize} onChange={setDiskSize} />

      <ReadOnlyField
        label="Auto-stop"
        value={sandbox.autoStop ? `After ${sandbox.idleTimeoutMins} min idle` : "Disabled"}
        disabled={!editing}
      />
    </div>
  );
}

function ReadOnlyField({ label, value, disabled }: { label: string; value: string; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-dash-text-faded">{label}</span>
      <input
        readOnly
        value={value}
        disabled={disabled}
        className={`${dashInputClassName} disabled:bg-dash-bg-elevated disabled:text-dash-text-body`}
      />
    </div>
  );
}
