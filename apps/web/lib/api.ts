import { BranchSubmissionState, NotificationType, OrgChangeType, ReportStatus, Role, UserStatus } from "@repo/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
  profilePicUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: string;
  profilePicUrl: string | null;
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
  onboardingTokenExpiry: string | null;
  createdAt: string;
}

export interface PastorOrgRef {
  id: string;
  name: string;
}

export interface PastorRecord {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: string;
  profilePicUrl: string | null;
  createdAt: string;
  state: PastorOrgRef | null;
  zone: PastorOrgRef | null;
  branch: PastorOrgRef | null;
}

export interface PastorListSummary {
  total: number;
  active: number;
  pending: number;
  deactivated: number;
}

export interface PastorListResponse {
  items: PastorRecord[];
  total: number;
  page: number;
  perPage: number;
  summary: PastorListSummary;
}

export interface ProfilePicturePresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export interface WeeklyReportAttendance {
  adultCount: number;
  teenageCount: number;
  childrenCount: number;
}

export interface WeeklyReportFinance {
  tithe: number;
  offering: number;
  other: number;
  currency: string;
}

export interface WeeklyReportRecord {
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
  editable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReportListResponse {
  items: WeeklyReportRecord[];
  total: number;
  page: number;
  perPage: number;
}

export interface WeeklyReportInput {
  serviceDate: string;
  adultCount: number;
  teenageCount: number;
  childrenCount: number;
  tithe: number;
  offering: number;
  other: number;
  currency?: string;
}

export interface ZoneReportBranchRow {
  branch: { id: string; name: string };
  report: WeeklyReportRecord | null;
  submissionState: BranchSubmissionState;
  missed: boolean;
}

export interface ReportCountSummary {
  total: number;
  submitted: number;
  missed: number;
  pending: number;
}

export interface RollupInfo {
  status: "IN_REVIEW" | "FORWARDED" | "STALE";
  version: number;
  forwardedAt: string | null;
}

export interface ZoneSummaryResponse {
  weekOf: string;
  zone: { id: string; name: string };
  rollup: RollupInfo;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  branches: ZoneReportBranchRow[];
  summary: ReportCountSummary;
}

export interface StateZoneSummary {
  zone: { id: string; name: string };
  rollup: RollupInfo;
  forwarded: boolean;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  branches: ZoneReportBranchRow[];
  summary: ReportCountSummary;
}

export interface StateSummaryResponse {
  weekOf: string;
  state: { id: string; name: string };
  rollup: RollupInfo;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  zones: StateZoneSummary[];
  summary: ReportCountSummary;
}

export interface NationalStateSummary {
  state: { id: string; name: string };
  rollup: RollupInfo;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  zones: StateZoneSummary[];
  summary: ReportCountSummary;
}

export interface NationalSummaryResponse {
  weekOf: string;
  totals: {
    attendance: WeeklyReportAttendance;
    finance: WeeklyReportFinance;
  };
  states: NationalStateSummary[];
  summary: ReportCountSummary;
}

export interface NationalAttendanceTrendPoint {
  weekOf: string;
  weekLabel: string;
  byState: Array<{
    stateId: string;
    stateName: string;
    adultCount: number;
    teenageCount: number;
    childrenCount: number;
    total: number;
  }>;
}

export interface NationalFinanceByState {
  stateId: string;
  stateName: string;
  tithe: number;
  offering: number;
  other: number;
  total: number;
  currency: string;
  branchesSubmitted: number;
  branchesTotal: number;
}

export interface NationalAnalyticsResponse {
  weekOf: string;
  weeks: number;
  attendanceTrend: NationalAttendanceTrendPoint[];
  financeByState: NationalFinanceByState[];
}

export interface MonthlySummaryTotals {
  adult: number;
  teenage: number;
  children: number;
  tithe: number;
  offering: number;
  other: number;
  currency: string;
}

export interface MonthlySummaryWeekRow extends MonthlySummaryTotals {
  weekOf: string;
  weekLabel: string;
}

export interface MonthlySummaryStateRow {
  stateId: string;
  stateName: string;
  branchesReporting: number;
  branchesTotal: number;
  weeklyReports: number;
  totals: MonthlySummaryTotals;
}

export interface MonthlySummaryCoverage {
  branchesReporting: number;
  branchesTotal: number;
  weeklyReports: number;
}

export interface MonthlySummaryScopeOption {
  scopeType: string;
  scopeId: string;
  scopeName: string;
}

export interface MonthlySummaryItem {
  id: string;
  scopeType: string;
  scopeId: string;
  scopeName: string;
  month: number;
  year: number;
  status: string;
  approvedAt: string | null;
  totals: MonthlySummaryTotals;
  weeks: MonthlySummaryWeekRow[];
  coverage: MonthlySummaryCoverage;
  stateBreakdown?: MonthlySummaryStateRow[];
}

export interface MonthlySummaryListResponse {
  month: number;
  year: number;
  items: MonthlySummaryItem[];
  scopeOptions?: MonthlySummaryScopeOption[];
}

export interface ListMonthlySummariesOptions {
  scopeType?: string;
  scopeId?: string;
}

export interface MonthlySummaryPendingItem {
  id: string;
  scopeType: string;
  scopeId: string;
  scopeName: string;
  month: number;
  year: number;
  status: string;
  totals: MonthlySummaryTotals;
}

export interface MonthlySummaryPendingResponse {
  items: MonthlySummaryPendingItem[];
}

export interface FeedbackRecord {
  id: string;
  reportId: string;
  message: string;
  createdAt: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
}

export interface FeedbackListResponse {
  items: FeedbackRecord[];
}

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationRecord[];
  unreadCount: number;
}

export interface PastorFilters {
  search?: string;
  stateId?: string;
  zoneId?: string;
  branchId?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  perPage?: number;
}

export interface OrgBranch {
  id: string;
  name: string;
  address: string | null;
  zoneId: string;
}

export interface OrgZone {
  id: string;
  name: string;
  stateId: string;
  branches: OrgBranch[];
}

export interface OrgState {
  id: string;
  name: string;
  zones: OrgZone[];
}

export interface OrgChangeRequest {
  id: string;
  type: OrgChangeType;
  payload: Record<string, unknown>;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  requestedBy: { id: string; name: string; email: string };
  reviewedBy: { id: string; name: string; email: string } | null;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function formatApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const message = (body as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

function shouldRefreshAccessToken(token: string, skewSeconds = 60): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const { clearSession, getRefreshToken, saveSession } = await import("./auth");
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const session = await rawRequest<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      saveSession(session);
      return session.accessToken;
    } catch {
      clearSession();
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function resolveAccessToken(explicitToken?: string | null): Promise<string | null> {
  const { getAccessToken } = await import("./auth");
  const token = explicitToken ?? getAccessToken();
  if (!token) return null;
  if (!shouldRefreshAccessToken(token)) return token;
  return refreshAccessToken();
}

function isPublicApiPath(path: string): boolean {
  if (path.startsWith("/auth/")) return true;
  if (path.startsWith("/onboarding/validate/")) return true;
  if (path === "/onboarding/complete") return true;
  return false;
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = formatApiErrorMessage(body, res.statusText);
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  retried = false,
): Promise<T> {
  const isPublic = isPublicApiPath(path);
  const accessToken = isPublic
    ? (token ?? null)
    : await resolveAccessToken(token);
  const requestOptions: RequestInit = {
    ...options,
    body: options.body,
  };

  if (!isPublic && !accessToken) {
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  try {
    return await rawRequest<T>(path, requestOptions, accessToken);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      !retried &&
      !isPublic
    ) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return request<T>(path, requestOptions, nextToken, true);
      }
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
    throw err;
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  getMe: (token: string) => request<UserRecord>("/users/me", {}, token),

  presignProfilePicture: (
    token: string,
    data: { contentType: "image/jpeg" | "image/png"; fileSize: number },
  ) =>
    request<ProfilePicturePresignResponse>("/files/profile-picture/presign", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  updateProfilePicture: (token: string, data: { key: string }) =>
    request<UserRecord>("/users/me/profile-picture", {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  listUsers: (token: string) => request<UserRecord[]>("/users", {}, token),

  listPastors: (token: string, filters: PastorFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.stateId) params.set("stateId", filters.stateId);
    if (filters.zoneId) params.set("zoneId", filters.zoneId);
    if (filters.branchId) params.set("branchId", filters.branchId);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.perPage) params.set("perPage", String(filters.perPage));
    const qs = params.toString();
    return request<PastorListResponse>(`/users/pastors${qs ? `?${qs}` : ""}`, {}, token);
  },

  createOnboardingUser: (
    token: string,
    data: {
      name: string;
      email: string;
      phone?: string;
      role: Role;
      stateId?: string;
      zoneId?: string;
      branchId?: string;
    },
  ) =>
    request<UserRecord>("/onboarding/users", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  resendOnboarding: (token: string, userId: string) =>
    request<UserRecord>(`/onboarding/users/${userId}/resend`, { method: "POST" }, token),

  validateOnboarding: (onboardingToken: string) =>
    request<{ valid: boolean; email: string; name: string; expiresAt: string }>(
      `/onboarding/validate/${encodeURIComponent(onboardingToken.trim())}`,
    ),

  completeOnboarding: (onboardingToken: string, password: string) =>
    request<AuthResponse>("/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({ token: onboardingToken.trim(), password }),
    }),

  deactivateUser: (token: string, userId: string) =>
    request<UserRecord>(`/users/${userId}/deactivate`, { method: "PATCH" }, token),

  reassignUser: (
    token: string,
    userId: string,
    data: {
      role?: Role;
      stateId?: string | null;
      zoneId?: string | null;
      branchId?: string | null;
    },
  ) =>
    request<UserRecord>(`/users/${userId}/reassign`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  getOrgTree: (token: string) => request<OrgState[]>("/org/tree", {}, token),

  createState: (token: string, data: { name: string }) =>
    request<OrgState>("/org/states", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  createZone: (token: string, data: { name: string; stateId: string }) =>
    request<OrgZone>("/org/zones", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  createBranch: (
    token: string,
    data: { name: string; zoneId: string; address?: string },
  ) =>
    request<OrgBranch>("/org/branches", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  proposeOrgChange: (
    token: string,
    data: { type: OrgChangeType; payload: Record<string, unknown> },
  ) =>
    request<OrgChangeRequest>("/org/change-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  listOrgChangeRequests: (token: string) =>
    request<OrgChangeRequest[]>("/org/change-requests", {}, token),

  approveOrgChange: (token: string, id: string, reviewNote?: string) =>
    request<OrgChangeRequest>(`/org/change-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reviewNote }),
    }, token),

  rejectOrgChange: (token: string, id: string, reviewNote?: string) =>
    request<OrgChangeRequest>(`/org/change-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reviewNote }),
    }, token),

  createWeeklyReport: (token: string, data: WeeklyReportInput) =>
    request<WeeklyReportRecord>("/reports/weekly", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  updateWeeklyReport: (token: string, id: string, data: Partial<WeeklyReportInput>) =>
    request<WeeklyReportRecord>(`/reports/weekly/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  listWeeklyReports: (
    token: string,
    filters: { weekOf?: string; page?: number; perPage?: number } = {},
  ) => {
    const params = new URLSearchParams();
    if (filters.weekOf) params.set("weekOf", filters.weekOf);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.perPage) params.set("perPage", String(filters.perPage));
    const qs = params.toString();
    return request<WeeklyReportListResponse>(`/reports/weekly${qs ? `?${qs}` : ""}`, {}, token);
  },

  getWeeklyReport: (token: string, id: string) =>
    request<WeeklyReportRecord>(`/reports/weekly/${id}`, {}, token),

  getZoneSummary: (token: string, weekOf: string) =>
    request<ZoneSummaryResponse>(`/reports/zone/summary?weekOf=${encodeURIComponent(weekOf)}`, {}, token),

  forwardZoneReport: (token: string, weekOf: string) =>
    request<ZoneSummaryResponse>(`/reports/zone/${encodeURIComponent(weekOf)}/forward`, { method: "POST" }, token),

  getStateSummary: (token: string, weekOf: string) =>
    request<StateSummaryResponse>(`/reports/state/summary?weekOf=${encodeURIComponent(weekOf)}`, {}, token),

  forwardStateReport: (token: string, weekOf: string) =>
    request<StateSummaryResponse>(`/reports/state/${encodeURIComponent(weekOf)}/forward`, { method: "POST" }, token),

  getNationalSummary: (token: string, weekOf: string) =>
    request<NationalSummaryResponse>(
      `/reports/national/summary?weekOf=${encodeURIComponent(weekOf)}`,
      {},
      token,
    ),

  getNationalAnalytics: (token: string, weekOf: string, weeks = 12) =>
    request<NationalAnalyticsResponse>(
      `/reports/national/analytics?weekOf=${encodeURIComponent(weekOf)}&weeks=${weeks}`,
      {},
      token,
    ),

  listReportFeedback: (token: string, reportId: string) =>
    request<FeedbackListResponse>(`/reports/${reportId}/feedback`, {}, token),

  createReportFeedback: (token: string, reportId: string, message: string) =>
    request<FeedbackRecord>(`/reports/${reportId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }, token),

  listNotifications: (token: string) =>
    request<NotificationListResponse>("/notifications", {}, token),

  markNotificationRead: (token: string, notificationId: string) =>
    request<{ id: string; readAt: string }>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    }, token),

  listMonthlySummaries: (
    token: string,
    month: number,
    year: number,
    options?: ListMonthlySummariesOptions,
  ) => {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });
    if (
      options?.scopeType === "STATE" &&
      options.scopeId &&
      /^[a-z0-9]{10,40}$/i.test(options.scopeId)
    ) {
      params.set("scopeType", options.scopeType);
      params.set("scopeId", options.scopeId);
    }
    return request<MonthlySummaryListResponse>(
      `/summaries/monthly?${params.toString()}`,
      {},
      token,
    );
  },

  listPendingMonthlySummaries: (token: string) =>
    request<MonthlySummaryPendingResponse>("/summaries/monthly/pending-approval", {}, token),

  approveMonthlySummary: (token: string, id: string) =>
    request<{ id: string; status: string }>(`/summaries/monthly/${id}/approve`, {
      method: "POST",
    }, token),
};

export { ApiError };
