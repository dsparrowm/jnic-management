import type { NotificationType } from "./index";
import type { Role } from "./role";

export type HqHomeTaskKind =
  | "PENDING_ONBOARDING"
  | "MISSED_REPORTS"
  | "PENDING_SUMMARY_APPROVALS";

export type HqHomeTaskSeverity = "INFO" | "WARNING" | "URGENT";

export type HqHomeTask = {
  kind: HqHomeTaskKind;
  title: string;
  description: string;
  count: number;
  severity: HqHomeTaskSeverity;
};

export type HqHomeNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type HqHomeAttendancePoint = {
  weekOf: string;
  weekLabel: string;
  total: number;
};

export type HqDashboardResponse = {
  generatedAt: string;
  role: Role.ADMIN | Role.LEAD_PASTOR;
  weekOf: string;
  weekLabel: string;
  org: {
    states: number;
    zones: number;
    branches: number;
  };
  pastors?: {
    active: number;
    pending: number;
    deactivated: number;
  };
  weeklyReporting: {
    submitted: number;
    missed: number;
    pending: number;
    total: number;
    attendance: {
      adultCount: number;
      teenageCount: number;
      childrenCount: number;
      total: number;
    };
    finance: {
      tithe: number;
      offering: number;
      other: number;
      total: number;
      currency: string;
    };
  };
  pendingSummaryApprovals: number;
  attendanceTrend: HqHomeAttendancePoint[];
  tasks: HqHomeTask[];
  recentActivity: {
    unreadCount: number;
    items: HqHomeNotification[];
  };
};
