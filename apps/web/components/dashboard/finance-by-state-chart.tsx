"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import {
  CHART_COLORS,
  chartAxisProps,
  chartGridProps,
  chartTooltipStyle,
} from "@/components/charts/chart-theme";
import { NationalFinanceByState } from "@/lib/api";
import { formatNaira, formatNairaCompact } from "@/lib/format";

interface FinanceByStateChartProps {
  data: NationalFinanceByState[];
  weekLabel: string;
}

function FinanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div style={chartTooltipStyle} className="px-3 py-2">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-mono text-foreground">{formatNaira(entry.value)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-border pt-2 text-xs font-medium text-foreground">
        Total {formatNaira(total)}
      </p>
    </div>
  );
}

export function FinanceByStateChart({ data, weekLabel }: FinanceByStateChartProps) {
  const chartData = useMemo(
    () =>
      [...data]
        .filter((row) => row.total > 0 || row.branchesSubmitted > 0)
        .sort((a, b) => b.total - a.total)
        .map((row) => ({
          state: row.stateName,
          tithe: row.tithe,
          offering: row.offering,
          other: row.other,
          total: row.total,
          branchesSubmitted: row.branchesSubmitted,
          branchesTotal: row.branchesTotal,
          currency: row.currency,
        })),
    [data],
  );

  const tableRows = useMemo(
    () => [...data].sort((a, b) => b.total - a.total),
    [data],
  );

  const hasFinance = chartData.some((row) => row.total > 0);

  return (
    <DashboardPanel
      title="Finance by state"
      description={`Week ending ${weekLabel} · Tithe · Offering · Other`}
      actionHref="/reports/national"
      actionLabel="National reports"
    >
      {!hasFinance ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No submitted finance for this week.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 8, bottom: 0 }}
              >
                <CartesianGrid {...chartGridProps} horizontal={false} vertical />
                <XAxis
                  type="number"
                  {...chartAxisProps}
                  tickFormatter={(value) => formatNairaCompact(Number(value))}
                />
                <YAxis
                  type="category"
                  dataKey="state"
                  {...chartAxisProps}
                  width={88}
                />
                <Tooltip content={<FinanceTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="tithe"
                  name="Tithe"
                  stackId="finance"
                  fill={CHART_COLORS.gold}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="offering"
                  name="Offering"
                  stackId="finance"
                  fill={CHART_COLORS.navy}
                />
                <Bar
                  dataKey="other"
                  name="Other"
                  stackId="finance"
                  fill={CHART_COLORS.info}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Branches</th>
                  <th className="px-4 py-3 font-medium">Tithe</th>
                  <th className="px-4 py-3 font-medium">Offering</th>
                  <th className="px-4 py-3 font-medium">Other</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.stateId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{row.stateName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.branchesSubmitted}/{row.branchesTotal}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatNaira(row.tithe, row.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatNaira(row.offering, row.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatNaira(row.other, row.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                      {formatNaira(row.total, row.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
