"use client";

import { ZoneReportBranchRow } from "@/lib/api";
import { ZoneReportsTable } from "@/components/reports/zone-reports-table";

interface ZoneReportsSectionProps {
  zoneName: string;
  branches: ZoneReportBranchRow[];
  summary: { submitted: number; missed: number; pending: number; total: number };
  onViewReport: (reportId: string) => void;
}

export function ZoneReportsSection({
  zoneName,
  branches,
  summary,
  onViewReport,
}: ZoneReportsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{zoneName}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.submitted} submitted · {summary.pending} pending · {summary.missed} missed
          </p>
        </div>
      </div>
      <ZoneReportsTable branches={branches} onViewReport={onViewReport} />
    </section>
  );
}
