"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { ReportTotalsCard } from "@/components/reports/report-totals-card";
import { Button } from "@/components/ui/button";
import { api, ApiError, MonthlySummaryPendingItem } from "@/lib/api";
import { getAccessToken, getStoredUser, isLeadPastor } from "@/lib/auth";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SummaryApprovalsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<MonthlySummaryPendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(undefined);
    try {
      const response = await api.listPendingMonthlySummaries(token);
      setItems(response.items);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load pending summaries");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !user) {
      router.replace("/login");
      return;
    }
    if (!isLeadPastor(user)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    void load();
  }, [router, load]);

  async function handleApprove(id: string) {
    const token = getAccessToken();
    if (!token) return;

    setActionId(id);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api.approveMonthlySummary(token, id);
      setSuccess("National monthly summary approved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approval failed");
    } finally {
      setActionId(null);
    }
  }

  if (!ready) return null;
  const user = getStoredUser();
  if (!user) return null;

  return (
    <DashboardShell user={user} title="Summary Approvals">
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">National summary approvals</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review and approve national monthly summaries before they are finalised.
          </p>
        </div>

        {error && <ErrorText message={error} />}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        )}

        {loading ? (
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No national summaries are waiting for approval.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {MONTH_NAMES[item.month - 1]} {item.year}
                  </h3>
                  <p className="text-sm text-muted-foreground">National monthly summary</p>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleApprove(item.id)}
                  disabled={actionId === item.id}
                >
                  {actionId === item.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
              </div>

              <ReportTotalsCard
                title="National totals"
                attendance={{
                  adultCount: item.totals.adult,
                  teenageCount: item.totals.teenage,
                  childrenCount: item.totals.children,
                }}
                finance={{
                  tithe: item.totals.tithe,
                  offering: item.totals.offering,
                  other: item.totals.other,
                  currency: item.totals.currency,
                }}
              />
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
