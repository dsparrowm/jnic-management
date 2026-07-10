"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api, ApiError, OrgState } from "@/lib/api";
import { getAccessToken, getStoredUser, isAdmin } from "@/lib/auth";
import {
  ErrorText,
  Field,
  inputClass,
  inputStyle,
  PrimaryButton,
} from "@/components/auth/auth-card";

const ROLES: Role[] = [
  Role.LEAD_PASTOR,
  Role.ADMIN,
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.BRANCH_PASTOR,
  Role.ADMIN_STAFF,
];

export default function AdminOnboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState<OrgState[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: Role.BRANCH_PASTOR,
    stateId: "",
    zoneId: "",
    branchId: "",
  });

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !isAdmin(user)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    const token = getAccessToken();
    if (token) {
      api.getOrgTree(token).then(setTree).catch(() => {});
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const created = await api.createOnboardingUser(token, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        stateId: form.stateId || undefined,
        zoneId: form.zoneId || undefined,
        branchId: form.branchId || undefined,
      });
      setSuccess(`Invitation sent to ${created.email}. They will receive an onboarding link.`);
      setForm({
        name: "",
        email: "",
        phone: "",
        role: Role.BRANCH_PASTOR,
        stateId: "",
        zoneId: "",
        branchId: "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to onboard user");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  const needsState = [Role.STATE_PASTOR, Role.ZONAL_PASTOR, Role.BRANCH_PASTOR, Role.ADMIN_STAFF].includes(form.role);
  const needsZone = [Role.ZONAL_PASTOR, Role.BRANCH_PASTOR, Role.ADMIN_STAFF].includes(form.role);
  const needsBranch = [Role.BRANCH_PASTOR, Role.ADMIN_STAFF].includes(form.role);

  const zonesForState = tree.find((s) => s.id === form.stateId)?.zones ?? [];
  const branchesForZone = zonesForState.find((z) => z.id === form.zoneId)?.branches ?? [];

  return (
    <DashboardShell>
      <div
        className="mx-auto max-w-lg rounded-xl border p-6"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <h2 className="text-xl font-semibold">Onboard pastor</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Creates a pending account and emails a secure onboarding link (48h expiry).
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as Role,
                  stateId: "",
                  zoneId: "",
                  branchId: "",
                }))
              }
              className={inputClass}
              style={inputStyle}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          {needsState && (
            <Field label="State">
              <select
                required
                value={form.stateId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stateId: e.target.value, zoneId: "", branchId: "" }))
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="">Select state</option>
                {tree.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {needsZone && (
            <Field label="Zone">
              <select
                required
                value={form.zoneId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, zoneId: e.target.value, branchId: "" }))
                }
                className={inputClass}
                style={inputStyle}
                disabled={!form.stateId}
              >
                <option value="">Select zone</option>
                {zonesForState.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {needsBranch && (
            <Field label="Branch">
              <select
                required
                value={form.branchId}
                onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                disabled={!form.zoneId}
              >
                <option value="">Select branch</option>
                {branchesForZone.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <ErrorText message={error} />
          {success && (
            <p className="text-sm" style={{ color: "var(--state-success)" }}>
              {success}
            </p>
          )}
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send onboarding link"}
          </PrimaryButton>
        </form>
      </div>
    </DashboardShell>
  );
}
