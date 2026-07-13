"use client";

import { AuthResponse, AuthUser } from "./api";
import { Role, canSubmitWeeklyReports } from "@repo/types";

const ACCESS_KEY = "jnlop:access";
const REFRESH_KEY = "jnlop:refresh";
const USER_KEY = "jnlop:user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function saveSession(data: AuthResponse) {
  localStorage.setItem(ACCESS_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function updateStoredUserProfilePic(profilePicUrl: string | null) {
  const user = getStoredUser();
  if (!user) return;
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, profilePicUrl }));
}

export function updateStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isLeadPastor(user: AuthUser | null): boolean {
  return user?.role === "LEAD_PASTOR";
}

export function canSubmitWeeklyReportsForUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return canSubmitWeeklyReports(user.role as Role, user.branchId);
}

export function canLeaveFeedback(user: AuthUser | null): boolean {
  if (!user) return false;
  return (
    user.role === "ZONAL_PASTOR" ||
    user.role === "STATE_PASTOR" ||
    user.role === "LEAD_PASTOR" ||
    user.role === "ADMIN"
  );
}

export function isZonalPastor(user: AuthUser | null): boolean {
  return user?.role === "ZONAL_PASTOR";
}

export function isStatePastor(user: AuthUser | null): boolean {
  return user?.role === "STATE_PASTOR";
}

export function isHqViewer(user: AuthUser | null): boolean {
  return user?.role === "LEAD_PASTOR" || user?.role === "ADMIN";
}
