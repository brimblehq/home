import { useState, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Eye, EyeOff, Lock } from "lucide-react";
import { TabHeader } from "../../../components/shared/tab-header";

export const Route = createFileRoute("/projects/$projectId/environment")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  component: EnvironmentPage,
});

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M13.5 4C13.5 4.82843 11.0376 5.5 8 5.5C4.96243 5.5 2.5 4.82843 2.5 4M13.5 4C13.5 3.17157 11.0376 2.5 8 2.5C4.96243 2.5 2.5 3.17157 2.5 4M13.5 4L12 13C12 13 11.5 14 8 14C4.5 14 4 13 4 13L2.5 4M9.25 8.25L6.75 10.75M6.75 8.25L9.25 10.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface EnvVar {
  id: number;
  key: string;
  value: string;
}

type RawFormat = "env" | "json";

const mockEnvVars: EnvVar[] = [
  { id: 1, key: "DATABASE_URL", value: "postgres://user:pass@db.brimble.io:5432/myapp" },
  { id: 2, key: "API_KEY", value: "sk_live_4eC39HqLyjWDarjtT1zdp7dc" },
  { id: 3, key: "NEXT_PUBLIC_APP_URL", value: "https://kemdirimdesign.brimble.app" },
  { id: 4, key: "REDIS_URL", value: "redis://default:abc123@redis.brimble.io:6379" },
  { id: 5, key: "JWT_SECRET", value: "a3f8b2c1d4e5f6071829304a5b6c7d8e" },
  { id: 6, key: "STRIPE_SECRET_KEY", value: "sk_test_51NzQjKLkjsd82jsdKJsd" },
  { id: 7, key: "SENTRY_DSN", value: "https://examplePublicKey@o0.ingest.sentry.io/0" },
];

let nextId = 8;

function varsToEnv(vars: EnvVar[]): string {
  return vars
    .map((v) => (v.key ? `${v.key}=${v.value}` : ""))
    .filter(Boolean)
    .join("\n");
}

function envToVars(raw: string): EnvVar[] {
  const lines = raw.split("\n");
  let id = 1;
  const result: EnvVar[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      result.push({ id: id++, key: trimmed, value: "" });
    } else {
      result.push({
        id: id++,
        key: trimmed.slice(0, eqIndex),
        value: trimmed.slice(eqIndex + 1),
      });
    }
  }
  return result;
}

function varsToJson(vars: EnvVar[]): string {
  const obj: Record<string, string> = {};
  for (const v of vars) {
    if (v.key) obj[v.key] = v.value;
  }
  return JSON.stringify(obj, null, 2);
}

function jsonToVars(json: string): EnvVar[] {
  try {
    const obj = JSON.parse(json);
    let id = 1;
    return Object.entries(obj).map(([key, value]) => ({
      id: id++,
      key,
      value: String(value),
    }));
  } catch {
    return [];
  }
}

/* ─── Syntax highlighting ─── */

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightEnv(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("#")) {
        return `<span class="text-dash-text-extra-faded">${escapeHtml(line)}</span>`;
      }
      const eq = line.indexOf("=");
      if (eq === -1) {
        return `<span class="text-[#c4651a]">${escapeHtml(line)}</span>`;
      }
      const key = escapeHtml(line.slice(0, eq));
      const val = escapeHtml(line.slice(eq + 1));
      return `<span class="text-[#c4651a]">${key}</span><span class="text-dash-text-extra-faded">=</span><span class="text-dash-text-strong">${val}</span>`;
    })
    .join("\n");
}

function highlightJson(text: string): string {
  // Tokenize JSON for coloring: keys, string values, numbers, booleans, punctuation
  return text.replace(
    /("(?:[^"\\]|\\.)*")\s*(:)|("(?:[^"\\]|\\.)*")|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]:,])/g,
    (_match, key, colon, str, bool, num, punct) => {
      if (key && colon) {
        return `<span class="text-[#c4651a]">${escapeHtml(key)}</span><span class="text-dash-text-extra-faded">${escapeHtml(colon)}</span>`;
      }
      if (str) return `<span class="text-dash-text-strong">${escapeHtml(str)}</span>`;
      if (bool) return `<span class="text-[#c4651a]">${escapeHtml(bool)}</span>`;
      if (num) return `<span class="text-[#c4651a]">${escapeHtml(num)}</span>`;
      if (punct) return `<span class="text-dash-text-extra-faded">${escapeHtml(punct)}</span>`;
      return escapeHtml(_match);
    }
  );
}

function HighlightedEditor({
  value,
  onChange,
  placeholder,
  format,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  format: RawFormat;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const highlighted = value
    ? format === "json"
      ? highlightJson(value)
      : highlightEnv(value)
    : "";

  return (
    <div className="relative h-[240px] w-full rounded-[4px] border-[0.5px] border-[#d0d5dd] bg-dash-bg">
      {/* Highlighted underlay */}
      <pre
        ref={preRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words px-3.5 py-3 font-mono text-sm leading-6 scrollbar-hidden"
        dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
      />
      {/* Transparent textarea on top */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="relative h-full w-full resize-none bg-transparent px-3.5 py-3 font-mono text-sm leading-6 text-transparent caret-dash-text-strong outline-none placeholder:text-dash-text-extra-faded scrollbar-hidden"
      />
    </div>
  );
}

function EnvironmentPage() {
  const [search, setSearch] = useState("");
  const [rawMode, setRawMode] = useState(false);
  const [rawFormat, setRawFormat] = useState<RawFormat>("env");
  const [rawText, setRawText] = useState("");
  const [vars, setVars] = useState<EnvVar[]>(mockEnvVars);
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());

  function addVar() {
    setVars((prev) => [...prev, { id: nextId++, key: "", value: "" }]);
  }

  function updateVar(id: number, field: "key" | "value", val: string) {
    setVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  }

  function removeVar(id: number) {
    setVars((prev) => prev.filter((v) => v.id !== id));
    setVisibleValues((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleVisibility(id: number) {
    setVisibleValues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function enterRawMode() {
    const text =
      rawFormat === "json" ? varsToJson(vars) : varsToEnv(vars);
    setRawText(text);
    setRawMode(true);
  }

  function exitRawMode() {
    const parsed =
      rawFormat === "json" ? jsonToVars(rawText) : envToVars(rawText);
    if (parsed.length > 0) {
      nextId = Math.max(...parsed.map((v) => v.id)) + 1;
      setVars(parsed);
    }
    setRawMode(false);
  }

  function switchRawFormat(format: RawFormat) {
    // Convert current raw text to vars, then re-serialize in new format
    const parsed =
      rawFormat === "json" ? jsonToVars(rawText) : envToVars(rawText);
    setRawFormat(format);
    if (parsed.length > 0) {
      setRawText(
        format === "json" ? varsToJson(parsed) : varsToEnv(parsed)
      );
    } else {
      setRawText(format === "json" ? "{\n  \n}" : "");
    }
  }

  const filtered = search
    ? vars.filter(
        (v) =>
          v.key.toLowerCase().includes(search.toLowerCase()) ||
          v.value.toLowerCase().includes(search.toLowerCase())
      )
    : vars;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4 py-8">
      <TabHeader title="Environment Variables">
        Set environment-specific config and secrets (such as API keys), then
        read those values from your code.{" "}
        <a href="#" className="text-[#4879f8] underline">
          Learn more
        </a>
      </TabHeader>

      <hr className="border-dash-border" />

      {/* Main card */}
      <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border">
        {/* Toolbar */}
        <div className="flex items-center gap-3.5 border-b-[0.5px] border-dash-border px-3.5 py-3.5">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2">
            <Search className="size-5 shrink-0 text-dash-text-extra-faded" />
            <input
              type="text"
              placeholder="Search EVNs created"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-dash-text-strong outline-none placeholder:text-dash-text-extra-faded"
            />
          </div>

          {/* Divider */}
          <div className="h-full w-px self-stretch border-r-[0.5px] border-dash-border" />

          {/* Raw Editor button */}
          <button
            onClick={rawMode ? exitRawMode : enterRawMode}
            className={`flex h-[34px] items-center gap-2 rounded-[4px] border px-3.5 text-sm font-medium transition-colors ${
              rawMode
                ? "border-[#3964d5] bg-[#4879f8]/10 text-[#4879f8]"
                : "border-[#e9ebec] text-dash-text-strong hover:bg-dash-bg-elevated"
            }`}
          >
            Raw Editor
          </button>

          {/* Add Variable button */}
          {!rawMode && (
            <button
              onClick={addVar}
              className="flex h-[34px] items-center gap-1 rounded-[4px] border border-[#3964d5] bg-[#4879f8] px-3 text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)]"
            >
              <Plus className="size-4" />
              <span className="px-1">Add Variable</span>
            </button>
          )}
        </div>

        {/* Content */}
        {rawMode ? (
          <div className="px-3.5 pb-6 pt-5">
            {/* Format tabs */}
            <div className="mb-3 flex items-center gap-1 rounded-[4px] border-[0.5px] border-dash-border p-0.5 self-start w-fit">
              <button
                onClick={() => switchRawFormat("env")}
                className={`rounded-[3px] px-3 py-1 text-xs font-medium transition-colors ${
                  rawFormat === "env"
                    ? "bg-dash-bg-elevated text-dash-text-strong"
                    : "text-dash-text-faded hover:text-dash-text-body"
                }`}
              >
                .env
              </button>
              <button
                onClick={() => switchRawFormat("json")}
                className={`rounded-[3px] px-3 py-1 text-xs font-medium transition-colors ${
                  rawFormat === "json"
                    ? "bg-dash-bg-elevated text-dash-text-strong"
                    : "text-dash-text-faded hover:text-dash-text-body"
                }`}
              >
                JSON
              </button>
            </div>

            <HighlightedEditor
              value={rawText}
              onChange={setRawText}
              format={rawFormat}
              placeholder={
                rawFormat === "json"
                  ? '{\n  "API_KEY": "your_key_here",\n  "DATABASE_URL": "postgres://..."\n}'
                  : "API_KEY=your_key_here\nDATABASE_URL=postgres://..."
              }
            />
            <p className="mt-2 text-xs text-dash-text-faded">
              {rawFormat === "json"
                ? "Paste or edit a JSON object with string key-value pairs."
                : "One variable per line in KEY=VALUE format. Lines starting with # are ignored."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-3.5 pb-6 pt-5">
            {vars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Lock className="mb-3 size-8 text-dash-text-extra-faded opacity-40" />
                <h3 className="mb-1 text-sm font-medium text-dash-text-strong">
                  No environment variables
                </h3>
                <p className="mb-4 max-w-[300px] text-center text-sm text-dash-text-faded">
                  Add environment variables to securely store API keys, database
                  URLs, and other secrets for your project.
                </p>
                <button
                  onClick={addVar}
                  className="flex items-center gap-1 rounded-[4px] border border-[#3964d5] bg-[#4879f8] px-3 py-1.5 text-sm font-medium text-white shadow-[0px_1px_2px_rgba(18,18,23,0.05)]"
                >
                  <Plus className="size-4" />
                  Add your first variable
                </button>
              </div>
            ) : filtered.length === 0 && search ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-dash-text-faded">
                  No variables matching "<span className="font-medium text-dash-text-strong">{search}</span>"
                </p>
              </div>
            ) : null}
            {filtered.map((envVar) => (
              <div key={envVar.id} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                {/* Key */}
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-sm leading-5 tracking-[-0.02px] text-dash-text-strong">
                    Key
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. API_KEY"
                    value={envVar.key}
                    onChange={(e) =>
                      updateVar(envVar.id, "key", e.target.value)
                    }
                    className="h-[34px] w-full rounded-[4px] border-[0.5px] border-[#d0d5dd] bg-dash-bg px-3.5 text-sm text-dash-text-strong outline-none placeholder:text-dash-text-extra-faded"
                  />
                </div>

                {/* Value (password) */}
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-sm leading-5 tracking-[-0.02px] text-dash-text-strong">
                    Value
                  </label>
                  <div className="flex h-[34px] items-center rounded-[4px] border-[0.5px] border-[#d0d5dd] bg-dash-bg px-3.5">
                    <input
                      type={visibleValues.has(envVar.id) ? "text" : "password"}
                      placeholder="Enter value"
                      value={envVar.value}
                      onChange={(e) =>
                        updateVar(envVar.id, "value", e.target.value)
                      }
                      className="w-full bg-transparent text-sm text-dash-text-strong outline-none placeholder:text-dash-text-extra-faded"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility(envVar.id)}
                      className="shrink-0 text-dash-text-faded transition-colors hover:text-dash-text-strong"
                    >
                      {visibleValues.has(envVar.id) ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeVar(envVar.id)}
                  disabled={vars.length <= 1}
                  className="flex h-[34px] items-center justify-center px-1 text-dash-text-strong transition-colors hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
