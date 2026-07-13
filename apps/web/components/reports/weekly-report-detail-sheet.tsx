"use client";

import { WeeklyReportRecord } from "@/lib/api";
import { FeedbackThread } from "@/components/reports/feedback-thread";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";

function Metric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface WeeklyReportDetailSheetProps {
  report: WeeklyReportRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  canLeaveFeedback?: boolean;
}

export function WeeklyReportDetailSheet({
  report,
  open,
  onOpenChange,
  loading,
  canLeaveFeedback = false,
}: WeeklyReportDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{report?.branch.name ?? "Branch report"}</SheetTitle>
          <SheetDescription>
            {report
              ? `Service ${report.serviceDate} · Week ending ${report.weekOf}`
              : "Loading report details"}
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <p className="px-4 text-sm text-muted-foreground">Loading report…</p>
        )}

        {report && !loading && (
          <div className="space-y-6 px-4 pb-6">
            <div className="flex items-center gap-2">
              <ReportStatusBadge status={report.status} />
              <span className="text-xs text-muted-foreground">
                by {report.submittedBy.name}
              </span>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Attendance</h3>
              <dl className="grid grid-cols-3 gap-4">
                <Metric label="Adults" value={report.attendance?.adultCount ?? 0} mono />
                <Metric label="Teenagers" value={report.attendance?.teenageCount ?? 0} mono />
                <Metric label="Children" value={report.attendance?.childrenCount ?? 0} mono />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Finance</h3>
              <dl className="grid grid-cols-2 gap-4">
                <Metric
                  label="Tithe"
                  value={formatMoney(report.finance?.tithe ?? 0, report.finance?.currency ?? "NGN")}
                  mono
                />
                <Metric
                  label="Offering"
                  value={formatMoney(
                    report.finance?.offering ?? 0,
                    report.finance?.currency ?? "NGN",
                  )}
                  mono
                />
                <Metric
                  label="Other"
                  value={formatMoney(report.finance?.other ?? 0, report.finance?.currency ?? "NGN")}
                  mono
                />
              </dl>
            </section>

            <FeedbackThread reportId={report.id} canLeaveFeedback={canLeaveFeedback} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
