"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api, ApiError, UserRecord } from "@/lib/api";
import { getAccessToken, getStoredUser, isAdmin } from "@/lib/auth";
import { ErrorText } from "@/components/auth/auth-card";

export default function AdminUsersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [error, setError] = useState<string>();
  const [actionId, setActionId] = useState<string>();

  async function loadUsers() {
    const token = getAccessToken();
    if (!token) return;
    const data = await api.listUsers(token);
    setUsers(data);
  }

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !isAdmin(user)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    loadUsers().catch((err) => {
      setError(err instanceof ApiError ? err.message : "Failed to load users");
    });
  }, [router]);

  async function handleResend(userId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionId(userId);
    setError(undefined);
    try {
      await api.resendOnboarding(token, userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Resend failed");
    } finally {
      setActionId(undefined);
    }
  }

  async function handleDeactivate(userId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionId(userId);
    setError(undefined);
    try {
      await api.deactivateUser(token, userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deactivate failed");
    } finally {
      setActionId(undefined);
    }
  }

  if (!ready) return null;

  return (
    <DashboardShell>
      <div
        className="rounded-xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="border-b px-6 py-4" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Manage pastor accounts — resend links or deactivate access.
          </p>
        </div>
        <div className="p-6">
          <ErrorText message={error} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ color: "var(--text-muted)" }}>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t" style={{ borderColor: "var(--border-default)" }}>
                    <td className="py-3 pr-4">{user.name}</td>
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4">{user.role.replace(/_/g, " ")}</td>
                    <td className="py-3 pr-4">{user.status}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {user.status === "PENDING" && (
                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => handleResend(user.id)}
                            className="text-sm"
                            style={{ color: "var(--accent-primary)" }}
                          >
                            Resend
                          </button>
                        )}
                        {user.status !== "DEACTIVATED" && (
                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => handleDeactivate(user.id)}
                            className="text-sm"
                            style={{ color: "var(--state-error)" }}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
