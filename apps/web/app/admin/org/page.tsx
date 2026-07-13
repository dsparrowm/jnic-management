"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreateBranchSheet } from "@/components/org/create-branch-sheet";
import { CreateStateSheet } from "@/components/org/create-state-sheet";
import { CreateZoneSheet } from "@/components/org/create-zone-sheet";
import { OrgHierarchyPanel } from "@/components/org/org-hierarchy-panel";
import { OrgPageHeader } from "@/components/org/org-page-header";
import { ErrorText } from "@/components/auth/auth-card";
import { api, ApiError, OrgState } from "@/lib/api";
import { getAccessToken, getStoredUser, isAdmin } from "@/lib/auth";

type SheetType = "state" | "zone" | "branch" | null;

export default function AdminOrgPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orgTree, setOrgTree] = useState<OrgState[]>([]);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  const loadTree = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    const data = await api.getOrgTree(token);
    setOrgTree(data);
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !isAdmin(user)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    loadTree().catch((err) => {
      setError(err instanceof ApiError ? err.message : "Failed to load organisation");
    });
  }, [router, loadTree]);

  function handleSuccess(entityType: string, name: string) {
    setSuccess(`${entityType} "${name}" created successfully.`);
    setError(undefined);
    loadTree().catch((err) => {
      setError(err instanceof ApiError ? err.message : "Failed to refresh hierarchy");
    });
  }

  if (!ready) return null;

  const user = getStoredUser();
  if (!user) return null;

  return (
    <DashboardShell user={user}>
      <OrgPageHeader
        orgTree={orgTree}
        onAddState={() => setActiveSheet("state")}
        onAddZone={() => setActiveSheet("zone")}
        onAddBranch={() => setActiveSheet("branch")}
      />

      <div className="space-y-4 p-6">
        <ErrorText message={error} />
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        )}
        <OrgHierarchyPanel orgTree={orgTree} onAddState={() => setActiveSheet("state")} />
      </div>

      <CreateStateSheet
        open={activeSheet === "state"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
        orgTree={orgTree}
        onSuccess={(name) => handleSuccess("State", name)}
      />

      <CreateZoneSheet
        open={activeSheet === "zone"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
        orgTree={orgTree}
        onSuccess={(name) => handleSuccess("Zone", name)}
      />

      <CreateBranchSheet
        open={activeSheet === "branch"}
        onOpenChange={(open) => !open && setActiveSheet(null)}
        orgTree={orgTree}
        onSuccess={(name) => handleSuccess("Branch", name)}
      />
    </DashboardShell>
  );
}
