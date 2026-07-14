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

function attendanceTotal(totals: {
  adult: number;
  teenage: number;
  children: number;
}): number {
  return totals.adult + totals.teenage + totals.children;
}

interface MonthlySummaryCardProps {
  summary: MonthlySummaryItem;
}

export function MonthlySummaryCard({ summary }: MonthlySummaryCardProps) {
  const monthLabel = `${MONTH_NAMES[summary.month - 1]} ${summary.year}`;
  const isNational = summary.scopeType === "HQ";
  const stateBreakdown = summary.stateBreakdown ?? [];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{summary.scopeName}</h2>
          <p className="text-sm text-muted-foreground">
            {monthLabel} · {statusLabel(summary.status)}
          </p>
          {isNational ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              National total aggregated from every branch weekly report submitted in{" "}
              {monthLabel}.
            </p>
          ) : null}
        </div>
      </div>

      <ReportTotalsCard
        title={isNational ? "National monthly totals" : "Monthly totals"}
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

      {isNational && stateBreakdown.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">By state</h3>
            <p className="text-xs text-muted-foreground">
              Monthly attendance and finance rolled up from branch weekly reports in each
              state.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Branches</th>
                  <th className="px-4 py-3 font-medium">Attendance</th>
                  <th className="px-4 py-3 font-medium">Tithe</th>
                  <th className="px-4 py-3 font-medium">Offering</th>
                  <th className="px-4 py-3 font-medium">Other</th>
                </tr>
              </thead>
              <tbody>
                {stateBreakdown.map((state) => (
                  <tr key={state.stateId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{state.stateName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {state.branchesReporting} of {state.branchesTotal}
                      <span className="block text-xs">
                        {state.weeklyReports} weekly report
                        {state.weeklyReports === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {attendanceTotal(state.totals)}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatNaira(state.totals.tithe, state.totals.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatNaira(state.totals.offering, state.totals.currency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {formatNaira(state.totals.other, state.totals.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {summary.weeks.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Weekly breakdown</h3>
            <p className="text-xs text-muted-foreground">
              {isNational
                ? "Each row sums all branch reports for that week nationally."
                : "Totals for each week in this scope."}
            </p>
          </div>
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
                      {attendanceTotal(week)}
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
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No weekly reports in this month.</p>
      )}
    </div>
  );
}
