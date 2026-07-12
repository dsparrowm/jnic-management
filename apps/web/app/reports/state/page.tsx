"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatWeekEndingLabel, getTodayInLagos, computeWeekOf } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { ReportTotalsCard } from "@/components/reports/report-totals-card";
import { SummaryStat } from "@/components/reports/summary-stat";
import { WeekPicker } from "@/components/reports/week-picker";
import { WeeklyReportDetailSheet } from "@/components/reports/weekly-report-detail-sheet";
import { ZoneReportsSection } from "@/components/reports/zone-reports-section";
import { api, ApiError, StateSummaryResponse, WeeklyReportRecord } from "@/lib/api";
import { getAccessToken, getStoredUser, isStatePastor } from "@/lib/auth";

export default function StateReportsPage() {
  const router = useRouter();
  const sessionUser = getStoredUser();
  const [ready, setReady] = useState(false);
  const [weekOf, setWeekOf] = useState(computeWeekOf(getTodayInLagos()));
  const [data, setData] = useState<StateSummaryResponse | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReportRecord | null>(null);

  const loadSummary = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(undefined);
    try {
      const response = await api.getStateSummary(token, weekOf);
      setData(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load state reports");
    } finally {
      setLoading(false);
    }
  }, [router, weekOf]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !sessionUser) {
      router.replace("/login");
      return;
    }
    if (!isStatePastor(sessionUser)) {
      router.replace("/dashboard");
      return;
    }

    setReady(true);
    void loadSummary();
  }, [loadSummary, router, sessionUser]);

  async function handleViewReport(reportId: string) {
    const token = getAccessToken();
    if (!token) return;

    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedReport(null);

    try {
      const report = await api.getWeeklyReport(token, reportId);
      setSelectedReport(report);
      void loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
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
        {error && <ErrorText message={error} />}

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
      />
    </DashboardShell>
  );
}
