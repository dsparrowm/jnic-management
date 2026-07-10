"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAccessToken, getStoredUser } from "@/lib/auth";

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
    <DashboardShell>
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <h2 className="text-xl font-semibold">Welcome back, {user.name}</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          You are signed in as <strong>{user.role.replace(/_/g, " ")}</strong>. Phase 1 auth
          and onboarding are live — reporting modules arrive in later phases.
        </p>
      </div>
    </DashboardShell>
  );
}
