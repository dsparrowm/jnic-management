"use client";

import { ZoneReportBranchRow } from "@/lib/api";
import { ZoneReportsTable } from "@/components/reports/zone-reports-table";
import { RollupStatusBadge } from "@/components/reports/rollup-status-badge";

interface ZoneReportsSectionProps {
  zoneName: string;
  branches: ZoneReportBranchRow[];
  summary: { submitted: number; missed: number; pending: number; total: number };
  forwarded?: boolean;
  rollup?: { status: "IN_REVIEW" | "FORWARDED" | "STALE"; version: number; forwardedAt: string | null };
  onViewReport: (reportId: string) => void;
}

export function ZoneReportsSection({
  zoneName,
  branches,
  summary,
  forwarded = true,
  rollup,
  onViewReport,
}: ZoneReportsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{zoneName}</h2>
            {rollup && <RollupStatusBadge rollup={rollup} />}
          </div>
          {forwarded ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.submitted} submitted · {summary.pending} pending · {summary.missed} missed
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Awaiting zone forward — branch details will appear once the zonal pastor sends this
              zone report.
            </p>
          )}
        </div>
      </div>
      {forwarded ? (
        <ZoneReportsTable branches={branches} onViewReport={onViewReport} />
      ) : (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          Zone report not yet forwarded to state.
        </p>
      )}
    </section>
  );
}
