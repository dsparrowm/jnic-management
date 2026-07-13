"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Role, UserStatus } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { OnboardPastorSheet } from "@/components/onboarding/onboard-pastor-sheet";
import { PastorsCardGrid } from "@/components/pastors/pastors-card-grid";
import {
  PastorFilterValues,
  PastorsFilterBar,
} from "@/components/pastors/pastors-filter-bar";
import { PastorsPageHeader } from "@/components/pastors/pastors-page-header";
import { PastorsTable } from "@/components/pastors/pastors-table";
import { Button } from "@/components/ui/button";
import { api, ApiError, OrgState, PastorListResponse } from "@/lib/api";
import { getAccessToken, getStoredUser, isAdmin, redirectToLoginIfUnauthorized } from "@/lib/auth";

function parseFilters(params: URLSearchParams): PastorFilterValues {
  return {
    search: params.get("search") ?? "",
    stateId: params.get("stateId") ?? "",
    zoneId: params.get("zoneId") ?? "",
    branchId: params.get("branchId") ?? "",
    role: params.get("role") ?? "",
    status: params.get("status") ?? "",
  };
}

function PastorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [orgTree, setOrgTree] = useState<OrgState[]>([]);
  const [data, setData] = useState<PastorListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [actionId, setActionId] = useState<string | null>(null);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const view = searchParams.get("view") === "cards" ? "cards" : "table";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.replace(`/admin/pastors?${params.toString()}`);
    },
    [router, searchParams],
  );

  const loadPastors = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(undefined);
    try {
      const response = await api.listPastors(token, {
        search: filters.search || undefined,
        stateId: filters.stateId || undefined,
        zoneId: filters.zoneId || undefined,
        branchId: filters.branchId || undefined,
        role: (filters.role as Role) || undefined,
        status: (filters.status as UserStatus) || undefined,
        page,
        perPage: 20,
      });
      setData(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && !getAccessToken()) {
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError && err.status === 404) {
        setError(
          "Pastors API is not available on this server. Deploy the latest API or point NEXT_PUBLIC_API_URL to a local API.",
        );
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load pastors");
    } finally {
      setLoading(false);
    }
  }, [filters, page, router]);

  const loadOrgTree = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const tree = await api.getOrgTree(token);
      setOrgTree(tree);
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setOrgTree([]);
    }
  }, [router]);

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !isAdmin(user)) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
    void loadOrgTree();
  }, [router, loadOrgTree]);

  useEffect(() => {
    if (onboardOpen) {
      void loadOrgTree();
    }
  }, [onboardOpen, loadOrgTree]);

  useEffect(() => {
    if (!ready) return;
    void loadPastors();
  }, [ready, loadPastors]);

  useEffect(() => {
    if (!ready) return;
    if (searchParams.get("onboard") === "1") {
      setOnboardOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("onboard");
      const qs = params.toString();
      router.replace(qs ? `/admin/pastors?${qs}` : "/admin/pastors");
    }
  }, [ready, router, searchParams]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== filters.search) {
        updateParams({ search: searchInput || undefined, page: "1" });
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, filters.search, updateParams]);

  function handleFilterChange(key: keyof PastorFilterValues, value: string) {
    const updates: Record<string, string | undefined> = { [key]: value || undefined, page: "1" };
    if (key === "stateId") {
      updates.zoneId = undefined;
      updates.branchId = undefined;
    }
    if (key === "zoneId") {
      updates.branchId = undefined;
    }
    updateParams(updates);
  }

  function handleReset() {
    setSearchInput("");
    router.replace("/admin/pastors");
  }

  async function handleResend(userId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionId(userId);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api.resendOnboarding(token, userId);
      setSuccess("Onboarding link resent.");
      await loadPastors();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Resend failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleDeactivate(userId: string) {
    const pastor = data?.items.find((p) => p.id === userId);
    if (!pastor) return;
    if (!window.confirm(`Deactivate ${pastor.name}? They will lose login access.`)) return;

    const token = getAccessToken();
    if (!token) return;
    setActionId(userId);
    setError(undefined);
    setSuccess(undefined);
    try {
      await api.deactivateUser(token, userId);
      setSuccess(`${pastor.name} has been deactivated.`);
      await loadPastors();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deactivate failed");
    } finally {
      setActionId(null);
    }
  }

  if (!ready) return null;

  const user = getStoredUser();
  if (!user) return null;

  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 20;
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <DashboardShell user={user} title="Pastors">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <PastorsPageHeader
          summary={data?.summary ?? null}
          view={view}
          onViewChange={(next) => updateParams({ view: next === "table" ? undefined : next })}
          onOnboardClick={() => setOnboardOpen(true)}
        />

        <div className="space-y-4 p-6">
          <PastorsFilterBar
            filters={{ ...filters, search: searchInput }}
            orgTree={orgTree}
            onSearchChange={setSearchInput}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />

          {error && <ErrorText message={error} />}
          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : view === "cards" ? (
            <PastorsCardGrid
              pastors={data?.items ?? []}
              actionId={actionId}
              onResend={handleResend}
              onDeactivate={handleDeactivate}
            />
          ) : (
            <PastorsTable
              pastors={data?.items ?? []}
              actionId={actionId}
              onResend={handleResend}
              onDeactivate={handleDeactivate}
            />
          )}

          {!loading && total > 0 && (
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {start}–{end} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <OnboardPastorSheet
        open={onboardOpen}
        onOpenChange={setOnboardOpen}
        orgTree={orgTree}
        onSuccess={() => void loadPastors()}
      />
    </DashboardShell>
  );
}

export default function AdminPastorsPage() {
  return (
    <Suspense fallback={null}>
      <PastorsPageContent />
    </Suspense>
  );
}
