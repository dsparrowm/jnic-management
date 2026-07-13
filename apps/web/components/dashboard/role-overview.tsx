"use client";

import Link from "next/link";
import { Building2, ClipboardList, Users } from "lucide-react";
import { AuthUser } from "@/lib/api";
import {
  canSubmitWeeklyReportsForUser,
  isAdmin,
  isHqViewer,
  isLeadPastor,
  isStatePastor,
  isZonalPastor,
} from "@/lib/auth";
import { formatRole } from "@/lib/navigation";

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

interface RoleOverviewProps {
  user: AuthUser;
}

export function RoleOverview({ user }: RoleOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">Welcome back, {user.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in as <strong className="text-foreground">{formatRole(user.role)}</strong>.
          Use the shortcuts below for your role-scoped workflows.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Your role"
          value={formatRole(user.role)}
          hint="Navigation and pages are scoped to your assignment"
          icon={Users}
        />
        {isStatePastor(user) && (
          <StatCard
            label="State reports"
            value="Review"
            hint="Zone drill-down, missed flags, and state totals"
            icon={ClipboardList}
            href="/reports/state"
          />
        )}
        {isHqViewer(user) && !isAdmin(user) && (
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
            label="National reports"
            value="Review"
            hint="Nationwide submissions after state pastors forward"
            icon={ClipboardList}
            href="/reports/national"
          />
        )}
        {canSubmitWeeklyReportsForUser(user) && (
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
        {isAdmin(user) && (
          <StatCard
            label="Administration"
            value="Manage"
            hint="Pastor directory and organisation hierarchy"
            icon={Building2}
            href="/admin/pastors"
          />
        )}
      </div>
    </div>
  );
}
