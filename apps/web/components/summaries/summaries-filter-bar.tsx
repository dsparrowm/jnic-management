"use client";

import { SummaryScopeType, getTodayInLagos } from "@repo/types";
import { BarChart3, LayoutGrid, Table2 } from "lucide-react";
import { MonthlySummaryScopeOption } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { MONTH_NAMES } from "@/components/summaries/summaries-shared";

export type SummariesView = "summary" | "states" | "weekly";

export interface SummariesFilterValues {
  month: number;
  year: number;
  scope: "hq" | "state";
  stateId: string;
  view: SummariesView;
}

interface SummariesFilterBarProps {
  filters: SummariesFilterValues;
  scopeOptions?: MonthlySummaryScopeOption[];
  showScopeFilter: boolean;
  showStatesTab: boolean;
  onPeriodChange: (month: number, year: number) => void;
  onScopeChange: (scope: "hq" | "state", stateId: string) => void;
  onViewChange: (view: SummariesView) => void;
  onReset: () => void;
}

const VIEW_OPTIONS: Array<{ id: SummariesView; label: string; icon: typeof LayoutGrid }> = [
  { id: "summary", label: "Summary", icon: LayoutGrid },
  { id: "states", label: "By state", icon: BarChart3 },
  { id: "weekly", label: "Weekly", icon: Table2 },
];

function currentMonthYear() {
  const today = getTodayInLagos();
  const [year, month] = today.split("-").map(Number);
  return { month, year };
}

export function SummariesFilterBar({
  filters,
  scopeOptions,
  showScopeFilter,
  showStatesTab,
  onPeriodChange,
  onScopeChange,
  onViewChange,
  onReset,
}: SummariesFilterBarProps) {
  const visibleViews = VIEW_OPTIONS.filter((option) =>
    option.id === "states" ? showStatesTab : true,
  );

  const scopeValue =
    filters.scope === "state" && filters.stateId
      ? `state:${filters.stateId}`
      : "hq";

  const current = currentMonthYear();
  const yearOptions = Array.from({ length: 5 }, (_, index) => current.year - index);
  const isCurrentPeriod = filters.month === current.month && filters.year === current.year;

  const hasActiveFilters =
    filters.view !== "summary" || filters.scope === "state" || filters.stateId || !isCurrentPeriod;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Reporting period</Label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-input bg-background shadow-sm">
                <NativeSelect
                  id="summary-month"
                  aria-label="Month"
                  className="h-10 min-w-[8.5rem] rounded-none border-0 border-r border-input shadow-none focus-visible:ring-0"
                  value={String(filters.month)}
                  onChange={(event) => onPeriodChange(Number(event.target.value), filters.year)}
                >
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={String(index + 1)}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  id="summary-year"
                  aria-label="Year"
                  className="h-10 w-[5.5rem] rounded-none border-0 shadow-none focus-visible:ring-0"
                  value={String(filters.year)}
                  onChange={(event) => onPeriodChange(filters.month, Number(event.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {!isCurrentPeriod ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 text-primary"
                  onClick={() => onPeriodChange(current.month, current.year)}
                >
                  This month
                </Button>
              ) : null}
            </div>
          </div>

          {showScopeFilter && scopeOptions && scopeOptions.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="summary-scope">Scope</Label>
              <NativeSelect
                id="summary-scope"
                className="h-10 min-w-[12rem]"
                value={scopeValue}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "hq") {
                    onScopeChange("hq", "");
                    return;
                  }
                  const stateId = value.replace("state:", "");
                  onScopeChange("state", stateId);
                }}
              >
                {scopeOptions.map((option) => (
                  <option
                    key={`${option.scopeType}:${option.scopeId}`}
                    value={
                      option.scopeType === SummaryScopeType.HQ
                        ? "hq"
                        : `state:${option.scopeId}`
                    }
                  >
                    {option.scopeName}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-background p-1">
            {visibleViews.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onViewChange(option.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    filters.view === option.id
                      ? "bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={onReset}>
              Reset
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
