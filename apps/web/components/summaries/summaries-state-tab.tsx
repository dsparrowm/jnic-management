"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { attendanceTotal } from "@/components/summaries/summaries-shared";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { MonthlySummaryStateRow } from "@/lib/api";
import { formatNaira } from "@/lib/format";

type StateSortKey = "name" | "attendance" | "tithe";

interface SummariesStateTabProps {
  states: MonthlySummaryStateRow[];
  onStateSelect?: (stateId: string) => void;
}

export function SummariesStateTab({ states, onStateSelect }: SummariesStateTabProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<StateSortKey>("name");

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? states.filter((state) => state.stateName.toLowerCase().includes(query))
      : states;

    return [...filtered].sort((a, b) => {
      if (sortBy === "attendance") {
        return attendanceTotal(b.totals) - attendanceTotal(a.totals);
      }
      if (sortBy === "tithe") {
        return b.totals.tithe - a.totals.tithe;
      }
      return a.stateName.localeCompare(b.stateName);
    });
  }, [search, sortBy, states]);

  if (states.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        No state-level data for this period.
      </p>
    );
  }

  return (
    <DashboardPanel
      title="By state"
      description="Monthly attendance and finance rolled up from branch weekly reports in each state."
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search states..."
            className="h-10 pl-9"
          />
        </div>
        <NativeSelect
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as StateSortKey)}
          className="h-10 w-full sm:w-44"
        >
          <option value="name">Sort by name</option>
          <option value="attendance">Sort by attendance</option>
          <option value="tithe">Sort by tithe</option>
        </NativeSelect>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Branches</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Tithe</th>
              <th className="px-4 py-3 font-medium">Offering</th>
              <th className="px-4 py-3 font-medium">Other</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((state) => (
              <tr key={state.stateId} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">
                  {onStateSelect ? (
                    <button
                      type="button"
                      onClick={() => onStateSelect(state.stateId)}
                      className="text-left text-primary hover:underline"
                    >
                      {state.stateName}
                    </button>
                  ) : (
                    state.stateName
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {state.branchesReporting} of {state.branchesTotal}
                  <span className="block text-xs">
                    {state.weeklyReports} weekly report
                    {state.weeklyReports === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {attendanceTotal(state.totals)}
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {formatNaira(state.totals.tithe, state.totals.currency)}
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {formatNaira(state.totals.offering, state.totals.currency)}
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {formatNaira(state.totals.other, state.totals.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
