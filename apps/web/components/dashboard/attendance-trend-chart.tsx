"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import {
  CHART_PALETTE,
  chartAxisProps,
  chartGridProps,
  chartTooltipStyle,
} from "@/components/charts/chart-theme";
import { NationalAttendanceTrendPoint } from "@/lib/api";

interface AttendanceTrendChartProps {
  data: NationalAttendanceTrendPoint[];
  weeks: number;
}

interface AttendanceTooltipPayload {
  color: string;
  dataKey: string;
  value: number;
}

function AttendanceTooltip({
  active,
  payload,
  label,
  breakdownBySeries,
}: {
  active?: boolean;
  payload?: ReadonlyArray<AttendanceTooltipPayload>;
  label?: string;
  breakdownBySeries: Map<string, { adult: number; teenage: number; children: number }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div style={chartTooltipStyle} className="px-3 py-2">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      <ul className="space-y-1.5">
        {payload
          .filter((entry) => entry.value > 0)
          .map((entry) => {
            const breakdown = breakdownBySeries.get(String(entry.dataKey));
            return (
              <li key={entry.dataKey} className="text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{entry.dataKey}</span>
                  <span className="font-mono font-medium text-foreground">{entry.value}</span>
                </div>
                {breakdown && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Adults {breakdown.adult} · Teens {breakdown.teenage} · Children{" "}
                    {breakdown.children}
                  </p>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function pickSeriesNames(data: NationalAttendanceTrendPoint[]): string[] {
  const totals = new Map<string, number>();

  for (const point of data) {
    for (const state of point.byState) {
      totals.set(state.stateName, (totals.get(state.stateName) ?? 0) + state.total);
    }
  }

  const ranked = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  if (ranked.length <= 8) {
    return ranked;
  }

  return [...ranked.slice(0, 6), "Others"];
}

export function AttendanceTrendChart({ data, weeks }: AttendanceTrendChartProps) {
  const seriesNames = useMemo(() => pickSeriesNames(data), [data]);

  const { chartData, breakdownByWeekAndSeries, hasData } = useMemo(() => {
    const breakdown = new Map<string, Map<string, { adult: number; teenage: number; children: number }>>();
    const topNames = seriesNames.filter((name) => name !== "Others");
    const rows = data.map((point) => {
      const row: Record<string, string | number> = {
        weekLabel: point.weekLabel,
      };
      const weekBreakdown = new Map<string, { adult: number; teenage: number; children: number }>();

      let othersTotal = 0;
      let othersAdult = 0;
      let othersTeenage = 0;
      let othersChildren = 0;

      for (const state of point.byState) {
        const isTop = topNames.includes(state.stateName);
        if (isTop) {
          row[state.stateName] = state.total;
          weekBreakdown.set(state.stateName, {
            adult: state.adultCount,
            teenage: state.teenageCount,
            children: state.childrenCount,
          });
        } else if (seriesNames.includes("Others")) {
          othersTotal += state.total;
          othersAdult += state.adultCount;
          othersTeenage += state.teenageCount;
          othersChildren += state.childrenCount;
        }
      }

      if (seriesNames.includes("Others")) {
        row.Others = othersTotal;
        if (othersTotal > 0) {
          weekBreakdown.set("Others", {
            adult: othersAdult,
            teenage: othersTeenage,
            children: othersChildren,
          });
        }
      }

      breakdown.set(point.weekLabel, weekBreakdown);
      return row;
    });

    const anyData = rows.some((row) =>
      seriesNames.some((name) => typeof row[name] === "number" && (row[name] as number) > 0),
    );

    return { chartData: rows, breakdownByWeekAndSeries: breakdown, hasData: anyData };
  }, [data, seriesNames]);

  return (
    <DashboardPanel
      title="Attendance trend"
      description={`Last ${weeks} weeks · total attendance by state`}
      actionHref="/reports/national"
      actionLabel="National reports"
    >
      {!hasData ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No attendance data for this period.
        </p>
      ) : (
        <div className="h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="weekLabel" {...chartAxisProps} />
              <YAxis {...chartAxisProps} />
              <Tooltip
                content={({ active, payload, label }) => {
                  const breakdownBySeries =
                    breakdownByWeekAndSeries.get(String(label)) ??
                    new Map<string, { adult: number; teenage: number; children: number }>();
                  return (
                    <AttendanceTooltip
                      active={active}
                      payload={payload as ReadonlyArray<AttendanceTooltipPayload> | undefined}
                      label={label as string | undefined}
                      breakdownBySeries={breakdownBySeries}
                    />
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {seriesNames.map((name, index) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={CHART_PALETTE[index % CHART_PALETTE.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardPanel>
  );
}
