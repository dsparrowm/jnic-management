"use client";

import {
  BranchSubmissionState,
  ReportStatus,
  reportStatusLabel,
  submissionLabel,
} from "@repo/types";
import { Badge } from "@/components/ui/badge";

const REPORT_STATUS_VARIANT: Record<
  ReportStatus,
  "warning" | "success" | "secondary" | "default"
> = {
  [ReportStatus.SUBMITTED]: "success",
  [ReportStatus.ZONE_REVIEWED]: "secondary",
  [ReportStatus.STATE_REVIEWED]: "secondary",
  [ReportStatus.HQ_REVIEWED]: "default",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={REPORT_STATUS_VARIANT[status]}>{reportStatusLabel(status)}</Badge>;
}

export function SubmissionStateBadge({
  submissionState,
  reportStatus,
}: {
  submissionState: BranchSubmissionState;
  reportStatus?: ReportStatus | null;
}) {
  if (submissionState === "MISSED") {
    return <Badge variant="destructive">{submissionLabel("MISSED")}</Badge>;
  }
  if (submissionState === "PENDING") {
    return <Badge variant="muted">{submissionLabel("PENDING")}</Badge>;
  }
  if (reportStatus) {
    return <ReportStatusBadge status={reportStatus} />;
  }
  return <Badge variant="success">{submissionLabel("SUBMITTED")}</Badge>;
}
