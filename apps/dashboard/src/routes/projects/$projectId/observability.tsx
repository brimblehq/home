import { useState, useRef, useEffect, useMemo } from "react";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown } from "lucide-react";
import { TabHeader } from "../../../components/shared/tab-header";
import { TimeSeriesChart } from "@/components/observability/time-series-chart";
import { SemiGauge } from "@/components/observability/semi-gauge";
import { SegmentedToggle } from "@/components/observability/segmented-toggle";
import { formatTimeLabel, toKbps, hoursAgoForInterval } from "@/utils/observability";
import type { ResourceObservabilityMetrics } from "@/backend/observability";
import {
  getObservabilityGrafanaUrlServerFn,
  getProjectObservabilityMetricsServerFn,
} from "@/server/observability/actions";
import { normalizeMemoryGbValue } from "@/utils/project-configuration";

const parentRoute = getRouteApi("/projects/$projectId");

export const Route = createFileRoute("/projects/$projectId/observability")({
  staleTime: 30_000,
  preloadStaleTime: 30_000,
  loader: async ({ context }) => {
    const project = (context as any).project;
    const workspace = (context as any).workspace;

    const [metrics, grafanaUrl] = await Promise.all([
      (getProjectObservabilityMetricsServerFn as unknown as (input: {
        data: { projectId: string; workspace?: string; hrsAgo?: number };
      }) => Promise<ResourceObservabilityMetrics>)({
        data: { projectId: project.id, workspace, hrsAgo: 1 },
      }),
      (getObservabilityGrafanaUrlServerFn as unknown as (input: {
        data: { workspace?: string };
      }) => Promise<string | null>)({
        data: { workspace },
      }).catch(() => null),
    ]);

    return { metrics, grafanaUrl };
  },
  component: ObservabilityPage,
});

type MetricChart = "Memory Usage" | "CPU Usage" | "Network Egress" | "Response Times";

const timeIntervals = [
  "Last 1 Hour",
  "Last 6 Hours",
  "Last 24 Hours",
  "Last 7 Days",
  "Last 30 Days",
];

function TimeIntervalDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-[34px] items-center gap-1.5 rounded-[4px] border-[0.5px] border-dash-border px-3 text-xs font-medium text-dash-text-strong"
      >
        {value}
        <ChevronDown
          className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg py-1 shadow-lg">
          {timeIntervals.map((interval) => (
            <button
              key={interval}
              onClick={() => {
                onChange(interval);
                setOpen(false);
              }}
              className={`flex w-full px-3 py-2 text-left text-xs transition-colors ${
                interval === value
                  ? "font-medium text-[#4879f8]"
                  : "font-light text-dash-text-body hover:bg-dash-bg-elevated"
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AppMetrics({
  project,
  initialMetrics,
  grafanaUrl,
  workspace,
}: {
  project: Project;
  initialMetrics: ResourceObservabilityMetrics;
  grafanaUrl: string | null;
  workspace?: string;
}) {
  const fetchMetrics = useServerFn(getProjectObservabilityMetricsServerFn as any) as (args: {
    data: { projectId: string; workspace?: string; hrsAgo?: number };
  }) => Promise<ResourceObservabilityMetrics>;
  const [activeChart, setActiveChart] = useState<MetricChart>("Memory Usage");
  const [responseMetric, setResponseMetric] = useState("P90");
  const [timeInterval, setTimeInterval] = useState("Last 1 Hour");
  const [metrics, setMetrics] = useState<ResourceObservabilityMetrics>(initialMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  useEffect(() => {
    let cancelled = false;

    async function loadMetricsForRange() {
      const hrsAgo = hoursAgoForInterval(timeInterval);
      if (hrsAgo === 1) {
        setMetrics(initialMetrics);
        return;
      }

      try {
        setLoadingMetrics(true);
        const nextMetrics = await fetchMetrics({
          data: {
            projectId: project.id,
            workspace,
            hrsAgo,
          },
        });

        if (!cancelled) {
          setMetrics(nextMetrics);
        }
      } finally {
        if (!cancelled) {
          setLoadingMetrics(false);
        }
      }
    }

    void loadMetricsForRange();

    return () => {
      cancelled = true;
    };
  }, [timeInterval, fetchMetrics, project.id, workspace, initialMetrics]);

  const chartTabs: MetricChart[] = [
    "Memory Usage",
    "CPU Usage",
    "Network Egress",
    "Response Times",
  ];

  const aggregateSeries = useMemo(() => {
    const results = Array.isArray(metrics?.results) ? metrics.results : [];

    return results.map((item: any) => {
      let point = item;
      if (item && typeof item === "object" && "aggregate" in item) {
        point = item.aggregate;
      }

      return {
        time: formatTimeLabel(String(item?.date ?? "")),
        memory: Number(point?.memory ?? 0),
        cpu: Number(point?.cpu ?? 0),
        network: toKbps(point?.network?.bytesPerSecond ?? null),
      };
    });
  }, [metrics]);

  const responseSeries = useMemo(() => {
    const items = metrics?.responseTime?.results || [];

    return {
      P90: items.map((item) => ({
        time: formatTimeLabel(item.date),
        value: Number(item.p90 ?? 0),
      })),
      P95: items.map((item) => ({
        time: formatTimeLabel(item.date),
        value: Number(item.p95 ?? 0),
      })),
      P99: items.map((item) => ({
        time: formatTimeLabel(item.date),
        value: Number(item.p99 ?? 0),
      })),
      Average: items.map((item) => ({
        time: formatTimeLabel(item.date),
        value: Number(item.avg ?? 0),
      })),
    };
  }, [metrics]);

  let currentData: { time: string; value: number }[] = [];
  let currentUnit = "";

  if (activeChart === "Response Times") {
    currentData = responseSeries[responseMetric] || [];
    currentUnit = "ms";
  } else if (activeChart === "Memory Usage") {
    currentData = aggregateSeries.map((item) => ({ time: item.time, value: item.memory }));
    currentUnit = "%";
  } else if (activeChart === "CPU Usage") {
    currentData = aggregateSeries.map((item) => ({ time: item.time, value: item.cpu }));
    currentUnit = "%";
  } else {
    currentData = aggregateSeries.map((item) => ({ time: item.time, value: item.network }));
    currentUnit = "KB/s";
  }

  const cpuPercent = Number(metrics?.average?.cpu?.totalInPercentage ?? 0);
  const cpuSize = Number(metrics?.average?.cpu?.size ?? 0);
  const memoryPercent = Number(metrics?.average?.memory?.totalInPercentage ?? 0);
  const memoryUsedGb = Number(metrics?.average?.memory?.size ?? 0);
  const memoryLimitGb = normalizeMemoryGbValue(project?.specs?.memory);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <TabHeader title="Metrics & Observability">
          Monitor your app's key metrics and health.
          {grafanaUrl ? (
            <>
              {" "}
              <a
                href={grafanaUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#4879f8] underline"
              >
                View in Grafana
              </a>
            </>
          ) : null}
        </TabHeader>
        <TimeIntervalDropdown value={timeInterval} onChange={setTimeInterval} />
      </div>

      <div className="flex gap-4">
        <SemiGauge
          value={cpuPercent}
          max={100}
          label="CPU"
          valueLabel={`${cpuPercent.toFixed(1)}% - ${cpuSize.toFixed(1)} vCPU`}
          title="CPU Usage"
          subtitle="Current processor utilization"
        />
        <SemiGauge
          value={memoryPercent}
          max={100}
          label="Memory"
          valueLabel={`${memoryPercent.toFixed(2)} % / ${memoryLimitGb.toFixed(1)}GB`}
          title="Memory usage"
          subtitle="Current memory consumption"
        />
      </div>

      <div className="rounded-[4px] border-[0.5px] border-dash-border">
        <div className="flex items-center justify-between border-b-[0.5px] border-dash-border">
          <div className="flex">
            {chartTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveChart(tab)}
                className={`px-4 py-3 text-sm transition-colors ${
                  activeChart === tab
                    ? "border-b-2 border-[#f5a623] font-medium text-[#f5a623]"
                    : "font-light text-dash-text-faded hover:text-dash-text-body"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeChart === "Response Times" ? (
            <div className="pr-4">
              <SegmentedToggle
                options={["P90", "P95", "P99", "Average"]}
                value={responseMetric}
                onChange={setResponseMetric}
              />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 overflow-hidden px-5 pb-5 pt-8">
          {loadingMetrics ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-dash-text-faded">
              Loading metrics...
            </div>
          ) : currentData.length > 0 ? (
            <TimeSeriesChart data={currentData} yUnit={currentUnit} label={activeChart} />
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-dash-text-faded">
              No metrics available for this time range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const visitorData = [
  { month: "JAN", value: 14 },
  { month: "FEB", value: 108 },
  { month: "MAR", value: 166 },
  { month: "APR", value: 55 },
  { month: "MAY", value: 137 },
  { month: "JUN", value: 14 },
  { month: "JUL", value: 76 },
  { month: "AUG", value: 55 },
  { month: "SEP", value: 183 },
  { month: "OCT", value: 89 },
  { month: "NOV", value: 154 },
  { month: "DEC", value: 13 },
];

const topPages = [
  { path: "/about", visitors: 148 },
  { path: "/blog", visitors: 148 },
  { path: "/home", visitors: 148 },
];

const funnelSources = [
  { name: "Asana", icon: "🔷", visitors: 148 },
  { name: "Confluence", icon: "🔵", visitors: 148 },
  { name: "LinkedIn", icon: "🔗", visitors: 148 },
  { name: "Google.com", icon: "🔍", visitors: 148 },
];

const countries = [
  { name: "Nigeria", flag: "🇳🇬", visitors: 148 },
  { name: "United States", flag: "🇺🇸", visitors: 148 },
  { name: "Canada", flag: "🇨🇦", visitors: 148 },
  { name: "Mexico", flag: "🇲🇽", visitors: 148 },
  { name: "Botswana", flag: "🇧🇼", visitors: 148 },
];

const browsers = [
  { name: "Chrome", visitors: 148 },
  { name: "Mozilla Firefox", visitors: 148 },
  { name: "Arc", visitors: 148 },
  { name: "Edge", visitors: 148 },
  { name: "Safari", visitors: 148 },
];

const devices = [
  { name: "Desktop", visitors: 3200 },
  { name: "Mobile", visitors: 1400 },
  { name: "Tablet", visitors: 300 },
];

function MiniSparkline({ className, color = "#fff" }: { className?: string; color?: string }) {
  const points = [2, 8, 5, 12, 7, 18, 14, 22, 16, 28, 20, 35];
  const max = Math.max(...points);
  const h = 40;
  const w = 120;
  const d = points
    .map((v, i) => `${(i / (points.length - 1)) * w},${h - (v / max) * (h - 4)}`)
    .join(" L ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none">
      <polyline points={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function VisitorBarChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...visitorData.map((d) => d.value), 1);
  const barH = 240;

  return (
    <div className="mt-6">
      <div className="flex gap-0">
        {visitorData.map((d, i) => {
          const pct = d.value / max;
          const valH = Math.max(pct * barH, 6);
          const isActive = hovered === i;

          return (
            <div
              key={d.month}
              className="flex flex-1 flex-col items-center gap-2"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="relative w-full overflow-hidden rounded-[4px]"
                style={{ height: barH }}
              >
                <div
                  className="absolute inset-0 rounded-[4px]"
                  style={{
                    backgroundColor: "var(--color-dash-bg-elevated)",
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, transparent, transparent 4px, var(--color-dash-border-soft) 4px, var(--color-dash-border-soft) 4.5px)",
                  }}
                />

                <div
                  className="absolute inset-x-0 bottom-0 transition-all duration-150"
                  style={{ height: valH }}
                >
                  <div
                    className="size-full"
                    style={{
                      backgroundColor: "#ff7a00",
                      opacity: isActive ? 1 : 0.3,
                    }}
                  />
                  {isActive && (
                    <div
                      className="absolute inset-x-0 top-0 -translate-y-full"
                      style={{ height: 10, backgroundColor: "#ffa800" }}
                    />
                  )}
                </div>
              </div>

              <span
                className={`text-[11px] font-medium tracking-wide transition-colors ${
                  isActive
                    ? "text-dash-text-strong"
                    : "text-dash-text-extra-faded"
                }`}
              >
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListCard({ title, subtitle, items, showSeeAll }: { title: string; subtitle?: string; items: { label: string; icon?: string; value: string }[]; showSeeAll?: boolean }) {
  return (
    <div className="flex flex-1 flex-col rounded-[4px] border-[0.5px] border-dash-border">
      <div className="flex items-center justify-between border-b-[0.5px] border-dash-border px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-dash-text-strong">{title}</h3>
          {subtitle && <p className="text-xs font-light text-dash-text-faded">{subtitle}</p>}
        </div>
        {showSeeAll && <button className="text-xs text-[#4879f8] hover:underline">See all</button>}
      </div>
      <div className="flex flex-col">
        {items.map((item, i) => (
          <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i < items.length - 1 ? "border-b-[0.5px] border-dash-border-soft" : ""}`}>
            <div className="flex items-center gap-2">
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span className="text-sm font-light text-dash-text-body">{item.label}</span>
            </div>
            <span className="text-xs text-dash-text-faded">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const analyticsPeriods = [
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "Last 90 days",
];

function AppAnalytics() {
  const [visitorTab, setVisitorTab] = useState("Visitors");
  const [browserTab, setBrowserTab] = useState("Browsers");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("Last 7 days");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
    }
    if (periodOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [periodOpen]);

  return (
    <div className="flex flex-col gap-6">
      <TabHeader title="Web analytics">
        Track visitor activity, top pages, and traffic sources.{" "}
        <a href="#" className="text-[#4879f8] underline">
          Learn more
        </a>
      </TabHeader>

      <div className="flex items-center justify-between overflow-hidden rounded-lg bg-gradient-to-r from-[#2d2b55] via-[#3b3875] to-[#2d2b55] px-6 py-5">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-[1px] text-white/60">
            Analytics TLDR:
          </span>
          <p className="text-xs font-light leading-[1.4] text-white/50">
            Quick view summary for what's going on
            <br />
            with 'kemdrim.brimble.app'.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-medium text-white">322</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.5px] text-white/40">Unique Visitors</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-medium text-white">21</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.5px] text-white/40">Countries</span>
          </div>
          <MiniSparkline className="h-10 w-[140px]" />
        </div>
      </div>

      <div className="rounded-[4px] border-[0.5px] border-dash-border p-5">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-light text-dash-text-faded">Site Visitors</p>
            <span className="text-[32px] font-medium leading-tight tracking-tight text-dash-text-strong">4,900,442</span>
          </div>
          <div className="flex items-center gap-3">
            <SegmentedToggle options={["Visitors", "Page Views"]} value={visitorTab} onChange={setVisitorTab} />
            <div ref={periodRef} className="relative">
              <button
                onClick={() => setPeriodOpen(!periodOpen)}
                className="flex items-center gap-1.5 rounded-[4px] border-[0.5px] border-dash-border px-3 py-1.5 text-xs font-medium text-dash-text-strong"
              >
                {analyticsPeriod}
                <ChevronDown
                  className={`size-3 transition-transform ${periodOpen ? "rotate-180" : ""}`}
                />
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-[4px] border-[0.5px] border-dash-border bg-dash-bg py-1 shadow-lg">
                  {analyticsPeriods.map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setAnalyticsPeriod(period);
                        setPeriodOpen(false);
                      }}
                      className={`flex w-full px-3 py-2 text-left text-xs transition-colors ${
                        period === analyticsPeriod
                          ? "font-medium text-[#4879f8]"
                          : "font-light text-dash-text-body hover:bg-dash-bg-elevated"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <VisitorBarChart />
      </div>

      <div className="flex gap-4">
        <ListCard title="Top pages" subtitle="Most visited pages" showSeeAll items={topPages.map((p) => ({ label: p.path, value: `${p.visitors} Visitors` }))} />
        <ListCard title="Funnel" subtitle="Where your visitors have come from" items={funnelSources.map((s) => ({ label: s.name, icon: s.icon, value: String(s.visitors) }))} />
      </div>

      <div className="flex gap-4">
        <ListCard title="Countries" subtitle="Pages with the highest amount of visitors" showSeeAll items={countries.map((c) => ({ label: c.name, icon: c.flag, value: `${c.visitors} Visitors` }))} />
        <div className="flex flex-1 flex-col rounded-[4px] border-[0.5px] border-dash-border">
          <div className="flex items-center justify-between border-b-[0.5px] border-dash-border px-4 py-3">
            <h3 className="text-sm font-medium text-dash-text-strong">Browser & Device Information</h3>
            <SegmentedToggle options={["Browsers", "Devices"]} value={browserTab} onChange={setBrowserTab} />
          </div>
          <div className="flex flex-col">
            {(browserTab === "Browsers" ? browsers : devices).map((item, i, arr) => (
              <div key={item.name} className={`flex items-center justify-between px-4 py-2.5 ${i < arr.length - 1 ? "border-b-[0.5px] border-dash-border-soft" : ""}`}>
                <span className="text-sm font-light text-dash-text-body">{item.name}</span>
                <span className="text-xs text-dash-text-faded">{item.visitors}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ObservabilityPage() {
  const { project, workspace } = parentRoute.useLoaderData() as any;
  const { metrics, grafanaUrl } = Route.useLoaderData();
  const [section, setSection] = useState<"metrics" | "analytics">("metrics");

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6 py-8">
      <div className="flex items-center gap-1 self-start rounded-[4px] border-[0.5px] border-dash-border p-0.5">
        <button
          onClick={() => setSection("metrics")}
          className={`rounded-[3px] px-4 py-1.5 text-sm font-medium transition-colors ${
            section === "metrics"
              ? "bg-dash-bg-elevated text-dash-text-strong"
              : "text-dash-text-faded hover:text-dash-text-body"
          }`}
        >
          App Metrics
        </button>
        <button
          onClick={() => setSection("analytics")}
          className={`rounded-[3px] px-4 py-1.5 text-sm font-medium transition-colors ${
            section === "analytics"
              ? "bg-dash-bg-elevated text-dash-text-strong"
              : "text-dash-text-faded hover:text-dash-text-body"
          }`}
        >
          App Analytics
        </button>
      </div>

      {section === "metrics" ? (
        <AppMetrics
          project={project}
          initialMetrics={metrics}
          grafanaUrl={grafanaUrl}
          workspace={workspace}
        />
      ) : (
        <AppAnalytics />
      )}
    </div>
  );
}
