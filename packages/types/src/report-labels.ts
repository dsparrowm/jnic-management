import type { BranchSubmissionState } from "./week";
import type { ZoneReportBranchRow } from "./reports";

export function reportStatusLabel(status: string): string {
  if (status === "SUBMITTED") return "Sent";
  if (status === "ZONE_REVIEWED") return "With zonal pastor";
  if (status === "STATE_REVIEWED") return "With state pastor";
  if (status === "HQ_REVIEWED") return "With HQ";
  return status.replace(/_/g, " ").toLowerCase();
}

export function submissionLabel(state: BranchSubmissionState): string {
  if (state === "SUBMITTED") return "Sent";
  if (state === "PENDING") return "Waiting";
  if (state === "MISSED") return "Late";
  return state;
}

export function rollupLabel(status: string): string {
  if (status === "FORWARDED") return "Sent upstream";
  if (status === "STALE") return "Needs re-forward";
  if (status === "IN_REVIEW") return "In review";
  return status.replace(/_/g, " ").toLowerCase();
}

export function sortBranchesForReview(
  branches: ZoneReportBranchRow[],
): ZoneReportBranchRow[] {
  const rank = (row: ZoneReportBranchRow) => {
    if (row.missed || row.submissionState === "MISSED") return 0;
    if (row.submissionState === "PENDING") return 1;
    return 2;
  };
  return [...branches].sort((left, right) => {
    const delta = rank(left) - rank(right);
    if (delta !== 0) return delta;
    return left.branch.name.localeCompare(right.branch.name);
  });
}

export function outstandingBranches(branches: ZoneReportBranchRow[]): ZoneReportBranchRow[] {
  return sortBranchesForReview(branches).filter(
    (row) => row.missed || row.submissionState !== "SUBMITTED",
  );
}
