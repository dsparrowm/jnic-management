"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayInLagos } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { MonthlySummaryCard } from "@/components/summaries/monthly-summary-card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { api, ApiError, MonthlySummaryListResponse } from "@/lib/api";
import { getAccessToken, getStoredUser } from "@/lib/auth";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function currentMonthYear() {
  const today = getTodayInLagos();
  const [year, month] = today.split("-").map(Number);
  return { month, year };
}

export default function SummariesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState(() => currentMonthYear().month);
  const [year, setYear] = useState(() => currentMonthYear().year);
  const [data, setData] = useState<MonthlySummaryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!getAccessToken() || !getStoredUser()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(undefined);
      try {
        const response = await api.listMonthlySummaries(token!, month, year);
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
  }, [ready, month, year, router]);

  if (!ready) return null;
  const user = getStoredUser();
  if (!user) return null;

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentMonthYear().year - i);

  return (
    <DashboardShell user={user} title="Monthly Summaries">
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Monthly summaries</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Auto-aggregated attendance and finance totals from weekly reports, with a weekly
            breakdown for your scope.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="summary-month">Month</Label>
            <NativeSelect
              id="summary-month"
              value={String(month)}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={String(index + 1)}>
                  {name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary-year">Year</Label>
            <NativeSelect
              id="summary-year"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {error && <ErrorText message={error} />}

        {loading ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        ) : data && data.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No monthly summary available for your scope in {MONTH_NAMES[month - 1]} {year}.
          </p>
        ) : (
          data?.items.map((summary) => (
            <MonthlySummaryCard key={summary.id} summary={summary} />
          ))
        )}
      </div>
    </DashboardShell>
  );
}
