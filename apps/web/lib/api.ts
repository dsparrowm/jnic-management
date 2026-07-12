import { OrgChangeType, Role, UserStatus } from "@repo/types";

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
    const message = (body as { message?: string }).message ?? res.statusText;
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

async function refreshAccessToken(): Promise<string | null> {
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
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  retried = false,
): Promise<T> {
  try {
    return await rawRequest<T>(path, options, token);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      token &&
      !retried &&
      !path.startsWith("/auth/")
    ) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return request<T>(path, options, nextToken, true);
      }
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
      `/onboarding/validate/${onboardingToken}`,
    ),

  completeOnboarding: (onboardingToken: string, password: string) =>
    request<AuthResponse>("/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({ token: onboardingToken, password }),
    }),

  deactivateUser: (token: string, userId: string) =>
    request<UserRecord>(`/users/${userId}/deactivate`, { method: "PATCH" }, token),

  getOrgTree: (token: string) => request<OrgState[]>("/org/tree", {}, token),

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
};

export { ApiError };
