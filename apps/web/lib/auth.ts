"use client";

import { AuthResponse, AuthUser } from "./api";

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
