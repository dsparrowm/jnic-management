"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  computeWeekOf,
  formatWeekEndingLabel,
  getTodayInLagos,
} from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { WeeklyReportDetailSheet } from "@/components/reports/weekly-report-detail-sheet";
import { ZoneReportsTable } from "@/components/reports/zone-reports-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, WeeklyReportRecord, ZoneSummaryResponse } from "@/lib/api";
import { getAccessToken, getStoredUser, isZonalPastor } from "@/lib/auth";

function SummaryStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700 bg-emerald-50"
      : tone === "warning"
        ? "text-amber-700 bg-amber-50"
        : tone === "destructive"
          ? "text-red-700 bg-red-50"
          : "text-muted-foreground bg-muted";

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function ZoneReportsPage() {
  const router = useRouter();
  const sessionUser = getStoredUser();
  const [ready, setReady] = useState(false);
  const [weekOf, setWeekOf] = useState(computeWeekOf(getTodayInLagos()));
  const [data, setData] = useState<ZoneSummaryResponse | null>(null);
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
      const response = await api.getZoneSummary(token, weekOf);
      setData(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load zone reports");
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
    if (!isZonalPastor(sessionUser)) {
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

  const totals = data?.totals;

  return (
    <DashboardShell
      user={sessionUser}
      title="Zone Reports"
      subtitle={data ? `${data.zone.name} · Week ending ${formatWeekEndingLabel(weekOf)}` : undefined}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="weekOf">Week ending</Label>
            <Input
              id="weekOf"
              type="date"
              value={weekOf}
              onChange={(event) => setWeekOf(computeWeekOf(event.target.value))}
            />
          </div>
          {data && (
            <p className="text-sm text-muted-foreground">
              Deadline: Monday 23:59 Lagos time after each Sunday week end
            </p>
          )}
        </div>

        {error && <ErrorText message={error} />}

        {data && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="Branches" value={data.summary.total} icon={CheckCircle2} tone="default" />
            <SummaryStat label="Submitted" value={data.summary.submitted} icon={CheckCircle2} tone="success" />
            <SummaryStat label="Pending" value={data.summary.pending} icon={Clock} tone="warning" />
            <SummaryStat label="Missed" value={data.summary.missed} icon={AlertTriangle} tone="destructive" />
          </div>
        )}

        {totals && data && data.summary.submitted > 0 && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Zone totals</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <dt className="text-xs text-muted-foreground">Adults</dt>
                <dd className="mt-1 font-mono text-sm font-medium">{totals.attendance.adultCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Teenagers</dt>
                <dd className="mt-1 font-mono text-sm font-medium">{totals.attendance.teenageCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Children</dt>
                <dd className="mt-1 font-mono text-sm font-medium">{totals.attendance.childrenCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Tithe</dt>
                <dd className="mt-1 font-mono text-sm font-medium">{totals.finance.tithe.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Offering</dt>
                <dd className="mt-1 font-mono text-sm font-medium">{totals.finance.offering.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Other</dt>
                <dd className="mt-1 font-mono text-sm font-medium">{totals.finance.other.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card shadow-sm">
          {loading ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">Loading zone reports…</p>
          ) : data ? (
            <ZoneReportsTable branches={data.branches} onViewReport={(id) => void handleViewReport(id)} />
          ) : null}
        </div>
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
