import { Role } from "./role";
import type { ReportStatus, RollupStatus } from "./index";
import type { BranchSubmissionState } from "./week";

export type WeeklyReportAttendance = {
  adultCount: number;
  teenageCount: number;
  childrenCount: number;
};

export type WeeklyReportFinance = {
  tithe: number;
  offering: number;
  other: number;
  currency: string;
};

export type WeeklyReportRecord = {
  id: string;
  branchId: string;
  serviceDate: string;
  weekOf: string;
  status: ReportStatus;
  submittedById: string;
  branch: { id: string; name: string };
  submittedBy: { id: string; name: string; email: string };
  attendance: WeeklyReportAttendance | null;
  finance: WeeklyReportFinance | null;
  /** Present when the branch marked no service (zeros) for the week. */
  noServiceNote: string | null;
  editable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyReportListResponse = {
  items: WeeklyReportRecord[];
  total: number;
  page: number;
  perPage: number;
};

export type WeeklyReportInput = {
  serviceDate: string;
  adultCount: number;
  teenageCount: number;
  childrenCount: number;
  tithe: number;
  offering: number;
  other: number;
  currency?: string;
  /** Required when all attendance and finance fields are zero. */
  noServiceNote?: string | null;
};

export const NO_SERVICE_NOTE_MIN = 3;
export const NO_SERVICE_NOTE_MAX = 500;

export function isZeroWeeklyTotals(input: {
  adultCount: number;
  teenageCount: number;
  childrenCount: number;
  tithe: number;
  offering: number;
  other: number;
}): boolean {
  return (
    input.adultCount +
      input.teenageCount +
      input.childrenCount +
      input.tithe +
      input.offering +
      input.other ===
    0
  );
}

/** Normalize note for persistence; returns null when the week had a service. */
export function resolveNoServiceNote(
  totals: {
    adultCount: number;
    teenageCount: number;
    childrenCount: number;
    tithe: number;
    offering: number;
    other: number;
  },
  note: string | null | undefined,
): { note: string | null; error: string | null } {
  if (!isZeroWeeklyTotals(totals)) {
    return { note: null, error: null };
  }
  const trimmed = note?.trim() ?? "";
  if (trimmed.length < NO_SERVICE_NOTE_MIN) {
    return {
      note: null,
      error: "Explain why there was no service this week (at least a few words).",
    };
  }
  if (trimmed.length > NO_SERVICE_NOTE_MAX) {
    return {
      note: null,
      error: `Keep the no-service note under ${NO_SERVICE_NOTE_MAX} characters.`,
    };
  }
  return { note: trimmed, error: null };
}

export type ZoneReportBranchRow = {
  branch: { id: string; name: string };
  report: WeeklyReportRecord | null;
  submissionState: BranchSubmissionState;
  missed: boolean;
};

export type ReportCountSummary = {
  total: number;
  submitted: number;
  missed: number;
  pending: number;
};

export type RollupInfo = {
  status: RollupStatus;
  version: number;
  forwardedAt: string | null;
};

export type ZoneSummaryResponse = {
  weekOf: string;
  zone: { id: string; name: string };
  rollup: RollupInfo;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  branches: ZoneReportBranchRow[];
  summary: ReportCountSummary;
};

export type StateZoneSummary = {
  zone: { id: string; name: string };
  rollup: RollupInfo;
  forwarded: boolean;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  branches: ZoneReportBranchRow[];
  summary: ReportCountSummary;
};

export type StateSummaryResponse = {
  weekOf: string;
  state: { id: string; name: string };
  rollup: RollupInfo;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  zones: StateZoneSummary[];
  summary: ReportCountSummary;
};

export type NationalStateSummary = {
  state: { id: string; name: string };
  rollup: RollupInfo;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  zones: StateZoneSummary[];
  summary: ReportCountSummary;
};

export type NationalSummaryResponse = {
  weekOf: string;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  states: NationalStateSummary[];
  summary: ReportCountSummary;
  /** Every branch this week, including ones not yet forwarded to HQ. */
  coverage: ReportCountSummary;
};

export type GrowthMetric = {
  current: number;
  previous: number;
  change: number;
  changePercent: number | null;
};

export type StateGrowthRow = {
  stateId: string;
  stateName: string;
  statePastorName: string | null;
  attendance: GrowthMetric;
  finance: GrowthMetric;
  branchesReporting: number;
  branchesTotal: number;
};

export type NationalGrowthResponse = {
  weekOf: string;
  previousWeekOf: string;
  weekLabel: string;
  previousWeekLabel: string;
  attendance: GrowthMetric;
  finance: GrowthMetric;
  currency: string;
  states: StateGrowthRow[];
};

export type BranchGrowthRow = {
  branchId: string;
  branchName: string;
  zoneName: string | null;
  attendance: GrowthMetric;
  finance: GrowthMetric;
};

export type StateGrowthResponse = {
  weekOf: string;
  previousWeekOf: string;
  weekLabel: string;
  previousWeekLabel: string;
  state: { id: string; name: string; pastorName: string | null };
  attendance: GrowthMetric;
  finance: GrowthMetric;
  currency: string;
  branches: BranchGrowthRow[];
};

export type FeedbackRecord = {
  id: string;
  reportId: string;
  message: string;
  createdAt: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
};

export type FeedbackListResponse = {
  items: FeedbackRecord[];
};

export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationRecord[];
  unreadCount: number;
};

export function canLeaveFeedback(role: Role): boolean {
  return (
    role === Role.ZONAL_PASTOR ||
    role === Role.STATE_PASTOR ||
    role === Role.LEAD_PASTOR ||
    role === Role.ADMIN
  );
}

export function canReplyToFeedback(
  userId: string,
  feedback: FeedbackRecord,
): boolean {
  return feedback.toUser.id === userId;
}

export type CreateFeedbackInput = {
  message: string;
  replyToId?: string;
};
