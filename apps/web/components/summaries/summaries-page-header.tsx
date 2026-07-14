"use client";

import { MonthlySummaryItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatSummaryPeriod } from "@/components/summaries/summaries-shared";

function statusBadge(status: string) {
  if (status === "APPROVED") {
    return {
      label: "Approved",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (status === "PENDING_LP_APPROVAL") {
    return {
      label: "Pending Lead Pastor approval",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    label: "Pending",
    className: "border-border bg-muted text-muted-foreground",
  };
}

function SummaryChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-border bg-background px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>{" "}
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

interface SummariesPageHeaderProps {
  summary: MonthlySummaryItem;
}

export function SummariesPageHeader({ summary }: SummariesPageHeaderProps) {
  const monthLabel = formatSummaryPeriod(summary.month, summary.year);
  const badge = statusBadge(summary.status);
  const showApprovalBadge = summary.scopeType === "HQ";

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Monthly summaries
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">{summary.scopeName}</h2>
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
              {monthLabel}
            </span>
            {showApprovalBadge && (
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            )}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Aggregated from branch weekly reports in {monthLabel}. Includes all submitted
            reports for the month.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <SummaryChip
              label="Branches reporting"
              value={`${summary.coverage.branchesReporting} of ${summary.coverage.branchesTotal}`}
            />
            <SummaryChip label="Weekly reports" value={summary.coverage.weeklyReports} />
          </div>
        </div>
      </div>
    </div>
  );
}
