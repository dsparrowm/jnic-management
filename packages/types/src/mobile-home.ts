import type { BranchSubmissionState, NotificationType, ReportStatus } from "./index";
import type { Role } from "./role";
import type {
  StateSummaryResponse,
  WeeklyReportAttendance,
  WeeklyReportFinance,
  ZoneSummaryResponse,
} from "./reports";

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

export type PastorHomeAttendancePoint = {
  weekOf: string;
  weekLabel: string;
  total: number;
  adultCount: number;
  teenageCount: number;
  childrenCount: number;
};

export type PastorHomeWeekReport = {
  id: string;
  status: ReportStatus;
  editable: boolean;
  attendance: WeeklyReportAttendance | null;
  finance: WeeklyReportFinance | null;
};

export type PastorHomeWeekSnapshot = {
  weekOf: string;
  weekLabel: string;
  report: PastorHomeWeekReport | null;
  submissionState: BranchSubmissionState;
};

export type PastorHomeMonthSnapshot = {
  month: number;
  year: number;
  label: string;
  weeksReported: number;
  weeksExpected: number;
  totals: {
    adult: number;
    teenage: number;
    children: number;
    tithe: number;
    offering: number;
    other: number;
    currency: string;
  };
};

export type PastorDashboardResponse = {
  generatedAt: string;
  role: Role.BRANCH_PASTOR | Role.ZONAL_PASTOR | Role.STATE_PASTOR;
  branch: {
    id: string;
    name: string;
    zoneName: string | null;
    stateName: string | null;
  } | null;
  thisWeek: PastorHomeWeekSnapshot;
  attendanceTrend: PastorHomeAttendancePoint[];
  month: PastorHomeMonthSnapshot | null;
  zone: ZoneSummaryResponse | null;
  zoneAttendanceTrend: PastorHomeAttendancePoint[];
  zoneMonth: PastorHomeMonthSnapshot | null;
  state: StateSummaryResponse | null;
  stateAttendanceTrend: PastorHomeAttendancePoint[];
  stateMonth: PastorHomeMonthSnapshot | null;
  recentActivity: {
    unreadCount: number;
    items: HqHomeNotification[];
  };
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
