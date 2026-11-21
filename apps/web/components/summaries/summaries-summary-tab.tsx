"use client";

import { Banknote, ClipboardList, Users } from "lucide-react";
import { OverviewStatCard } from "@/components/dashboard/overview-stat-card";
import { ReportTotalsCard } from "@/components/reports/report-totals-card";
import { attendanceTotal } from "@/components/summaries/summaries-shared";
import { MonthlySummaryItem } from "@/lib/api";
import { formatNaira } from "@/lib/format";

interface SummariesSummaryTabProps {
  summary: MonthlySummaryItem;
}

export function SummariesSummaryTab({ summary }: SummariesSummaryTabProps) {
  const attendance = attendanceTotal(summary.totals);
  const financeTotal =
    summary.totals.tithe + summary.totals.offering + summary.totals.other;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStatCard
          icon={Users}
          label="Total attendance"
          value={attendance}
          hint={`${summary.totals.men} men · ${summary.totals.women} women · ${summary.totals.youth} youth · ${summary.totals.children} children`}
          iconTone="info"
        />
        <OverviewStatCard
          icon={Banknote}
          label="Total finance"
          value={formatNaira(financeTotal, summary.totals.currency)}
          hint={`Tithe ${formatNaira(summary.totals.tithe, summary.totals.currency)}`}
          iconTone="primary"
        />
        <OverviewStatCard
          icon={ClipboardList}
          label="Weekly reports"
          value={summary.coverage.weeklyReports}
          hint={`${summary.weeks.length} week${summary.weeks.length === 1 ? "" : "s"} with data`}
          iconTone="success"
        />
        <OverviewStatCard
          icon={Users}
          label="Branch coverage"
          value={`${summary.coverage.branchesReporting}/${summary.coverage.branchesTotal}`}
          hint="Branches that submitted at least one report"
          iconTone="warning"
        />
      </div>

      <ReportTotalsCard
        title="Detailed totals"
        attendance={{
          adultCount: summary.totals.adult,
          teenageCount: summary.totals.teenage,
          childrenCount: summary.totals.children,
          menCount: summary.totals.men,
          womenCount: summary.totals.women,
          youthCount: summary.totals.youth,
          midweekAttendance: 0,
          firstTimeVisitors: summary.totals.visitors,
          newConverts: summary.totals.converts,
          followUpVisits: 0,
          unitsActive: 0,
          outreachHeld: 0,
        }}
        finance={{
          tithe: summary.totals.tithe,
          offering: summary.totals.offering,
          other: summary.totals.other,
          currency: summary.totals.currency,
        }}
      />
    </div>
  );
}
