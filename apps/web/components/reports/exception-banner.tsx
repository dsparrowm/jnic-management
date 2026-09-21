"use client";

import { outstandingBranches, type ZoneReportBranchRow } from "@repo/types";

export function ExceptionBanner({
  branches,
  onViewReport,
}: {
  branches: ZoneReportBranchRow[];
  onViewReport: (reportId: string) => void;
}) {
  const rows = outstandingBranches(branches);
  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
      <p className="text-sm font-semibold text-amber-950">Needs attention</p>
      <p className="mt-1 text-sm text-amber-900">
        {rows.length === 1
          ? "1 branch has not sent this week."
          : `${rows.length} branches have not sent this week.`}
      </p>
      <ul className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <li key={row.branch.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-amber-950">{row.branch.name}</span>
            {row.report ? (
              <button
                type="button"
                className="text-amber-900 underline-offset-2 hover:underline"
                onClick={() => onViewReport(row.report!.id)}
              >
                {row.missed ? "Late" : "Waiting"}
              </button>
            ) : (
              <span className="text-amber-800">{row.missed ? "Late" : "Waiting"}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
