import { BranchSubmissionState, ReportStatus } from "@repo/types";
import { Badge } from "@/components/ui/badge";

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.SUBMITTED]: "Submitted",
  [ReportStatus.ZONE_REVIEWED]: "Zone reviewed",
  [ReportStatus.STATE_REVIEWED]: "State reviewed",
  [ReportStatus.HQ_REVIEWED]: "HQ reviewed",
};

const REPORT_STATUS_VARIANT: Record<
  ReportStatus,
  "warning" | "success" | "secondary" | "default"
> = {
  [ReportStatus.SUBMITTED]: "warning",
  [ReportStatus.ZONE_REVIEWED]: "success",
  [ReportStatus.STATE_REVIEWED]: "secondary",
  [ReportStatus.HQ_REVIEWED]: "default",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={REPORT_STATUS_VARIANT[status]}>{REPORT_STATUS_LABELS[status]}</Badge>;
}

export function SubmissionStateBadge({
  submissionState,
  reportStatus,
}: {
  submissionState: BranchSubmissionState;
  reportStatus?: ReportStatus | null;
}) {
  if (submissionState === "MISSED") {
    return <Badge variant="destructive">Missed</Badge>;
  }
  if (submissionState === "PENDING") {
    return <Badge variant="muted">Pending</Badge>;
  }
  if (reportStatus) {
    return <ReportStatusBadge status={reportStatus} />;
  }
  return <Badge variant="success">Submitted</Badge>;
}
