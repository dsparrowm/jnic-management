export { Role, HQ_PASTOR_ROLES, isHqPastor } from "./role";
import { Role } from "./role";

/** Roles assignable via admin pastor onboarding (excludes SENIOR_PASTOR and ADMIN) */
export const ONBOARDABLE_ROLES: Role[] = [
  Role.RESIDENT_PASTOR,
  Role.REGIONAL_PASTOR,
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.DISTRICT_PASTOR,
  Role.BRANCH_PASTOR,
];

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  DEACTIVATED = "DEACTIVATED",
}

export enum DirectorateOffice {
  DIRECTOR = "DIRECTOR",
  DEPUTY_DIRECTOR = "DEPUTY_DIRECTOR",
  SECRETARY = "SECRETARY",
  DESK_HEAD = "DESK_HEAD",
  DEPUTY_DESK_HEAD = "DEPUTY_DESK_HEAD",
  REGIONAL_COORDINATOR = "REGIONAL_COORDINATOR",
  MEMBER = "MEMBER",
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
  DISTRICT_REVIEWED = "DISTRICT_REVIEWED",
  ZONE_REVIEWED = "ZONE_REVIEWED",
  STATE_REVIEWED = "STATE_REVIEWED",
  REGIONAL_REVIEWED = "REGIONAL_REVIEWED",
  HQ_REVIEWED = "HQ_REVIEWED",
}

export enum SummaryScopeType {
  BRANCH = "BRANCH",
  DISTRICT = "DISTRICT",
  ZONE = "ZONE",
  STATE = "STATE",
  REGION = "REGION",
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
  RETURNED = "RETURNED",
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
  listDaysOfWeek,
  listWeekRange,
  parseReportDate,
  shiftWeekOf,
} from "./week";
export type { BranchSubmissionState } from "./week";
export {
  allowsOptionalBranch,
  canSubmitWeeklyReports,
  requiresBranchId,
  requiresDistrictId,
  requiresRegionId,
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
  isZeroWeeklyTotals,
  NO_SERVICE_NOTE_MAX,
  NO_SERVICE_NOTE_MIN,
  resolveNoServiceNote,
} from "./reports";
export type {
  CreateFeedbackInput,
  BranchGrowthRow,
  FeedbackListResponse,
  FeedbackRecord,
  GrowthMetric,
  NationalGrowthResponse,
  NotificationListResponse,
  NotificationRecord,
  ReportCountSummary,
  StateGrowthResponse,
  StateGrowthRow,
  DistrictSummaryResponse,
  RegionStateSummary,
  RegionSummaryResponse,
  StateSummaryResponse,
  StateZoneSummary,
  WeeklyReportAttendance,
  WeeklyReportFinance,
  WeeklyReportInput,
  WeeklyReportListResponse,
  WeeklyReportRecord,
  ZoneReportBranchRow,
  ZoneSummaryResponse,
  RollupInfo,
  NationalStateSummary,
  NationalSummaryResponse,
} from "./reports";
