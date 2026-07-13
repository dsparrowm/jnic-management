"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminOverview } from "@/components/dashboard/admin-overview";
import { RoleOverview } from "@/components/dashboard/role-overview";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAccessToken, getStoredUser, isAdmin, isLeadPastor } from "@/lib/auth";

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

  const showAdminOverview = isAdmin(user) || isLeadPastor(user);

  return (
    <DashboardShell user={user}>
      {showAdminOverview ? <AdminOverview userName={user.name} /> : <RoleOverview user={user} />}
    </DashboardShell>
  );
}
