import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatYTick } from "@/utils/observability";

export function TimeSeriesChart({
  data: rawData,
  yUnit = "",
  label = "",
}: {
  data: { time: string; value: number }[];
  yUnit?: string;
  label?: string;
}) {
  const chartData = useMemo(() => {
    return rawData
      .filter((d) => d.value != null && d.value > 0)
      .map((d) => ({
        date: d.time,
        value: d.value,
      }));
  }, [rawData]);

  const domain = useMemo((): [number, number] => {
    if (chartData.length === 0) {
      if (yUnit === "%") return [0, 100];
      return [0, 1000];
    }

    const values = chartData.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.1 || (yUnit === "%" ? 5 : 100);

    return [
      Math.max(0, minVal - padding),
      yUnit === "%" ? Math.min(maxVal + padding, 100) : maxVal + padding,
    ];
  }, [chartData, yUnit]);

  const tickInterval = useMemo(() => {
    return Math.max(0, Math.floor((chartData.length || 0) / 12) - 1);
  }, [chartData.length]);

  const formatTooltipValue = (value: number): string => {
    if (yUnit === "%") return `${value.toFixed(2)}%`;
    if (yUnit === "ms") {
      if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
      return `${value.toFixed(2)}ms`;
    }
    if (yUnit === "KB/s") {
      if (value >= 1024) return `${(value / 1024).toFixed(2)} MB/s`;
      return `${value.toFixed(2)} KB/s`;
    }
    return `${value.toFixed(2)}`;
  };

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={338} minWidth={0} minHeight={1}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-dash-border-soft)"
          strokeOpacity={0.6}
          vertical={false}
          horizontal
        />
        <XAxis
          dataKey="date"
          stroke="var(--color-dash-text-extra-faded)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dy={8}
          interval={tickInterval}
        />
        <YAxis
          stroke="var(--color-dash-text-extra-faded)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dx={-4}
          domain={domain}
          tickFormatter={(v: number) => formatYTick(v, yUnit)}
        />
        <Tooltip
          content={({ active, payload, label: tooltipLabel }) => {
            if (!active || !payload?.length) return null;
            const value = payload[0].value as number;
            return (
              <div className="rounded-md border border-[#141414] bg-gradient-to-b from-[#434343] to-[#232323] px-3 py-2 shadow-[0px_2px_4px_rgba(0,0,0,0.18),inset_0px_1px_0px_rgba(255,255,255,0.18)]">
                <p className="text-[10px] leading-4 text-white/60">
                  {tooltipLabel}
                </p>
                <p className="text-xs font-medium leading-4 text-white">
                  {formatTooltipValue(value)}{label ? ` ${label}` : ""}
                </p>
              </div>
            );
          }}
          cursor={{ fill: "var(--color-dash-border-soft)", opacity: 0.3 }}
        />
        <Bar
          dataKey="value"
          fill="#ff7a00"
          opacity={0.4}
          activeBar={{ opacity: 1 }}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
