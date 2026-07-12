/** Platform roles — single source of truth for web and API */
export enum Role {
  LEAD_PASTOR = "LEAD_PASTOR",
  ADMIN = "ADMIN",
  STATE_PASTOR = "STATE_PASTOR",
  ZONAL_PASTOR = "ZONAL_PASTOR",
  BRANCH_PASTOR = "BRANCH_PASTOR",
  ADMIN_STAFF = "ADMIN_STAFF",
}

/** Roles assignable via admin pastor onboarding (excludes ADMIN and LEAD_PASTOR) */
export const ONBOARDABLE_ROLES: Role[] = [
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.BRANCH_PASTOR,
  Role.ADMIN_STAFF,
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
}

/** API health check response */
export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}
