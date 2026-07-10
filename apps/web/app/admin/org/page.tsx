"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrgChangeType } from "@repo/types";
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

export default function AdminOrgPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tree, setTree] = useState<OrgState[]>([]);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [loading, setLoading] = useState(false);

  const [branchForm, setBranchForm] = useState({ name: "", zoneId: "", address: "" });
  const [stateName, setStateName] = useState("");
  const [zoneForm, setZoneForm] = useState({ name: "", stateId: "" });

  async function loadTree() {
    const token = getAccessToken();
    if (!token) return;
    const data = await api.getOrgTree(token);
    setTree(data);
  }

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !isAdmin(user)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    loadTree().catch((err) => {
      setError(err instanceof ApiError ? err.message : "Failed to load org tree");
    });
  }, [router]);

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api.createBranch(token, {
        name: branchForm.name,
        zoneId: branchForm.zoneId,
        address: branchForm.address || undefined,
      });
      setSuccess(`Branch "${branchForm.name}" created.`);
      setBranchForm({ name: "", zoneId: "", address: "" });
      await loadTree();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create branch");
    } finally {
      setLoading(false);
    }
  }

  async function handleProposeState(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api.proposeOrgChange(token, {
        type: OrgChangeType.CREATE_STATE,
        payload: { name: stateName },
      });
      setSuccess(`State "${stateName}" submitted for Lead Pastor approval.`);
      setStateName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to propose state");
    } finally {
      setLoading(false);
    }
  }

  async function handleProposeZone(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api.proposeOrgChange(token, {
        type: OrgChangeType.CREATE_ZONE,
        payload: { name: zoneForm.name, stateId: zoneForm.stateId },
      });
      setSuccess(`Zone "${zoneForm.name}" submitted for Lead Pastor approval.`);
      setZoneForm({ name: "", stateId: "" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to propose zone");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  const allZones = tree.flatMap((s) =>
    s.zones.map((z) => ({ ...z, stateName: s.name })),
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          <h2 className="text-xl font-semibold">Organisation hierarchy</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            States and zones require Lead Pastor approval. Branches can be added directly under
            an existing zone.
          </p>
          <ErrorText message={error} />
          {success && (
            <p className="mt-3 text-sm" style={{ color: "var(--state-success)" }}>
              {success}
            </p>
          )}
          <div className="mt-4 space-y-4">
            {tree.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No states yet. Propose one below or run the database seed.
              </p>
            )}
            {tree.map((state) => (
              <div key={state.id}>
                <p className="font-medium">{state.name}</p>
                {state.zones.length === 0 ? (
                  <p className="ml-4 text-sm" style={{ color: "var(--text-muted)" }}>
                    No zones
                  </p>
                ) : (
                  state.zones.map((zone) => (
                    <div key={zone.id} className="ml-4 mt-2">
                      <p className="text-sm font-medium">{zone.name}</p>
                      {zone.branches.length === 0 ? (
                        <p className="ml-4 text-sm" style={{ color: "var(--text-muted)" }}>
                          No branches
                        </p>
                      ) : (
                        <ul className="ml-4 list-disc text-sm" style={{ color: "var(--text-muted)" }}>
                          {zone.branches.map((branch) => (
                            <li key={branch.id}>
                              {branch.name}
                              {branch.address ? ` — ${branch.address}` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <form
            onSubmit={handleCreateBranch}
            className="rounded-xl border p-6"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
          >
            <h3 className="font-semibold">Add branch</h3>
            <div className="mt-4 space-y-3">
              <Field label="Zone">
                <select
                  required
                  value={branchForm.zoneId}
                  onChange={(e) => setBranchForm((f) => ({ ...f, zoneId: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">Select zone</option>
                  {allZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.stateName} → {z.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Branch name">
                <input
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Address">
                <input
                  value={branchForm.address}
                  onChange={(e) => setBranchForm((f) => ({ ...f, address: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <PrimaryButton type="submit" disabled={loading}>
                Create branch
              </PrimaryButton>
            </div>
          </form>

          <form
            onSubmit={handleProposeState}
            className="rounded-xl border p-6"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
          >
            <h3 className="font-semibold">Propose state</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Requires Lead Pastor approval.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="State name">
                <input
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <PrimaryButton type="submit" disabled={loading}>
                Submit for approval
              </PrimaryButton>
            </div>
          </form>

          <form
            onSubmit={handleProposeZone}
            className="rounded-xl border p-6"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
          >
            <h3 className="font-semibold">Propose zone</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Requires Lead Pastor approval.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="State">
                <select
                  required
                  value={zoneForm.stateId}
                  onChange={(e) => setZoneForm((f) => ({ ...f, stateId: e.target.value }))}
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
              <Field label="Zone name">
                <input
                  required
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <PrimaryButton type="submit" disabled={loading}>
                Submit for approval
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
