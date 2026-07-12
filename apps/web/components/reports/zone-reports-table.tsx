"use client";

import { ZoneReportBranchRow } from "@/lib/api";
import { SubmissionStateBadge } from "@/components/reports/report-status-badge";
import { Button } from "@/components/ui/button";

interface ZoneReportsTableProps {
  branches: ZoneReportBranchRow[];
  onViewReport: (reportId: string) => void;
}

function totalAttendance(row: ZoneReportBranchRow): number {
  if (!row.report?.attendance) return 0;
  const { adultCount, teenageCount, childrenCount } = row.report.attendance;
  return adultCount + teenageCount + childrenCount;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ZoneReportsTable({ branches, onViewReport }: ZoneReportsTableProps) {
  if (branches.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-muted-foreground">
        No branches in this zone.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Branch</th>
            <th className="px-3 py-3 text-right font-medium">Attendance</th>
            <th className="px-3 py-3 text-right font-medium">Tithe</th>
            <th className="px-3 py-3 text-left font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {branches.map((row) => {
            const currency = row.report?.finance?.currency ?? "NGN";
            return (
              <tr key={row.branch.id} className="hover:bg-muted/30">
                <td className="px-5 py-3 font-medium text-foreground">{row.branch.name}</td>
                <td className="px-3 py-3 text-right font-mono">
                  {row.report ? totalAttendance(row) : "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {row.report?.finance
                    ? formatMoney(row.report.finance.tithe, currency)
                    : "—"}
                </td>
                <td className="px-3 py-3">
                  <SubmissionStateBadge
                    submissionState={row.submissionState}
                    reportStatus={row.report?.status}
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  {row.report ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewReport(row.report!.id)}
                    >
                      View
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
