"use client";

import { ReportTotalsCard } from "@/components/reports/report-totals-card";
import { MonthlySummaryItem } from "@/lib/api";
import { formatNaira } from "@/lib/format";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function statusLabel(status: string): string {
  if (status === "APPROVED") return "Approved";
  if (status === "PENDING_LP_APPROVAL") return "Pending Lead Pastor approval";
  return "Pending";
}

interface MonthlySummaryCardProps {
  summary: MonthlySummaryItem;
}

export function MonthlySummaryCard({ summary }: MonthlySummaryCardProps) {
  const monthLabel = `${MONTH_NAMES[summary.month - 1]} ${summary.year}`;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{summary.scopeName}</h2>
          <p className="text-sm text-muted-foreground">
            {monthLabel} · {statusLabel(summary.status)}
          </p>
        </div>
      </div>

      <ReportTotalsCard
        title="Monthly totals"
        attendance={{
          adultCount: summary.totals.adult,
          teenageCount: summary.totals.teenage,
          childrenCount: summary.totals.children,
        }}
        finance={{
          tithe: summary.totals.tithe,
          offering: summary.totals.offering,
          other: summary.totals.other,
          currency: summary.totals.currency,
        }}
      />

      {summary.weeks.length > 0 ? (
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {week.adult + week.teenage + week.children}
                  </td>
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
      ) : (
        <p className="text-sm text-muted-foreground">No weekly reports in this month.</p>
      )}
    </div>
  );
}
