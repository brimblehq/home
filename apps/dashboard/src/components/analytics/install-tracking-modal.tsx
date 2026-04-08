import { Fragment, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal, ModalHeader } from "@/components/shared/modal";
import { SegmentedToggle } from "@/components/observability/segmented-toggle";
import { hapticToast as toast } from "@/utils/haptic-toast";
import { useHaptics } from "@/hooks/use-haptics";

type Framework = "HTML" | "Next.js" | "React" | "Vue";

const HIGHLIGHT_RE = new RegExp(
  [
    "(?<comment>//[^\\n]*|/\\*[\\s\\S]*?\\*/|<!--[\\s\\S]*?-->)",
    "(?<string>\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)",
    "(?<tag></?[A-Za-z][\\w-]*|/?>)",
    "(?<attr>[A-Za-z][\\w-]*(?==))",
    "(?<keyword>\\b(?:import|from|export|default|function|const|let|var|return|if|else|for|while|new|null|true|false|undefined|typeof|async|await|class|extends|this|super|try|catch|finally|throw|setup|onMounted)\\b)",
    "(?<number>\\b\\d+\\b)",
    "(?<ident>[A-Za-z_$][\\w$]*)",
  ].join("|"),
  "g",
);

const TOKEN_CLASS: Record<string, string> = {
  comment: "italic text-dash-text-extra-faded",
  string: "text-[#0e7c66] dark:text-[#5eead4]",
  tag: "text-[#b4366b] dark:text-[#f9a8d4]",
  attr: "text-[#9a5b00] dark:text-[#fcd34d]",
  keyword: "text-[#7c3aed] dark:text-[#c4b5fd]",
  number: "text-[#9a5b00] dark:text-[#fcd34d]",
  ident: "",
};

function formatSnippet(code: string): string {
  return code.replace(/<\/script>\s*<script/g, "</script>\n\n<script");
}

function highlight(code: string) {
  const out: { text: string; cls: string }[] = [];
  let last = 0;
  for (const m of code.matchAll(HIGHLIGHT_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: code.slice(last, start), cls: "" });
    const type = Object.keys(m.groups ?? {}).find((k) => m.groups?.[k] != null) ?? "";
    out.push({ text: m[0], cls: TOKEN_CLASS[type] ?? "" });
    last = start + m[0].length;
  }
  if (last < code.length) out.push({ text: code.slice(last), cls: "" });
  return out;
}

const SCRIPT_SRC = "https://cdn.brimble.io/analytics.js";

function buildSnippet(framework: Framework, siteId: string): string {
  switch (framework) {
    case "HTML":
      return `<script async defer\n  src="${SCRIPT_SRC}"\n  data-site-id="${siteId}"></script>`;
    case "Next.js":
      return `import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${SCRIPT_SRC}"
          data-site-id="${siteId}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`;
    case "React":
      return `import { useEffect } from "react";

export function BrimbleAnalytics() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "${SCRIPT_SRC}";
    s.async = true;
    s.defer = true;
    s.dataset.siteId = "${siteId}";
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);
  return null;
}`;
    case "Vue":
      return `<script setup>
import { onMounted } from "vue";

onMounted(() => {
  const s = document.createElement("script");
  s.src = "${SCRIPT_SRC}";
  s.async = true;
  s.defer = true;
  s.dataset.siteId = "${siteId}";
  document.head.appendChild(s);
});
</script>`;
  }
}

const INSTRUCTIONS: Record<Framework, string> = {
  HTML: "Paste this into the <head> of your index.html.",
  "Next.js": "Drop this into app/layout.tsx (App Router) or pages/_app.tsx.",
  React: "Mount <BrimbleAnalytics /> once at the root of your app.",
  Vue: "Place this in your top-level App.vue or layout component.",
};

export function InstallTrackingModal({
  open,
  onOpenChange,
  siteId,
  serverSnippet,
  onEnable,
  enabling,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  /** When provided, this exact snippet (from the analytics API) is shown verbatim
   *  instead of the framework template generator. */
  serverSnippet?: string;
  /** When provided AND no serverSnippet, render an "Enable analytics" CTA. */
  onEnable?: () => void | Promise<void>;
  enabling?: boolean;
}) {
  const haptics = useHaptics();
  const [framework, setFramework] = useState<Framework>("HTML");
  const [copied, setCopied] = useState(false);
  const [siteIdCopied, setSiteIdCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setFramework("HTML");
      setCopied(false);
      setSiteIdCopied(false);
    }
  }, [open]);

  const snippet = serverSnippet ?? buildSnippet(framework, siteId);
  const showFrameworkTabs = !serverSnippet;

  async function handleCopySnippet() {
    try {
      await navigator.clipboard.writeText(formatSnippet(snippet));
      haptics.success();
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      haptics.error();
      toast.error("Could not copy to clipboard");
    }
  }

  async function handleCopySiteId() {
    try {
      await navigator.clipboard.writeText(siteId);
      haptics.light();
      setSiteIdCopied(true);
      window.setTimeout(() => setSiteIdCopied(false), 1500);
    } catch {
      haptics.error();
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} width={560}>
      <ModalHeader
        title="Install tracking"
        description="Drop this snippet into your site to start collecting analytics."
      />
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-[1px] text-dash-text-faded">
            Site ID
          </span>
          <div className="flex items-center gap-2 rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg-elevated px-3 py-2">
            <code className="flex-1 truncate font-mono text-xs text-dash-text-body">
              {siteId}
            </code>
            <button
              type="button"
              onClick={handleCopySiteId}
              className="shrink-0 text-dash-text-faded transition-colors hover:text-dash-text-strong"
              aria-label="Copy site ID"
            >
              {siteIdCopied ? (
                <Check className="size-3.5 text-[#22c55e]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {showFrameworkTabs && (
          <SegmentedToggle
            options={["HTML", "Next.js", "React", "Vue"]}
            value={framework}
            onChange={(v) => {
              haptics.selection();
              setFramework(v as Framework);
            }}
          />
        )}

        <div className="relative">
          <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap break-words rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg-elevated p-4 pr-14 font-mono text-[11px] leading-[1.7] text-dash-text-body">
            <code>
              {highlight(formatSnippet(snippet)).map((tok, i) => (
                <Fragment key={i}>
                  {tok.cls ? <span className={tok.cls}>{tok.text}</span> : tok.text}
                </Fragment>
              ))}
            </code>
          </pre>
          <button
            type="button"
            onClick={handleCopySnippet}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-[3px] border-[0.5px] border-dash-border bg-dash-bg px-2 py-1 text-[11px] font-medium text-dash-text-faded transition-colors hover:text-dash-text-strong"
          >
            {copied ? (
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

        <p className="text-xs font-light text-dash-text-faded">
          {serverSnippet
            ? "Paste this into your <head> tag. Performance metrics need a real page reload to populate."
            : INSTRUCTIONS[framework]}
        </p>

        {!serverSnippet && onEnable && (
          <button
            type="button"
            disabled={enabling}
            onClick={() => void onEnable()}
            className="flex h-10 items-center justify-center rounded-[4px] border border-[#232931] bg-gradient-to-b from-[#545459] via-[#45454b] to-[#2d2d32] px-4 text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {enabling ? "Enabling..." : "Enable analytics for this project"}
          </button>
        )}
      </div>
    </Modal>
  );
}
