"use client";

import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { attendanceTotal } from "@/components/summaries/summaries-shared";
import { MonthlySummaryItem } from "@/lib/api";
import { formatNaira } from "@/lib/format";

interface SummariesWeeklyTabProps {
  summary: MonthlySummaryItem;
}

export function SummariesWeeklyTab({ summary }: SummariesWeeklyTabProps) {
  const isNational = summary.scopeType === "HQ";

  if (summary.weeks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        No weekly reports in this period for the selected scope.
      </p>
    );
  }

  return (
    <DashboardPanel
      title="Weekly breakdown"
      description={
        isNational
          ? "Each row sums all branch reports for that week nationally."
          : "Totals for each week in the selected scope."
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Week ending</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Tithe</th>
              <th className="px-4 py-3 font-medium">Offering</th>
              <th className="px-4 py-3 font-medium">Other</th>
            </tr>
          </thead>
          <tbody>
            {summary.weeks.map((week) => (
              <tr key={week.weekOf} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{week.weekLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">{attendanceTotal(week)}</td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {formatNaira(week.tithe, week.currency)}
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {formatNaira(week.offering, week.currency)}
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {formatNaira(week.other, week.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
