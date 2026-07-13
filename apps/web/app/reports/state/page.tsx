"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Send } from "lucide-react";
import { formatWeekEndingLabel, getTodayInLagos, computeWeekOf } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { ReportTotalsCard } from "@/components/reports/report-totals-card";
import { SummaryStat } from "@/components/reports/summary-stat";
import { RollupStatusBadge } from "@/components/reports/rollup-status-badge";
import { Button } from "@/components/ui/button";
import { WeekPicker } from "@/components/reports/week-picker";
import { WeeklyReportDetailSheet } from "@/components/reports/weekly-report-detail-sheet";
import { ZoneReportsSection } from "@/components/reports/zone-reports-section";
import { api, ApiError, StateSummaryResponse, WeeklyReportRecord } from "@/lib/api";
import { getAccessToken, getStoredUser, isStatePastor, canLeaveFeedback } from "@/lib/auth";

export default function StateReportsPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const [ready, setReady] = useState(false);
  const [weekOf, setWeekOf] = useState(computeWeekOf(getTodayInLagos()));
  const [data, setData] = useState<StateSummaryResponse | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReportRecord | null>(null);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (!isStatePastor(user)) {
      router.replace("/dashboard");
      return;
    }
    setSessionUser(user);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    async function loadSummary() {
      setLoading(true);
      setError(undefined);
      try {
        const response = await api.getStateSummary(token!, weekOf);
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Could not load state reports");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [ready, weekOf, router]);

  async function handleViewReport(reportId: string) {
    const token = getAccessToken();
    if (!token) return;

    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedReport(null);

    try {
      const report = await api.getWeeklyReport(token, reportId);
      setSelectedReport(report);
      const summary = await api.getStateSummary(token, weekOf);
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleForward() {
    const token = getAccessToken();
    if (!token) return;

    setForwarding(true);
    setError(undefined);
    try {
      const response = await api.forwardStateReport(token, weekOf);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not forward state report");
    } finally {
      setForwarding(false);
    }
  }

  if (!ready || !sessionUser) {
    return null;
  }

  return (
    <DashboardShell
      user={sessionUser}
      title="State Reports"
      subtitle={data ? `${data.state.name} · Week ending ${formatWeekEndingLabel(weekOf)}` : undefined}
    >
      <div className="space-y-6">
        <WeekPicker weekOf={weekOf} onWeekOfChange={setWeekOf} />

        {data?.rollup.status === "STALE" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            A zone report was updated after your last forward. Review the changes and re-forward
            to HQ.
          </div>
        )}

        {error && <ErrorText message={error} />}

        {data && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-foreground">State report status</p>
              <RollupStatusBadge rollup={data.rollup} />
            </div>
            <Button onClick={() => void handleForward()} disabled={forwarding}>
              <Send className="mr-2 h-4 w-4" />
              {data.rollup.status === "FORWARDED" || data.rollup.status === "STALE"
                ? forwarding
                  ? "Re-forwarding…"
                  : "Re-forward to HQ"
                : forwarding
                  ? "Forwarding…"
                  : "Forward to HQ"}
            </Button>
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryStat label="Branches" value={data.summary.total} icon={CheckCircle2} />
              <SummaryStat label="Submitted" value={data.summary.submitted} icon={CheckCircle2} tone="success" />
              <SummaryStat label="Pending" value={data.summary.pending} icon={Clock} tone="warning" />
              <SummaryStat label="Missed" value={data.summary.missed} icon={AlertTriangle} tone="destructive" />
            </div>

            {data.summary.submitted > 0 && (
              <ReportTotalsCard title="State totals" attendance={data.totals.attendance} finance={data.totals.finance} />
            )}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading state reports…</p>
            ) : (
              <div className="space-y-4">
                {data.zones.map((zone) => (
                  <ZoneReportsSection
                    key={zone.zone.id}
                    zoneName={zone.zone.name}
                    branches={zone.branches}
                    summary={zone.summary}
                    forwarded={zone.forwarded}
                    rollup={zone.rollup}
                    onViewReport={(id) => void handleViewReport(id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <WeeklyReportDetailSheet
        report={selectedReport}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        loading={detailLoading}
        canLeaveFeedback={canLeaveFeedback(sessionUser)}
      />
    </DashboardShell>
  );
}
