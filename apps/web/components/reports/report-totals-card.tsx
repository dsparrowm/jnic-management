import { WeeklyReportAttendance, WeeklyReportFinance } from "@/lib/api";

interface ReportTotalsCardProps {
  title: string;
  attendance: WeeklyReportAttendance;
  finance: WeeklyReportFinance;
}

export function ReportTotalsCard({ title, attendance, finance }: ReportTotalsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <dt className="text-xs text-muted-foreground">Men</dt>
          <dd className="mt-1 font-mono text-sm font-medium">{attendance.menCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Women</dt>
          <dd className="mt-1 font-mono text-sm font-medium">{attendance.womenCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Youth</dt>
          <dd className="mt-1 font-mono text-sm font-medium">{attendance.youthCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Children</dt>
          <dd className="mt-1 font-mono text-sm font-medium">{attendance.childrenCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Tithe</dt>
          <dd className="mt-1 font-mono text-sm font-medium">
            {finance.tithe.toLocaleString()} {finance.currency}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Offering</dt>
          <dd className="mt-1 font-mono text-sm font-medium">
            {finance.offering.toLocaleString()} {finance.currency}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Other</dt>
          <dd className="mt-1 font-mono text-sm font-medium">
            {finance.other.toLocaleString()} {finance.currency}
          </dd>
        </div>
      </dl>
    </div>
  );
}
