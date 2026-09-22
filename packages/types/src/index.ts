export { Role } from "./role";
import { Role } from "./role";

/** Roles assignable via admin pastor onboarding (excludes ADMIN and LEAD_PASTOR) */
export const ONBOARDABLE_ROLES: Role[] = [
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.BRANCH_PASTOR,
];

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  DEACTIVATED = "DEACTIVATED",
}

export enum OrgChangeType {
  CREATE_STATE = "CREATE_STATE",
  CREATE_ZONE = "CREATE_ZONE",
}

export enum OrgChangeStatus {
  PENDING_LP_APPROVAL = "PENDING_LP_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum ReportStatus {
  SUBMITTED = "SUBMITTED",
  ZONE_REVIEWED = "ZONE_REVIEWED",
  STATE_REVIEWED = "STATE_REVIEWED",
  HQ_REVIEWED = "HQ_REVIEWED",
}

export enum SummaryScopeType {
  BRANCH = "BRANCH",
  ZONE = "ZONE",
  STATE = "STATE",
  HQ = "HQ",
}

export enum RollupStatus {
  IN_REVIEW = "IN_REVIEW",
  FORWARDED = "FORWARDED",
  STALE = "STALE",
}

export enum MonthlySummaryStatus {
  PENDING = "PENDING",
  PENDING_LP_APPROVAL = "PENDING_LP_APPROVAL",
  APPROVED = "APPROVED",
}

export enum NotificationType {
  FEEDBACK_RECEIVED = "FEEDBACK_RECEIVED",
  ONBOARDING = "ONBOARDING",
  REPORT_MISSED = "REPORT_MISSED",
  SUMMARY_APPROVED = "SUMMARY_APPROVED",
  ROLLUP_FORWARDED = "ROLLUP_FORWARDED",
}

export { ConversationType, ChatReceiptStatus } from "./chat";
export type {
  ChatInboxResponse,
  ChatMessagePreview,
  ChatMessageRecord,
  ChatMessagesResponse,
  ChatParticipantPreview,
  ChatReceiptUpdate,
  ConversationListItem,
} from "./chat";

/** API health check response */
export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export {
  REPORT_TIMEZONE,
  computeWeekOf,
  formatReportDate,
  formatWeekChartLabel,
  formatWeekEndingLabel,
  getBranchSubmissionState,
  getSubmissionDeadlineUtc,
  getTodayInLagos,
  isSubmissionDeadlinePassed,
  listWeekRange,
  parseReportDate,
  shiftWeekOf,
} from "./week";
export type { BranchSubmissionState } from "./week";
export {
  allowsOptionalBranch,
  canSubmitWeeklyReports,
  requiresBranchId,
  requiresStateId,
  requiresZoneId,
  validateOrgAssignmentStructure,
  WEEKLY_REPORT_SUBMITTER_ROLES,
} from "./org-assignment";
export type { OrgAssignmentInput, ResolvedOrgAssignment } from "./org-assignment";
export { NIGERIAN_STATES } from "./nigerian-states";
export type { NigerianStateName } from "./nigerian-states";
export type {
  HqDashboardResponse,
  HqHomeAttendancePoint,
  HqHomeNotification,
  HqHomeTask,
  HqHomeTaskKind,
  HqHomeTaskSeverity,
  PastorDashboardResponse,
  PastorHomeAttendancePoint,
  PastorHomeMonthSnapshot,
  PastorHomeWeekReport,
  PastorHomeWeekSnapshot,
} from "./mobile-home";
export {
  outstandingBranches,
  reportStatusLabel,
  rollupLabel,
  sortBranchesForReview,
  submissionLabel,
} from "./report-labels";
export {
  canLeaveFeedback,
  canReplyToFeedback,
} from "./reports";
export type {
  CreateFeedbackInput,
  BranchGrowthRow,
  FeedbackListResponse,
  FeedbackRecord,
  GrowthMetric,
  NationalGrowthResponse,
  StateGrowthResponse,
  StateGrowthRow,
  StateSummaryResponse,
  StateZoneSummary,
  WeeklyReportAttendance,
  WeeklyReportFinance,
  WeeklyReportRecord,
  ZoneReportBranchRow,
  ZoneSummaryResponse,
} from "./reports";
