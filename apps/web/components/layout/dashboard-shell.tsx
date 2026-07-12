"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Role } from "@repo/types";
import { AuthUser } from "@/lib/api";
import { formatRole, getPageTitle } from "@/lib/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface DashboardShellProps {
  children: React.ReactNode;
  user: AuthUser;
  title?: string;
  subtitle?: string;
}

export function DashboardShell({ children, user, title, subtitle }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = title ?? getPageTitle(pathname);
  const pageSubtitle =
    subtitle ?? `${formatRole(user.role)} · Jubilee Nation Leadership & Operations`;

  return (
    <div className="flex h-screen bg-muted/40">
      <AppSidebar
        role={user.role as Role}
        branchId={user.branchId}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          user={user}
          title={pageTitle}
          subtitle={pageSubtitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
