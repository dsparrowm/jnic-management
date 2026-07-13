"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ClipboardList,
  GitBranch,
  MapPin,
  UserPlus,
  Users,
} from "lucide-react";
import { computeWeekOf, formatWeekEndingLabel, getTodayInLagos } from "@repo/types";
import { ErrorText } from "@/components/auth/auth-card";
import { computeOrgSummary } from "@/components/org/org-page-header";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { OverviewStatCard } from "@/components/dashboard/overview-stat-card";
import { SubmissionStateBadge } from "@/components/reports/report-status-badge";
import { ReportTotalsCard } from "@/components/reports/report-totals-card";
import { Button } from "@/components/ui/button";
import {
  api,
  ApiError,
  NationalSummaryResponse,
  NotificationRecord,
  OrgState,
  PastorListSummary,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface AdminOverviewProps {
  userName: string;
}

interface AttentionBranch {
  branchName: string;
  zoneName: string;
  stateName: string;
  submissionState: "MISSED" | "PENDING";
}

function collectAttentionBranches(data: NationalSummaryResponse): AttentionBranch[] {
  const items: AttentionBranch[] = [];

  for (const state of data.states) {
    for (const zone of state.zones) {
      for (const row of zone.branches) {
        if (row.submissionState === "MISSED" || row.submissionState === "PENDING") {
          items.push({
            branchName: row.branch.name,
            zoneName: zone.zone.name,
            stateName: state.state.name,
            submissionState: row.submissionState,
          });
        }
      }
    }
  }

  return items.slice(0, 8);
}

function formatNotificationTime(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function AdminOverview({ userName }: AdminOverviewProps) {
  const router = useRouter();
  const weekOf = useMemo(() => computeWeekOf(getTodayInLagos()), []);
  const weekLabel = formatWeekEndingLabel(weekOf);

  const [orgTree, setOrgTree] = useState<OrgState[]>([]);
  const [pastorSummary, setPastorSummary] = useState<PastorListSummary | null>(null);
  const [nationalSummary, setNationalSummary] = useState<NationalSummaryResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
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
        const [tree, pastors, national, notificationResponse] = await Promise.all([
          api.getOrgTree(token!),
          api.listPastors(token!, { page: 1, perPage: 1 }),
          api.getNationalSummary(token!, weekOf),
          api.listNotifications(token!),
        ]);

        if (cancelled) return;

        setOrgTree(tree);
        setPastorSummary(pastors.summary);
        setNationalSummary(national);
        setNotifications(notificationResponse.items.slice(0, 6));
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
  const attentionBranches = useMemo(
    () => (nationalSummary ? collectAttentionBranches(nationalSummary) : []),
    [nationalSummary],
  );

  if (loading) {
    return <OverviewSkeleton />;
  }

  const submittedCount = nationalSummary?.summary.submitted ?? 0;
  const missedCount = nationalSummary?.summary.missed ?? 0;
  const pendingReports = nationalSummary?.summary.pending ?? 0;
  const visibleBranches = nationalSummary?.summary.total ?? 0;
  const hasForwardedReports = (nationalSummary?.states.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Overview</p>
            <h2 className="text-2xl font-semibold text-foreground">Welcome back, {userName}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Organisation-wide snapshot across states, pastors, and weekly reporting for the week
              ending {weekLabel}.
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

      {error && <ErrorText message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewStatCard
          icon={GitBranch}
          label="Total branches"
          value={orgSummary.branches}
          hint={`${orgSummary.states} states · ${orgSummary.zones} zones`}
          href="/admin/org"
          iconTone="primary"
        />
        <OverviewStatCard
          icon={Users}
          label="Active pastors"
          value={pastorSummary?.active ?? 0}
          hint={`${pastorSummary?.total ?? 0} total in directory`}
          href="/admin/pastors"
          iconTone="info"
        />
        <OverviewStatCard
          icon={UserPlus}
          label="Pending onboarding"
          value={pastorSummary?.pending ?? 0}
          hint="Awaiting password setup"
          href="/admin/pastors?status=PENDING"
          iconTone="warning"
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
              ? `Week ending ${weekLabel}`
              : `No HQ-visible forwards yet · week ending ${weekLabel}`
          }
          href="/reports/national"
          iconTone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel
          title="Organisation coverage"
          description="States, zones, and branches in the hierarchy"
          actionHref="/admin/org"
        >
          {orgTree.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No states added yet. Start by creating your first state on the organisation page.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {orgTree.map((state) => {
                const zones = state.zones.length;
                const branches = state.zones.reduce(
                  (count, zone) => count + zone.branches.length,
                  0,
                );

                return (
                  <li
                    key={state.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{state.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {zones} zones · {branches} branches
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Weekly reporting"
          description={`Forwarded branch visibility for week ending ${weekLabel}`}
          actionHref="/reports/national"
        >
          {nationalSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{submittedCount}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{pendingReports}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                  <p className="text-xs text-muted-foreground">Missed</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{missedCount}</p>
                </div>
              </div>

              {!hasForwardedReports ? (
                <p className="text-sm text-muted-foreground">
                  No state reports have been forwarded to HQ for this week yet. Zone and state
                  pastors must forward before branch detail appears here.
                </p>
              ) : nationalSummary.states.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No forwarded state bundles are visible for this week.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {nationalSummary.states.map((state) => (
                    <li
                      key={state.state.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-foreground">{state.state.name}</span>
                      <span className="text-muted-foreground">
                        {state.summary.submitted} submitted · {state.summary.missed} missed
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Weekly reporting data is unavailable.</p>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardPanel
          title="Attention needed"
          description="Missed or pending branch reports in HQ-visible bundles"
          actionHref="/reports/national"
          className="lg:col-span-2"
        >
          {attentionBranches.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {hasForwardedReports
                  ? "No missed or pending branches in the current HQ-visible reporting window."
                  : "Branch-level alerts appear after zone and state pastors forward reports upstream."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {attentionBranches.map((item) => (
                <li key={`${item.stateName}-${item.zoneName}-${item.branchName}`} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.branchName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.stateName} · {item.zoneName}
                      </p>
                    </div>
                    <SubmissionStateBadge submissionState={item.submissionState} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent activity"
          description="Latest platform notifications"
          className="lg:col-span-3"
        >
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent notifications.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {notifications.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatNotificationTime(item.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
      </div>

      {nationalSummary && nationalSummary.summary.submitted > 0 && (
        <ReportTotalsCard
          title="National totals (forwarded reports)"
          attendance={nationalSummary.totals.attendance}
          finance={nationalSummary.totals.finance}
        />
      )}

      <DashboardPanel title="Quick actions">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/admin/pastors",
              title: "Pastor directory",
              description: "Browse, filter, resend invites, and deactivate accounts",
              icon: Users,
            },
            {
              href: "/admin/org",
              title: "Organisation",
              description: "Manage states, zones, and branches",
              icon: Building2,
            },
            {
              href: "/reports/national",
              title: "National reports",
              description: "Review forwarded weekly submissions nationwide",
              icon: ClipboardList,
            },
            {
              href: "/admin/pastors?onboard=1",
              title: "Onboard pastor",
              description: "Send a secure setup link to a new pastor",
              icon: UserPlus,
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <action.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
