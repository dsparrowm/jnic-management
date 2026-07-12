"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ClipboardList, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { formatRole } from "@/lib/navigation";
import { getAccessToken, getStoredUser, isAdmin, isBranchSubmitter, isHqViewer, isLeadPastor, isStatePastor, isZonalPastor } from "@/lib/auth";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="rounded-lg bg-muted p-2 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-lg border border-border bg-card p-5 shadow-sm">{content}</div>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    if (!getAccessToken() || !user) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router, user]);

  if (!ready || !user) {
    return null;
  }

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Welcome back, {user.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as <strong className="text-foreground">{formatRole(user.role)}</strong>.
            Reporting and hierarchy modules arrive in Phases 4–5.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Your role"
            value={formatRole(user.role)}
            hint="Role-scoped views unlock as modules ship"
            icon={Users}
          />
          {isAdmin(user) && (
            <StatCard
              label="Admin tools"
              value="Active"
              hint="Browse the pastors directory, onboard new pastors, and manage access"
              icon={Building2}
            />
          )}
          {isStatePastor(user) && (
            <StatCard
              label="State reports"
              value="Review"
              hint="Zone drill-down, missed flags, and state totals"
              icon={ClipboardList}
              href="/reports/state"
            />
          )}
          {isHqViewer(user) && (
            <StatCard
              label="National reports"
              value="Overview"
              hint="Nationwide branch submissions and totals"
              icon={ClipboardList}
              href="/reports/national"
            />
          )}
          {isLeadPastor(user) && (
            <StatCard
              label="Approvals"
              value="Org changes"
              hint="Review state and zone proposals from Admin"
              icon={ClipboardList}
            />
          )}
          {!isAdmin(user) && !isLeadPastor(user) && isBranchSubmitter(user) && (
            <StatCard
              label="Weekly report"
              value="Submit"
              hint="Record attendance and finance for your branch"
              icon={ClipboardList}
              href="/reports/submit"
            />
          )}
          {isZonalPastor(user) && (
            <StatCard
              label="Zone reports"
              value="Review"
              hint="Branch submissions, missed flags, and zone totals"
              icon={ClipboardList}
              href="/reports/zone"
            />
          )}
          {!isAdmin(user) && !isLeadPastor(user) && !isBranchSubmitter(user) && !isZonalPastor(user) && !isStatePastor(user) && (
            <StatCard
              label="Weekly reports"
              value="Phase 5"
              hint="Hierarchy views arrive in the next phase"
              icon={ClipboardList}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
