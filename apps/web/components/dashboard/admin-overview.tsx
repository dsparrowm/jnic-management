"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardList, GitBranch, UserPlus } from "lucide-react";
import {
  computeWeekOf,
  formatWeekEndingLabel,
  getTodayInLagos,
} from "@repo/types";
import { ErrorText } from "@/components/auth/auth-card";
import { AttendanceTrendChart } from "@/components/dashboard/attendance-trend-chart";
import { FinanceByStateChart } from "@/components/dashboard/finance-by-state-chart";
import { OverviewStatCard } from "@/components/dashboard/overview-stat-card";
import { computeOrgSummary } from "@/components/org/org-page-header";
import { WeekPicker } from "@/components/reports/week-picker";
import { Button } from "@/components/ui/button";
import {
  api,
  ApiError,
  NationalAnalyticsResponse,
  NationalSummaryResponse,
  OrgState,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface AdminOverviewProps {
  userName: string;
}

const ANALYTICS_WEEKS = 12;

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-lg bg-muted" />
      <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-muted" />
      <div className="h-96 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export function AdminOverview({ userName }: AdminOverviewProps) {
  const router = useRouter();
  const [weekOf, setWeekOf] = useState(() => computeWeekOf(getTodayInLagos()));
  const weekLabel = formatWeekEndingLabel(weekOf);

  const [orgTree, setOrgTree] = useState<OrgState[]>([]);
  const [nationalSummary, setNationalSummary] = useState<NationalSummaryResponse | null>(null);
  const [analytics, setAnalytics] = useState<NationalAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      setError(undefined);

      try {
        const [tree, national, analyticsResponse] = await Promise.all([
          api.getOrgTree(token!),
          api.getNationalSummary(token!, weekOf),
          api.getNationalAnalytics(token!, weekOf, ANALYTICS_WEEKS),
        ]);

        if (cancelled) return;

        setOrgTree(tree);
        setNationalSummary(national);
        setAnalytics(analyticsResponse);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Could not load dashboard overview");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [router, weekOf]);

  const orgSummary = useMemo(() => computeOrgSummary(orgTree), [orgTree]);

  const submittedCount = nationalSummary?.summary.submitted ?? 0;
  const missedCount = nationalSummary?.summary.missed ?? 0;
  const visibleBranches = nationalSummary?.summary.total ?? 0;
  const hasForwardedReports = (nationalSummary?.states.length ?? 0) > 0;

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Overview</p>
            <h2 className="text-2xl font-semibold text-foreground">Welcome back, {userName}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Organisation-wide attendance and finance snapshot for the week ending {weekLabel}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/pastors?onboard=1">
                <UserPlus className="h-4 w-4" />
                Onboard pastor
              </Link>
            </Button>
            <Button asChild>
              <Link href="/reports/national">
                <ClipboardList className="h-4 w-4" />
                National reports
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <WeekPicker weekOf={weekOf} onWeekOfChange={setWeekOf} />

      {error && <ErrorText message={error} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <OverviewStatCard
          icon={GitBranch}
          label="Total branches"
          value={orgSummary.branches}
          hint={`${orgSummary.states} states · ${orgSummary.zones} zones`}
          href="/admin/org"
          iconTone="primary"
        />
        <OverviewStatCard
          icon={ClipboardList}
          label="Reports submitted"
          value={
            hasForwardedReports
              ? `${submittedCount}/${visibleBranches}`
              : `${submittedCount}/${orgSummary.branches}`
          }
          hint={
            hasForwardedReports
              ? `Forwarded to HQ · week ending ${weekLabel}`
              : `All submitted branches · week ending ${weekLabel}`
          }
          href="/reports/national"
          iconTone="success"
        />
      </div>

      {analytics && (
        <>
          <AttendanceTrendChart data={analytics.attendanceTrend} weeks={analytics.weeks} />
          <FinanceByStateChart data={analytics.financeByState} weekLabel={weekLabel} />
        </>
      )}

      {missedCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>{missedCount}</strong> branch report
            {missedCount === 1 ? "" : "s"} missed in the current HQ-visible reporting window.{" "}
            <Link href="/reports/national" className="font-medium underline underline-offset-2">
              Review national reports
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
