"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { computeWeekOf, formatWeekEndingLabel, getTodayInLagos } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import {
  WeeklyReportForm,
  WeeklyReportFormValues,
} from "@/components/reports/weekly-report-form";
import { Button } from "@/components/ui/button";
import { api, ApiError, WeeklyReportRecord } from "@/lib/api";
import { getAccessToken, getStoredUser, isBranchSubmitter } from "@/lib/auth";

export default function SubmitWeeklyReportPage() {
  const router = useRouter();
  const sessionUser = getStoredUser();
  const [ready, setReady] = useState(false);
  const [existingReport, setExistingReport] = useState<WeeklyReportRecord | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultServiceDate = getTodayInLagos();
  const currentWeekOf = computeWeekOf(defaultServiceDate);

  const loadCurrentWeekReport = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoadError(undefined);
    try {
      const response = await api.listWeeklyReports(token, { weekOf: currentWeekOf, perPage: 1 });
      setExistingReport(response.items[0] ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Could not load report");
    }
  }, [currentWeekOf, router]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !sessionUser) {
      router.replace("/login");
      return;
    }
    if (!isBranchSubmitter(sessionUser)) {
      router.replace("/dashboard");
      return;
    }
    if (!sessionUser.branchId) {
      setLoadError("Your account is not assigned to a branch. Contact Admin.");
      setReady(true);
      return;
    }

    void loadCurrentWeekReport().finally(() => setReady(true));
  }, [loadCurrentWeekReport, router, sessionUser]);

  async function handleSubmit(values: WeeklyReportFormValues) {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setSubmitError(undefined);

    try {
      const payload = {
        serviceDate: values.serviceDate,
        adultCount: values.adultCount,
        teenageCount: values.teenageCount,
        childrenCount: values.childrenCount,
        tithe: values.tithe,
        offering: values.offering,
        other: values.other,
        currency: values.currency,
      };

      if (existingReport?.editable) {
        await api.updateWeeklyReport(token, existingReport.id, payload);
      } else {
        await api.createWeeklyReport(token, payload);
      }

      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(err instanceof Error ? err.message : "Could not save report");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !sessionUser) {
    return null;
  }

  if (success) {
    return (
      <DashboardShell user={sessionUser} title="Weekly Report">
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Weekly report saved</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your report for the week ending {formatWeekEndingLabel(currentWeekOf)} has been
            recorded.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      user={sessionUser}
      title="Submit Weekly Report"
      subtitle={`Week ending ${formatWeekEndingLabel(currentWeekOf)}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {loadError && <ErrorText message={loadError} />}

        {!loadError && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <WeeklyReportForm
              existingReport={existingReport}
              defaultServiceDate={defaultServiceDate}
              loading={loading}
              error={submitError}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
