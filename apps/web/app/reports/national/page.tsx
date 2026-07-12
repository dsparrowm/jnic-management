"use client";

import { useEffect, useState } from "react";
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
import { api, ApiError, NationalSummaryResponse, WeeklyReportRecord } from "@/lib/api";
import { getAccessToken, getStoredUser, isHqViewer } from "@/lib/auth";

export default function NationalReportsPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());
  const [ready, setReady] = useState(false);
  const [weekOf, setWeekOf] = useState(computeWeekOf(getTodayInLagos()));
  const [data, setData] = useState<NationalSummaryResponse | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReportRecord | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (!isHqViewer(user)) {
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
        const response = await api.getNationalSummary(token!, weekOf);
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Could not load national reports");
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
      const summary = await api.getNationalSummary(token, weekOf);
      setData(summary);
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
      title="National Reports"
      subtitle={`Week ending ${formatWeekEndingLabel(weekOf)}`}
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
              <ReportTotalsCard
                title="National totals"
                attendance={data.totals.attendance}
                finance={data.totals.finance}
              />
            )}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading national reports…</p>
            ) : (
              <div className="space-y-8">
                {data.states.map((state) => (
                  <div key={state.state.id} className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{state.state.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {state.summary.submitted} submitted · {state.summary.pending} pending ·{" "}
                          {state.summary.missed} missed
                        </p>
                      </div>
                    </div>
                    {state.zones.map((zone) => (
                      <ZoneReportsSection
                        key={zone.zone.id}
                        zoneName={zone.zone.name}
                        branches={zone.branches}
                        summary={zone.summary}
                        onViewReport={(id) => void handleViewReport(id)}
                      />
                    ))}
                  </div>
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
