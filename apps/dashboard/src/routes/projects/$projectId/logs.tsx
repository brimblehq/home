import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Drawer } from "vaul";
import { motion } from "motion/react";
import { Activity, Forward, Pause, Play, ArrowDown, X, Copy, Check, Search, Calendar, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { TabHeader } from "../../../components/shared/tab-header";
import { FilterDropdown, type FilterOption } from "../../../components/shared/filter-dropdown";
import { DateRangePicker } from "../../../components/shared/date-range-picker";

export const Route = createFileRoute("/projects/$projectId/logs")({
  component: LogsPage,
});

type Tab = "application" | "request";

/* ─────────────────────────────────────────────
   Application Logs (terminal-style)
   ───────────────────────────────────────────── */

interface LogLine {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

const levelColors: Record<LogLine["level"], string> = {
  info: "text-[#28c840]",
  warn: "text-[#ff9b01]",
  error: "text-[#ff5f57]",
  debug: "text-white/35",
};

const levelBadge: Record<LogLine["level"], string> = {
  info: "INFO ",
  warn: "WARN ",
  error: "ERROR",
  debug: "DEBUG",
};

const levelFilterOptions: FilterOption[] = [
  { label: "All Levels", value: "all" },
  { label: "Info", value: "info", dot: "#28c840" },
  { label: "Warn", value: "warn", dot: "#ff9b01" },
  { label: "Error", value: "error", dot: "#ff5f57" },
  { label: "Debug", value: "debug", dot: "rgba(255,255,255,0.35)" },
];

function formatTime(date: Date): string {
  return (
    date.toLocaleTimeString("en-US", { hour12: false }) +
    "." +
    String(date.getMilliseconds()).padStart(3, "0")
  );
}

const appLogTemplates: { level: LogLine["level"]; message: string }[] = [
  { level: "info", message: "Server listening on port 3000" },
  { level: "info", message: "Connected to database cluster (primary)" },
  { level: "debug", message: "Route /api/health matched — handler invoked" },
  { level: "info", message: "Worker process spawned (pid: 4821)" },
  { level: "info", message: "Cache warmed: 1,247 entries loaded (38ms)" },
  { level: "warn", message: "Memory usage at 78% — consider scaling" },
  { level: "debug", message: "GC pause: 12ms (minor collection)" },
  { level: "info", message: "Cron job [cleanup-sessions] triggered" },
  { level: "info", message: "WebSocket connection established (client: kd92x)" },
  { level: "debug", message: "Redis pub/sub channel subscribed: events:deploy" },
  { level: "info", message: "SSL certificate valid — expires in 47 days" },
  { level: "warn", message: "Slow query detected: SELECT * FROM deployments (320ms)" },
  { level: "error", message: "ECONNREFUSED 10.0.3.12:5432 — retrying in 3s" },
  { level: "info", message: "Retry successful — database connection restored" },
  { level: "info", message: "Static assets served from CDN edge (us-east-1)" },
  { level: "debug", message: "JWT token validated for user_8fk29d" },
  { level: "info", message: "Deployment webhook received — build #1847" },
  { level: "info", message: "Build artifacts uploaded to storage (2.3MB)" },
  { level: "warn", message: "Rate limit approaching: 892/1000 requests per minute" },
  { level: "info", message: "Health check passed — all services operational" },
  { level: "debug", message: "Session store pruned: 23 expired entries removed" },
  { level: "info", message: "Middleware pipeline initialized (6 handlers)" },
  { level: "error", message: "Unhandled promise rejection — stack trace logged" },
  { level: "info", message: "Recovery: process restarted gracefully" },
];

function generateInitialLogs(count: number): LogLine[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const tpl = appLogTemplates[i % appLogTemplates.length];
    const time = new Date(now - (count - i) * 2400);
    return { timestamp: formatTime(time), level: tpl.level, message: tpl.message };
  });
}

function ApplicationLogs() {
  const [paused, setPaused] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>(() => generateInitialLogs(30));
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filteredLogs = useMemo(() => {
    return logs.filter((line) => {
      if (searchQuery && !line.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (levelFilter !== "all" && line.level !== levelFilter) return false;
      return true;
    });
  }, [logs, searchQuery, levelFilter]);

  // Simulate streaming logs
  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      const tpl = appLogTemplates[counterRef.current % appLogTemplates.length];
      counterRef.current++;
      const newLine: LogLine = {
        timestamp: formatTime(new Date()),
        level: tpl.level,
        message: tpl.message,
      };
      setLogs((prev) => [...prev.slice(-200), newLine]);
    }, 1200 + Math.random() * 1800);

    return () => clearInterval(interval);
  }, [paused]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filter toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-[4px] border border-dash-border bg-dash-bg px-3 py-1.5 shadow-[0px_1px_2px_rgba(18,18,23,0.05)]">
          <Search className="size-4 shrink-0 text-dash-text-extra-faded" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent font-logs text-sm text-dash-text-strong outline-none placeholder:text-dash-text-faded placeholder:opacity-50"
          />
        </div>

        <FilterDropdown
          value={levelFilter}
          onChange={setLevelFilter}
          options={levelFilterOptions}
          placeholder="All Levels"
          align="left"
        />

        <DateRangePicker value={dateRange} onChange={setDateRange}>
          <button className="flex items-center overflow-clip rounded-[4px] border border-dash-border bg-dash-bg text-sm text-dash-text-body shadow-[0px_1px_2px_rgba(18,18,23,0.05)] transition-colors hover:bg-dash-bg-elevated">
            <span className="flex items-center gap-2 px-3 py-1.5">
              <Calendar className="size-3.5 text-dash-text-faded" />
              {dateRange?.from && dateRange?.to
                ? `${dateRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${dateRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Select date range"}
            </span>
            <span className="flex h-full items-center border-l border-dash-border px-2 py-1.5">
              <ChevronDown className="size-4 text-dash-text-faded" />
            </span>
          </button>
        </DateRangePicker>
      </div>

      {/* Terminal */}
      <div className="overflow-hidden rounded-[4px] bg-[#222528] shadow-[0_4px_32px_rgba(0,0,0,0.12)]">
        {/* Terminal header */}
        <div className="flex items-center justify-end border-b border-[#31363a] px-4 py-2">
          <div className="flex items-center gap-2">
            {!paused && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#28c840]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#28c840]" />
                Live
              </span>
            )}
            <button
              onClick={() => setPaused(!paused)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
            >
              {paused ? (
                <>
                  <Play className="size-3" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="size-3" />
                  Pause
                </>
              )}
            </button>
          </div>
        </div>

        {/* Log output */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="min-h-[400px] max-h-[600px] overflow-y-auto px-4 py-3 font-logs text-xs leading-[22px]"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.1) transparent",
            }}
          >
            {filteredLogs.length > 0 ? (
              filteredLogs.map((line, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const raw = `${line.timestamp}  ${levelBadge[line.level]}  ${line.message}`;
                    navigator.clipboard.writeText(raw);
                    setCopiedIdx(i);
                    setTimeout(() => setCopiedIdx((prev) => (prev === i ? null : prev)), 1200);
                  }}
                  className="flex cursor-pointer gap-3 rounded-[2px] px-1 py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="shrink-0 select-none text-white/20">
                    {line.timestamp}
                  </span>
                  <span
                    className={`shrink-0 select-none font-medium ${levelColors[line.level]}`}
                  >
                    {levelBadge[line.level]}
                  </span>
                  <span className="flex-1 text-white/60">{line.message}</span>
                  {copiedIdx === i && (
                    <span className="shrink-0 select-none text-[10px] text-[#28c840]">
                      Copied
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="flex h-[360px] items-center justify-center">
                <span className="text-sm text-white/30">No logs matching your filters</span>
              </div>
            )}
          </div>

          {/* Scroll-to-bottom */}
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/60 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
            >
              <ArrowDown className="size-3" />
              New logs
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Request Logs (table-style)
   ───────────────────────────────────────────── */

interface RequestLogEntry {
  method: string;
  path: string;
  status: number;
  duration: string;
  timestamp: string;
  ip: string;
  host: string;
  url: string;
  browser: string;
  query?: Record<string, string>;
  headers: Record<string, string>;
  response: string;
  isoTimestamp: string;
}

const mockRequestLogs: RequestLogEntry[] = [
  {
    method: "GET", path: "/api/projects", status: 200, duration: "42ms", timestamp: "2 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/projects", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    headers: { "Referer": "https://app.brimble.io/dashboard", "Accept": "application/json", "Cf-Ray": "9d1ff7f5ef7de2c5-CPT", "Cf-Ipcountry": "NG", "Accept-Encoding": "gzip, br", "X-Forwarded-Proto": "https", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty" },
    response: "OK", isoTimestamp: "2026-02-22T17:48:01.227Z",
  },
  {
    method: "POST", path: "/api/deploy", status: 201, duration: "1,284ms", timestamp: "4 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/deploy", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    query: { branch: "main", env: "production" },
    headers: { "Content-Type": "application/json", "Referer": "https://app.brimble.io/projects", "Cf-Ray": "a2b3c4d5e6f7-LAX", "Cf-Ipcountry": "NG", "Accept-Encoding": "gzip, br" },
    response: "created", isoTimestamp: "2026-02-22T17:46:12.891Z",
  },
  {
    method: "GET", path: "/api/health", status: 200, duration: "3ms", timestamp: "5 min ago", ip: "10.0.0.1",
    host: "app.brimble.io", url: "https://app.brimble.io/api/health", browser: "kube-probe/1.28",
    headers: { "User-Agent": "kube-probe/1.28", "Accept": "*/*", "Connection": "close" },
    response: "OK", isoTimestamp: "2026-02-22T17:45:00.112Z",
  },
  {
    method: "GET", path: "/api/domains", status: 200, duration: "67ms", timestamp: "8 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/domains?projectId=audioly", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    query: { projectId: "audioly" },
    headers: { "Referer": "https://app.brimble.io/projects/audioly/domains", "Accept": "application/json", "Cf-Ipcountry": "NG" },
    response: "OK", isoTimestamp: "2026-02-22T17:42:33.445Z",
  },
  {
    method: "PATCH", path: "/api/settings", status: 200, duration: "89ms", timestamp: "12 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/settings", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    headers: { "Content-Type": "application/json", "Referer": "https://app.brimble.io/settings", "Cf-Ipcountry": "NG" },
    response: "OK", isoTimestamp: "2026-02-22T17:38:44.221Z",
  },
  {
    method: "GET", path: "/api/metrics", status: 429, duration: "—", timestamp: "15 min ago", ip: "203.45.67.89",
    host: "app.brimble.io", url: "https://app.brimble.io/api/metrics", browser: "python-requests/2.31.0",
    headers: { "User-Agent": "python-requests/2.31.0", "Accept": "*/*", "Accept-Encoding": "gzip, deflate" },
    response: "rate limited", isoTimestamp: "2026-02-22T17:35:12.003Z",
  },
  {
    method: "POST", path: "/api/webhooks/github", status: 200, duration: "34ms", timestamp: "18 min ago", ip: "140.82.112.5",
    host: "app.brimble.io", url: "https://app.brimble.io/api/webhooks/github", browser: "GitHub-Hookshot/1a2b3c4",
    headers: { "Content-Type": "application/json", "X-GitHub-Event": "push", "X-GitHub-Delivery": "f8e7d6c5-b4a3-2918-0706-f5e4d3c2b1a0", "User-Agent": "GitHub-Hookshot/1a2b3c4" },
    response: "handled", isoTimestamp: "2026-02-22T17:32:08.776Z",
  },
  {
    method: "GET", path: "/api/users/me", status: 200, duration: "18ms", timestamp: "20 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/users/me", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    headers: { "Authorization": "Bearer ey...redacted", "Accept": "application/json", "Cf-Ipcountry": "NG" },
    response: "OK", isoTimestamp: "2026-02-22T17:30:55.109Z",
  },
  {
    method: "POST", path: "/api/deploy", status: 500, duration: "2,102ms", timestamp: "25 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/deploy", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    query: { branch: "feat/auth", env: "staging" },
    headers: { "Content-Type": "application/json", "Referer": "https://app.brimble.io/projects", "Cf-Ipcountry": "NG" },
    response: "internal server error", isoTimestamp: "2026-02-22T17:25:11.887Z",
  },
  {
    method: "GET", path: "/api/analytics", status: 200, duration: "234ms", timestamp: "30 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/analytics?range=7d", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    query: { range: "7d" },
    headers: { "Accept": "application/json", "Cf-Ipcountry": "NG" },
    response: "OK", isoTimestamp: "2026-02-22T17:20:03.554Z",
  },
  {
    method: "PUT", path: "/api/env", status: 200, duration: "56ms", timestamp: "35 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/env", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    headers: { "Content-Type": "application/json", "Referer": "https://app.brimble.io/projects/audioly/environment", "Cf-Ipcountry": "NG" },
    response: "OK", isoTimestamp: "2026-02-22T17:15:47.332Z",
  },
  {
    method: "GET", path: "/api/certificates", status: 200, duration: "78ms", timestamp: "40 min ago", ip: "102.89.23.45",
    host: "app.brimble.io", url: "https://app.brimble.io/api/certificates", browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    headers: { "Accept": "application/json", "Cf-Ipcountry": "NG" },
    response: "OK", isoTimestamp: "2026-02-22T17:10:22.001Z",
  },
];

const methodColors: Record<string, string> = {
  GET: "text-[#28c840]",
  POST: "text-[#4879f8]",
  PUT: "text-[#ff9b01]",
  PATCH: "text-[#ff9b01]",
  DELETE: "text-[#ff5f57]",
};

const methodFilterOptions: FilterOption[] = [
  { label: "All Methods", value: "all" },
  { label: "GET", value: "GET", dot: "#28c840" },
  { label: "POST", value: "POST", dot: "#4879f8" },
  { label: "PUT", value: "PUT", dot: "#ff9b01" },
  { label: "PATCH", value: "PATCH", dot: "#ff9b01" },
  { label: "DELETE", value: "DELETE", dot: "#ff5f57" },
];

const statusFilterOptions: FilterOption[] = [
  { label: "All Statuses", value: "all" },
  { label: "2xx Success", value: "2xx", dot: "#28c840" },
  { label: "4xx Client Error", value: "4xx", dot: "#ff9b01" },
  { label: "5xx Server Error", value: "5xx", dot: "#ff5f57" },
];

function statusColor(status: number) {
  if (status < 300) return "text-[#28c840]";
  if (status < 400) return "text-[#ff9b01]";
  return "text-[#ff5f57]";
}

function statusDot(status: number) {
  if (status < 300) return "bg-[#28c840]";
  if (status < 400) return "bg-[#ff9b01]";
  return "bg-[#ff5f57]";
}

/** Build raw JSON object for the Raw Data tab */
function buildRawData(log: RequestLogEntry) {
  const raw: Record<string, unknown> = {
    timestamp: log.isoTimestamp,
    hostname: log.host,
    method: log.method,
    url: log.url,
  };
  if (log.query) raw.query = log.query;
  raw.status = log.status;
  raw.response = log.response;
  raw.browser = log.browser;
  raw.headers = log.headers;
  raw.ip = log.ip;
  raw.duration = log.duration;
  return raw;
}

/** Tokenize a single line of JSON and return colored spans */
function JsonLine({ text }: { text: string }) {
  const tokens: { value: string; color: string }[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:\s*)?|(\d+(?:\.\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)|([^"\d\w]+|\w+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m[1]) {
      if (m[2]) {
        // Key: "key":
        tokens.push({ value: m[1], color: "text-[#b5695f]" });
        tokens.push({ value: m[2], color: "" });
      } else {
        // String value
        tokens.push({ value: m[1], color: "text-[#4e9a06]" });
      }
    } else if (m[3]) {
      tokens.push({ value: m[3], color: "text-[#4879f8]" });
    } else if (m[4]) {
      tokens.push({ value: m[4], color: "text-[#4879f8]" });
    } else if (m[5]) {
      tokens.push({ value: m[5], color: "" });
    }
  }

  return (
    <span>
      {tokens.map((t, i) => (
        <span key={i} className={t.color}>{t.value}</span>
      ))}
    </span>
  );
}

/** Request log detail drawer (bottom sheet) */
function RequestDetailDrawer({
  log,
  open,
  onOpenChange,
}: {
  log: RequestLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<"details" | "raw">("details");
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const rawData = buildRawData(log);
  const rawJson = JSON.stringify(rawData, null, 2);
  const rawLines = rawJson.split("\n");

  const groups = [
    {
      title: "Request",
      items: [
        { label: "Host", value: log.host },
        { label: "Method", value: log.method, color: methodColors[log.method] },
        { label: "Path", value: log.path },
        { label: "URL", value: log.url },
      ],
    },
    {
      title: "Response",
      items: [
        { label: "Status", value: String(log.status), dot: statusDot(log.status) },
        { label: "Duration", value: log.duration },
        { label: "Response", value: log.response },
      ],
    },
    {
      title: "Client",
      items: [
        { label: "IP Address", value: log.ip },
        { label: "Browser", value: log.browser },
        { label: "Time", value: log.isoTimestamp.replace("T", " ").replace("Z", "") },
      ],
    },
  ];

  function handleCopy() {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="bottom" modal={false}>
      <Drawer.Portal>
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col outline-none">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="flex max-h-[60vh] flex-col overflow-clip rounded-t-[4px] border-t-[0.5px] border-[#d9dadd] bg-dash-bg shadow-[0px_-4px_20px_-8px_rgba(0,0,0,0.15)] dark:border-dash-border dark:bg-[#181819]"
          >
            {/* Top bar */}
            <div className="flex shrink-0 items-center justify-between border-b-[0.5px] border-[#e5e5e5] px-5 py-2.5 dark:border-dash-border">
              <div className="flex items-center gap-2">
                <span className={`font-logs text-xs font-medium ${methodColors[log.method] ?? "text-dash-text-body"}`}>
                  {log.method}
                </span>
                <span className="font-logs text-xs leading-[1.3] tracking-[-0.0224px] text-dash-text-strong">{log.path}</span>
                <span className={`flex items-center gap-1 font-logs text-xs ${statusColor(log.status)}`}>
                  <span className={`size-1.5 rounded-full ${statusDot(log.status)}`} />
                  {log.status}
                </span>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2 rounded p-0.5 text-dash-text-strong transition-colors hover:bg-dash-bg-elevated"
              >
                <X className="size-4" />
                <span className="font-logs text-xs leading-[1.4] tracking-[-0.01px]">Close</span>
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b-[0.5px] border-[#e5e5e5] px-5 dark:border-dash-border">
              <button
                onClick={() => setTab("details")}
                className={`px-1 pb-2 pt-2.5 font-logs text-xs leading-[1.4] tracking-[-0.01px] transition-colors ${
                  tab === "details"
                    ? "border-b-2 border-[#3c6ce7] font-medium text-[#3c6ce7]"
                    : "text-dash-text-faded hover:text-dash-text-body"
                }`}
              >
                Event Details
              </button>
              <button
                onClick={() => setTab("raw")}
                className={`ml-4 px-1 pb-2 pt-2.5 font-logs text-xs leading-[1.4] tracking-[-0.01px] transition-colors ${
                  tab === "raw"
                    ? "border-b-2 border-[#3c6ce7] font-medium text-[#3c6ce7]"
                    : "text-dash-text-faded hover:text-dash-text-body"
                }`}
              >
                Raw Data
              </button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === "details" ? (
                <div className="flex flex-col gap-4 p-5">
                  {/* Request + Response side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    {groups.slice(0, 2).map((group) => (
                      <div key={group.title} className="rounded-[4px] border-[0.5px] border-dash-border">
                        <div className="border-b-[0.5px] border-dash-border bg-dash-bg-elevated px-3.5 py-2">
                          <span className="font-logs text-[10px] uppercase tracking-widest text-dash-text-faded">
                            {group.title}
                          </span>
                        </div>
                        <div>
                          {group.items.map((item, j) => (
                            <div
                              key={item.label}
                              className={`flex justify-between px-3.5 py-2 ${j < group.items.length - 1 ? "border-b-[0.5px] border-dash-border" : ""}`}
                            >
                              <span className="font-logs text-xs text-dash-text-faded">{item.label}</span>
                              <span className={`font-logs text-xs text-right ${item.color ?? "text-dash-text-strong"}`}>
                                {item.dot && <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${item.dot}`} />}
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Client full width */}
                  <div className="rounded-[4px] border-[0.5px] border-dash-border">
                    <div className="border-b-[0.5px] border-dash-border bg-dash-bg-elevated px-3.5 py-2">
                      <span className="font-logs text-[10px] uppercase tracking-widest text-dash-text-faded">
                        {groups[2].title}
                      </span>
                    </div>
                    <div>
                      {groups[2].items.map((item, j) => (
                        <div
                          key={item.label}
                          className={`flex justify-between px-3.5 py-2 ${j < groups[2].items.length - 1 ? "border-b-[0.5px] border-dash-border" : ""}`}
                        >
                          <span className="font-logs text-xs text-dash-text-faded">{item.label}</span>
                          <span className="font-logs text-xs text-dash-text-strong">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Copy button */}
                  <button
                    onClick={handleCopy}
                    className="absolute right-3 top-2 flex items-center gap-1 rounded p-0.5 font-logs text-[10px] leading-[1.4] tracking-[-0.01px] text-dash-text-faded transition-colors hover:bg-dash-bg-elevated hover:text-dash-text-strong"
                  >
                    {copied ? <Check className="size-3 text-[#28c840]" /> : <Copy className="size-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <div className="px-5 py-2.5 font-mono text-xs leading-[1.6]">
                    {rawLines.map((line, i) => (
                      <div key={i} className="flex">
                        <span className="inline-block w-6 shrink-0 select-none text-right text-dash-text-extra-faded">
                          {i + 1}
                        </span>
                        <span className="ml-3 whitespace-pre text-dash-text-body">
                          <JsonLine text={line} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function RequestLogs() {
  const [selectedLog, setSelectedLog] = useState<RequestLogEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filteredRequestLogs = useMemo(() => {
    return mockRequestLogs.filter((log) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = `${log.method} ${log.path} ${log.response} ${log.status}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (methodFilter !== "all" && log.method !== methodFilter) return false;
      if (statusFilter !== "all") {
        const prefix = String(log.status)[0];
        if (statusFilter === "2xx" && prefix !== "2") return false;
        if (statusFilter === "4xx" && prefix !== "4") return false;
        if (statusFilter === "5xx" && prefix !== "5") return false;
      }
      if (dateRange?.from) {
        const logDate = new Date(log.isoTimestamp);
        if (logDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (logDate > endOfDay) return false;
        }
      }
      return true;
    });
  }, [searchQuery, methodFilter, statusFilter, dateRange]);

  function handleRowClick(log: RequestLogEntry) {
    setSelectedLog(log);
    setDrawerOpen(true);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filter toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-[4px] border border-dash-border bg-dash-bg px-3 py-1.5 shadow-[0px_1px_2px_rgba(18,18,23,0.05)]">
          <Search className="size-4 shrink-0 text-dash-text-extra-faded" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent font-logs text-sm text-dash-text-strong outline-none placeholder:text-dash-text-faded placeholder:opacity-50"
          />
        </div>

        <FilterDropdown
          value={methodFilter}
          onChange={setMethodFilter}
          options={methodFilterOptions}
          placeholder="All Methods"
          align="left"
        />

        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusFilterOptions}
          placeholder="All Statuses"
          align="left"
        />

        <DateRangePicker value={dateRange} onChange={setDateRange}>
          <button className="flex items-center overflow-clip rounded-[4px] border border-dash-border bg-dash-bg text-sm text-dash-text-body shadow-[0px_1px_2px_rgba(18,18,23,0.05)] transition-colors hover:bg-dash-bg-elevated">
            <span className="flex items-center gap-2 px-3 py-1.5">
              <Calendar className="size-3.5 text-dash-text-faded" />
              {dateRange?.from && dateRange?.to
                ? `${dateRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${dateRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Select date range"}
            </span>
            <span className="flex h-full items-center border-l border-dash-border px-2 py-1.5">
              <ChevronDown className="size-4 text-dash-text-faded" />
            </span>
          </button>
        </DateRangePicker>
      </div>

      {/* Table */}
      <div className="overflow-clip rounded-[4px] border-[0.5px] border-dash-border">
        {/* Table header */}
        <div className="grid grid-cols-[64px_1fr_60px_80px_100px] items-center gap-2 border-b-[0.5px] border-dash-border bg-dash-bg-elevated px-4 py-2.5">
          <span className="font-logs text-xs font-medium text-dash-text-faded">Method</span>
          <span className="font-logs text-xs font-medium text-dash-text-faded">Path</span>
          <span className="font-logs text-xs font-medium text-dash-text-faded">Status</span>
          <span className="font-logs text-xs font-medium text-dash-text-faded">Duration</span>
          <span className="font-logs text-xs font-medium text-dash-text-faded">Time</span>
        </div>

        {/* Rows */}
        {filteredRequestLogs.length > 0 ? (
          filteredRequestLogs.map((log, i) => (
            <button
              key={i}
              onClick={() => handleRowClick(log)}
              className="grid w-full grid-cols-[64px_1fr_60px_80px_100px] items-center gap-2 border-b-[0.5px] border-dash-border px-4 py-2.5 text-left transition-colors hover:bg-dash-bg-elevated"
            >
              <span className={`font-logs text-xs font-medium ${methodColors[log.method] ?? "text-dash-text-body"}`}>
                {log.method}
              </span>
              <span className="truncate font-logs text-sm font-light text-dash-text-strong">
                {log.path}
              </span>
              <span className={`font-logs text-xs font-medium ${statusColor(log.status)}`}>
                {log.status}
              </span>
              <span className="font-logs text-xs font-light text-dash-text-faded">{log.duration}</span>
              <span className="font-logs text-xs font-light text-dash-text-faded">{log.timestamp}</span>
            </button>
          ))
        ) : (
          <div className="flex h-32 items-center justify-center">
            <span className="text-sm text-dash-text-faded">No requests matching your filters</span>
          </div>
        )}
      </div>

      <RequestDetailDrawer
        log={selectedLog}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────── */

function LogsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("application");

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TabHeader title="Logs">
          Monitor your application and request logs in real-time.{" "}
          <a
            href="#"
            className="text-[#4879f8] underline transition-colors hover:text-[#3a6ae6]"
          >
            Learn more
          </a>
        </TabHeader>

        {/* Tab switcher */}
        <div className="flex overflow-clip rounded-[4px] border border-dash-border-soft shadow-[0px_1px_2px_rgba(18,18,23,0.05)]">
          <button
            onClick={() => setActiveTab("application")}
            className={`flex h-[34px] items-center gap-2 border-r border-dash-border-soft px-3.5 text-sm transition-colors ${
              activeTab === "application"
                ? "bg-dash-bg font-medium text-dash-text-strong"
                : "bg-dash-bg-elevated text-dash-text-faded"
            }`}
          >
            <Activity className="size-4" />
            Application Logs
          </button>
          <button
            onClick={() => setActiveTab("request")}
            className={`flex h-[34px] items-center gap-2 px-3.5 text-sm transition-colors ${
              activeTab === "request"
                ? "bg-dash-bg font-medium text-dash-text-strong"
                : "bg-dash-bg-elevated text-dash-text-faded"
            }`}
          >
            <Forward className="size-4" />
            Request Logs
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "application" ? <ApplicationLogs /> : <RequestLogs />}
    </div>
  );
}
