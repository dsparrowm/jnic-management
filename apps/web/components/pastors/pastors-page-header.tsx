import { LayoutGrid, Table2, UserPlus } from "lucide-react";
import { PastorListSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PastorsPageHeaderProps {
  summary: PastorListSummary | null;
  view: "table" | "cards";
  onViewChange: (view: "table" | "cards") => void;
  onOnboardClick: () => void;
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-border bg-background px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>{" "}
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function PastorsPageHeader({
  summary,
  view,
  onViewChange,
  onOnboardClick,
}: PastorsPageHeaderProps) {
  return (
    <div className="border-b border-border px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Pastor directory
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Pastors</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Browse and manage pastor accounts — filter by organisation, resend onboarding links,
            or deactivate access.
          </p>
          {summary && (
            <div className="flex flex-wrap gap-2 pt-1">
              <SummaryChip label="Total" value={summary.total} />
              <SummaryChip label="Active" value={summary.active} />
              <SummaryChip label="Pending" value={summary.pending} />
              <SummaryChip label="Deactivated" value={summary.deactivated} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => onViewChange("table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Table2 className="h-4 w-4" />
              Table
            </button>
            <button
              type="button"
              onClick={() => onViewChange("cards")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === "cards"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </button>
          </div>
          <Button type="button" onClick={onOnboardClick}>
            <UserPlus className="h-4 w-4" />
            Onboard pastor
          </Button>
        </div>
      </div>
    </div>
  );
}
