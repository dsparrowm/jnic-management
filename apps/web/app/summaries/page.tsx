"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SummaryScopeType, getTodayInLagos } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import {
  SummariesFilterBar,
  SummariesFilterValues,
  SummariesView,
} from "@/components/summaries/summaries-filter-bar";
import { SummariesPageHeader } from "@/components/summaries/summaries-page-header";
import { formatSummaryPeriod, isValidScopeId } from "@/components/summaries/summaries-shared";
import { SummariesStateTab } from "@/components/summaries/summaries-state-tab";
import { SummariesSummaryTab } from "@/components/summaries/summaries-summary-tab";
import { SummariesWeeklyTab } from "@/components/summaries/summaries-weekly-tab";
import { api, ApiError, MonthlySummaryListResponse } from "@/lib/api";
import { getAccessToken, getStoredUser, isHqViewer } from "@/lib/auth";

function currentMonthYear() {
  const today = getTodayInLagos();
  const [year, month] = today.split("-").map(Number);
  return { month, year };
}

function parseFilters(params: URLSearchParams): SummariesFilterValues {
  const defaults = currentMonthYear();
  const month = Number(params.get("month") ?? defaults.month);
  const year = Number(params.get("year") ?? defaults.year);
  const scopeParam = params.get("scope")?.toLowerCase();
  let scope: SummariesFilterValues["scope"] = scopeParam === "state" ? "state" : "hq";
  let stateId = params.get("stateId") ?? "";

  if (scope === "state" && !isValidScopeId(stateId)) {
    scope = "hq";
    stateId = "";
  }

  const viewParam = params.get("view");
  const view: SummariesView =
    viewParam === "weekly" || viewParam === "states" || viewParam === "summary"
      ? viewParam
      : "summary";

  return {
    month: Number.isFinite(month) ? month : defaults.month,
    year: Number.isFinite(year) ? year : defaults.year,
    scope,
    stateId,
    view,
  };
}

function SummariesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function SummariesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<MonthlySummaryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const user = getStoredUser();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const isHq = isHqViewer(user);
  const showStatesTab = isHq && filters.scope === "hq";

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.replace(`/summaries?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!getAccessToken() || !user) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router, user]);

  useEffect(() => {
    if (!ready) return;
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(undefined);

      const scopeOptions =
        isHq &&
        filters.scope === "state" &&
        filters.stateId &&
        isValidScopeId(filters.stateId)
          ? { scopeType: SummaryScopeType.STATE, scopeId: filters.stateId }
          : undefined;

      try {
        const response = await api.listMonthlySummaries(
          token!,
          filters.month,
          filters.year,
          scopeOptions,
        );
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof ApiError ? err.message : "Could not load monthly summaries");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ready, filters.month, filters.year, filters.scope, filters.stateId, isHq, router]);

  useEffect(() => {
    if (!showStatesTab && filters.view === "states") {
      updateParams({ view: "summary" });
    }
  }, [showStatesTab, filters.view, updateParams]);

  useEffect(() => {
    const scopeParam = searchParams.get("scope")?.toLowerCase();
    const stateId = searchParams.get("stateId") ?? "";
    if (scopeParam === "state" && stateId && !isValidScopeId(stateId)) {
      updateParams({ scope: undefined, stateId: undefined });
    }
  }, [searchParams, updateParams]);

  if (!ready || !user) return null;

  const summary = data?.items[0] ?? null;
  const periodLabel = formatSummaryPeriod(filters.month, filters.year);

  const handleReset = () => {
    const defaults = currentMonthYear();
    updateParams({
      month: String(defaults.month),
      year: String(defaults.year),
      scope: undefined,
      stateId: undefined,
      view: undefined,
    });
  };

  return (
    <DashboardShell user={user} title="Monthly Summaries">
      <div className="space-y-6">
        <SummariesFilterBar
          filters={filters}
          scopeOptions={data?.scopeOptions}
          showScopeFilter={isHq}
          showStatesTab={showStatesTab}
          onPeriodChange={(month, year) => updateParams({ month: String(month), year: String(year) })}
          onScopeChange={(scope, stateId) => {
            if (scope === "hq") {
              updateParams({ scope: undefined, stateId: undefined, view: "summary" });
              return;
            }
            updateParams({
              scope: "state",
              stateId,
              view: filters.view === "states" ? "summary" : filters.view,
            });
          }}
          onViewChange={(view) => updateParams({ view: view === "summary" ? undefined : view })}
          onReset={handleReset}
        />

        {error && <ErrorText message={error} />}

        {loading ? (
          <SummariesSkeleton />
        ) : !summary ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No monthly summary available for {periodLabel}
            {filters.scope === "state" && filters.stateId ? " in the selected state" : ""}.
          </p>
        ) : (
          <>
            <SummariesPageHeader summary={summary} />

            {filters.view === "summary" && <SummariesSummaryTab summary={summary} />}
            {filters.view === "states" && showStatesTab && (
              <SummariesStateTab
                states={summary.stateBreakdown ?? []}
                onStateSelect={(stateId) =>
                  updateParams({
                    scope: "state",
                    stateId,
                    view: undefined,
                  })
                }
              />
            )}
            {filters.view === "weekly" && <SummariesWeeklyTab summary={summary} />}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

export default function SummariesPage() {
  return (
    <Suspense fallback={null}>
      <SummariesPageContent />
    </Suspense>
  );
}
