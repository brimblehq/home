import { useTheme } from "@/hooks/use-theme";
import { Theme } from "@/types/enums";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cellColor(value: number, max: number, isDark: boolean) {
  if (max <= 0 || value <= 0) return isDark ? "#1a2230" : "#eef2f7";
  const intensity = Math.min(1, value / max);
  const alpha = 0.15 + intensity * 0.7;
  return `rgba(0, 111, 255, ${alpha})`;
}

export function TrafficHeatmap({ grid }: { grid: number[][] }) {
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const max = grid.reduce((m, row) => Math.max(m, ...row), 0);

  return (
    <div className="flex flex-col rounded-[4px] border-[0.5px] border-dash-border">
      <div className="border-b-[0.5px] border-dash-border px-4 py-3">
        <h3 className="text-sm font-medium text-dash-text-strong">Traffic by hour</h3>
        <p className="text-xs font-light text-dash-text-faded">
          Pageviews by day of week and hour of day
        </p>
      </div>
      <div className="overflow-x-auto px-4 py-5">
        <div className="flex min-w-[680px] flex-col gap-1">
          {/* Hour column labels */}
          <div className="grid grid-cols-[40px_repeat(24,1fr)] items-center gap-1">
            <span />
            {Array.from({ length: 24 }).map((_, h) => (
              <span
                key={h}
                className="text-center text-[9px] font-medium tracking-[0.5px] text-dash-text-extra-faded"
              >
                {h % 6 === 0 ? String(h).padStart(2, "0") : ""}
              </span>
            ))}
          </div>

          {grid.map((row, dayIdx) => (
            <div
              key={dayIdx}
              className="grid grid-cols-[40px_repeat(24,1fr)] items-center gap-1"
            >
              <span className="text-[10px] font-medium text-dash-text-faded">
                {DAYS[dayIdx]}
              </span>
              {row.map((value, hourIdx) => (
                <div
                  key={hourIdx}
                  title={`${DAYS[dayIdx]} ${String(hourIdx).padStart(2, "0")}:00 — ${value} pageview${value === 1 ? "" : "s"}`}
                  className="h-5 rounded-[2px]"
                  style={{ backgroundColor: cellColor(value, max, isDark) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
