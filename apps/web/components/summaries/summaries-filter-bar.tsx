"use client";

import { SummaryScopeType } from "@repo/types";
import { BarChart3, CalendarDays, LayoutGrid, Table2 } from "lucide-react";
import { MonthlySummaryScopeOption } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { toMonthInputValue } from "@/components/summaries/summaries-shared";

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

  const hasActiveFilters =
    filters.view !== "summary" || filters.scope === "state" || filters.stateId;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="summary-period">Reporting period</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="summary-period"
                type="month"
                className="h-10 w-44 pl-9"
                value={toMonthInputValue(filters.month, filters.year)}
                onChange={(event) => {
                  const match = /^(\d{4})-(\d{2})$/.exec(event.target.value);
                  if (!match) return;
                  onPeriodChange(Number(match[2]), Number(match[1]));
                }}
              />
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
