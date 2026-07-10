"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api, ApiError, OrgChangeRequest } from "@/lib/api";
import { getAccessToken, getStoredUser, isLeadPastor } from "@/lib/auth";
import { ErrorText } from "@/components/auth/auth-card";

export default function OrgApprovalsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [requests, setRequests] = useState<OrgChangeRequest[]>([]);
  const [error, setError] = useState<string>();
  const [actionId, setActionId] = useState<string>();

  async function loadRequests() {
    const token = getAccessToken();
    if (!token) return;
    const data = await api.listOrgChangeRequests(token);
    setRequests(data);
  }

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !isLeadPastor(user)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    loadRequests().catch((err) => {
      setError(err instanceof ApiError ? err.message : "Failed to load requests");
    });
  }, [router]);

  async function handleApprove(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionId(id);
    setError(undefined);
    try {
      await api.approveOrgChange(token, id);
      await loadRequests();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approval failed");
    } finally {
      setActionId(undefined);
    }
  }

  async function handleReject(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionId(id);
    setError(undefined);
    try {
      await api.rejectOrgChange(token, id);
      await loadRequests();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rejection failed");
    } finally {
      setActionId(undefined);
    }
  }

  if (!ready) return null;

  const pending = requests.filter((r) => r.status === "PENDING_LP_APPROVAL");

  function describeRequest(req: OrgChangeRequest) {
    if (req.type === "CREATE_STATE") {
      return `New state: ${(req.payload as { name: string }).name}`;
    }
    const p = req.payload as { name: string; stateId: string };
    return `New zone: ${p.name}`;
  }

  return (
    <DashboardShell>
      <div
        className="rounded-xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div className="border-b px-6 py-4" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="text-xl font-semibold">Org change approvals</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Review state and zone proposals from Admin.
          </p>
        </div>
        <div className="p-6">
          <ErrorText message={error} />
          {pending.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No pending requests.
            </p>
          ) : (
            <ul className="space-y-4">
              {pending.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <div>
                    <p className="font-medium">{describeRequest(req)}</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Requested by {req.requestedBy.name} ·{" "}
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionId === req.id}
                      onClick={() => handleApprove(req.id)}
                      className="rounded px-3 py-1 text-sm text-white"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionId === req.id}
                      onClick={() => handleReject(req.id)}
                      className="text-sm"
                      style={{ color: "var(--state-error)" }}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
