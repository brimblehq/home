import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { tokenizeCode } from "@/lib/syntax-highlight";
import type { SandboxResponse } from "@/backend/sandboxes";

export const Route = createFileRoute("/sandboxes/$sandboxId/")({
  staleTime: 60_000,
  preloadStaleTime: 60_000,
  component: SandboxOverviewPanel,
});

const detailIconClass = "size-3.5 shrink-0 opacity-60 invert dark:invert-0";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(date);
}

const parentRouteApi = getRouteApi("/sandboxes/$sandboxId");

function SandboxOverviewPanel() {
  const { sandbox } = parentRouteApi.useLoaderData() as { sandbox: SandboxResponse };
  const cpu = sandbox.specs?.cpu ?? 0;
  const memory = sandbox.specs?.memory ?? 0;
  const disk = sandbox.specs?.disk ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <GettingStartedSection sandbox={sandbox} />

      <section className="flex flex-col gap-3">
        <SectionHeader title="Resources" description="Compute and storage allocated to this sandbox." />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ResourceTile icon={<img src="/icons/cpu.svg" alt="" className={detailIconClass} />} label="CPU" value={`${cpu} MHz`} />
          <ResourceTile icon={<img src="/icons/memory.svg" alt="" className={detailIconClass} />} label="Memory" value={`${memory} MB`} />
          <ResourceTile icon={<img src="/icons/disk.svg" alt="" className={detailIconClass} />} label="Disk" value={`${disk} GB`} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Details" description="Configuration and lifecycle metadata for this sandbox." />
        <dl className="grid grid-cols-1 rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg text-sm sm:grid-cols-2">
          <div className="flex flex-col px-4 sm:border-r-[0.5px] sm:border-dash-border-soft">
            <DetailRow
              icon={<img src="/icons/region.svg" alt="" className={detailIconClass} />}
              label="Region"
              value={
                sandbox.regionName
                  ? sandbox.regionCountry
                    ? `${sandbox.regionName} (${sandbox.regionCountry})`
                    : sandbox.regionName
                  : sandbox.region
              }
            />
            <DetailRow
              icon={<img src="/icons/template.svg" alt="" className={detailIconClass} />}
              label="Template"
              value={sandbox.template}
            />
            <DetailRow
              icon={<img src="/icons/clock.svg" alt="" className={detailIconClass} />}
              label="Created"
              value={formatDate(sandbox.createdAt)}
            />
            <DetailRow
              icon={<img src="/icons/status.svg" alt="" className={detailIconClass} />}
              label="Last activity"
              value={formatDate(sandbox.lastActivityAt)}
            />
            <DetailRow label="Persistent" value={sandbox.persistent ? "Enabled" : "Disabled"} />
          </div>
          <div className="flex flex-col px-4">
            <DetailRow label="Persistent disk" value={sandbox.persistentDiskGB ? `${sandbox.persistentDiskGB} GB` : "—"} />
            <DetailRow label="Auto destroy" value={sandbox.autoDestroy ? `Yes (${sandbox.destroyTimeout ?? "—"})` : "No"} />
            <DetailRow label="Snapshot mode" value={sandbox.snapshotMode} />
            <DetailRow label="Snapshot frequency" value={sandbox.snapshotFrequency ?? "—"} />
            <DetailRow label="Expires" value={formatDate(sandbox.expiresAt)} />
          </div>
        </dl>
      </section>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-sm font-medium leading-5 tracking-[-0.022px] text-dash-text-strong">{title}</h2>
      {description ? <p className="text-xs leading-[1.4] text-dash-text-faded">{description}</p> : null}
    </div>
  );
}

function ResourceTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

function DetailRow({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
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

function buildStarterSnippet(sandbox: SandboxResponse): string {
  const template = sandbox.template || "python-3.12";
  const region = sandbox.regionName || sandbox.region || "eu-west";

  return [
    `import { Sandbox } from "@brimble/sandbox";`,
    ``,
    `const sandbox = await Sandbox.create({`,
    `  template: "${template}",`,
    `  region: "${region}",`,
    `});`,
    ``,
    `const result = await sandbox.exec("echo 'Hello, world!'");`,
    `console.log(result.stdout);`,
  ].join("\n");
}

function GettingStartedSection({ sandbox }: { sandbox: SandboxResponse }) {
  const snippet = buildStarterSnippet(sandbox);
  const installCommand = "npm install @brimble/sandbox";
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);

  async function copy(value: string, kind: "snippet" | "install") {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "snippet") {
        setCopiedSnippet(true);
        window.setTimeout(() => setCopiedSnippet(false), 1500);
      } else {
        setCopiedInstall(true);
        window.setTimeout(() => setCopiedInstall(false), 1500);
      }
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Getting started" description="Run code in this sandbox from your app using the @brimble/sandbox SDK." />

      <div className="flex items-center justify-between gap-2 rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg-elevated px-3 py-2">
        <code className="truncate font-mono text-[12px] text-dash-text-body">{installCommand}</code>
        <button
          type="button"
          onClick={() => void copy(installCommand, "install")}
          className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[11px] font-medium text-dash-text-faded transition-colors hover:text-dash-text-strong"
        >
          {copiedInstall ? (
            <>
              <Check className="size-3 text-[#22c55e]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <pre className="overflow-x-auto rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg-elevated p-4 pr-14 font-mono text-[12px] leading-[1.7] text-dash-text-body">
          <code>
            {tokenizeCode(snippet).map((tok, i) => (
              <Fragment key={i}>{tok.cls ? <span className={tok.cls}>{tok.text}</span> : tok.text}</Fragment>
            ))}
          </code>
        </pre>
        <button
          type="button"
          onClick={() => void copy(snippet, "snippet")}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-[3px] border-[0.5px] border-dash-border bg-dash-bg px-2 py-1 text-[11px] font-medium text-dash-text-faded transition-colors hover:text-dash-text-strong"
        >
          {copiedSnippet ? (
            <>
              <Check className="size-3 text-[#22c55e]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <a
        href="https://paper.brimble.io/sandboxes/overview"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start text-xs font-medium text-[#4879f8] transition-colors hover:text-[#3a6ae6]"
      >
        Read the full sandbox SDK guide
        <ArrowUpRight className="size-3" />
      </a>
    </section>
  );
}
