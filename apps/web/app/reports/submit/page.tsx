"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { computeWeekOf, formatWeekEndingLabel, getTodayInLagos } from "@repo/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { FeedbackThread } from "@/components/reports/feedback-thread";
import {
  WeeklyReportForm,
  WeeklyReportFormValues,
} from "@/components/reports/weekly-report-form";
import { WeekPicker } from "@/components/reports/week-picker";
import { Button } from "@/components/ui/button";
import { api, ApiError, AuthUser, WeeklyReportRecord } from "@/lib/api";
import {
  getAccessToken,
  getStoredUser,
  canSubmitWeeklyReportsForUser,
  updateStoredUser,
} from "@/lib/auth";

function defaultServiceDateForWeek(weekOf: string): string {
  const today = getTodayInLagos();
  return computeWeekOf(today) === weekOf ? today : weekOf;
}

export default function SubmitWeeklyReportPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(() => getStoredUser());
  const [ready, setReady] = useState(false);
  const [weekOf, setWeekOf] = useState(() => computeWeekOf(getTodayInLagos()));
  const [existingReport, setExistingReport] = useState<WeeklyReportRecord | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const loadReportForWeek = useCallback(
    async (user: AuthUser, selectedWeekOf: string) => {
      const token = getAccessToken();
      if (!token) return;

      setReportLoading(true);
      setLoadError(undefined);
      setSubmitError(undefined);

      try {
        const response = await api.listWeeklyReports(token, {
          weekOf: selectedWeekOf,
          perPage: 1,
        });
        setExistingReport(response.items[0] ?? null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setLoadError(err instanceof Error ? err.message : "Could not load report");
        setExistingReport(null);
      } finally {
        setReportLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await api.getMe(token!);
        if (cancelled) return;

        const user: AuthUser = {
          id: me.id,
          email: me.email,
          name: me.name,
          role: me.role,
          status: me.status,
          stateId: me.stateId,
          zoneId: me.zoneId,
          branchId: me.branchId,
          profilePicUrl: me.profilePicUrl,
        };
        updateStoredUser(user);
        setSessionUser(user);

        if (!canSubmitWeeklyReportsForUser(user)) {
          router.replace("/dashboard");
          return;
        }
        if (!user.branchId) {
          setLoadError("Your account is not assigned to a branch. Contact Admin.");
          setReportLoading(false);
          setReady(true);
          return;
        }

        if (!cancelled) {
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setLoadError(err instanceof Error ? err.message : "Could not load your account");
          setReportLoading(false);
          setReady(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready || !sessionUser?.branchId) return;
    void loadReportForWeek(sessionUser, weekOf);
  }, [weekOf, ready, sessionUser, loadReportForWeek]);

  async function handleSubmit(values: WeeklyReportFormValues) {
    const token = getAccessToken();
    if (!token) return;

    const targetWeekOf = computeWeekOf(values.serviceDate);
    const sameWeek =
      existingReport && existingReport.weekOf === targetWeekOf && weekOf === targetWeekOf;

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

      if (sameWeek && existingReport?.editable) {
        await api.updateWeeklyReport(token, existingReport.id, payload);
      } else if (!existingReport || existingReport.weekOf !== targetWeekOf) {
        await api.createWeeklyReport(token, payload);
      } else {
        setSubmitError("This report is locked after your zone forwarded it and cannot be edited.");
        return;
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
            Your report for the week ending {formatWeekEndingLabel(weekOf)} has been recorded.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setWeekOf(computeWeekOf(getTodayInLagos()));
              }}
            >
              Submit another week
            </Button>
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const defaultServiceDate = defaultServiceDateForWeek(weekOf);
  const canCreate =
    !reportLoading && !loadError && (!existingReport || existingReport.editable);

  return (
    <DashboardShell
      user={sessionUser}
      title="Submit Weekly Report"
      subtitle={`Week ending ${formatWeekEndingLabel(weekOf)}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <WeekPicker weekOf={weekOf} onWeekOfChange={setWeekOf} />

        {loadError && <ErrorText message={loadError} />}

        {!loadError && (
          <div className="space-y-6">
            {reportLoading ? (
              <p className="text-sm text-muted-foreground">Loading report for this week…</p>
            ) : (
              <>
                {canCreate && !existingReport && (
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
                    No report submitted yet for this week. Fill in the form below to create one.
                  </div>
                )}

                {existingReport && !existingReport.editable && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    This week&apos;s report has been forwarded by your zonal pastor and is locked.
                    Choose another week above if you need to submit a different service week.
                  </div>
                )}

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <WeeklyReportForm
                    key={weekOf}
                    existingReport={existingReport}
                    defaultServiceDate={defaultServiceDate}
                    loading={loading}
                    error={submitError}
                    onSubmit={handleSubmit}
                  />
                </div>

                {existingReport && (
                  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <FeedbackThread reportId={existingReport.id} canLeaveFeedback={false} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
