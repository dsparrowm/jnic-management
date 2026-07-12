import { Role, UserStatus } from "@repo/types";
import { Search, X } from "lucide-react";
import { OrgState } from "@/lib/api";
import { formatRole } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PastorFilterValues {
  search: string;
  stateId: string;
  zoneId: string;
  branchId: string;
  role: string;
  status: string;
}

interface PastorsFilterBarProps {
  filters: PastorFilterValues;
  orgTree: OrgState[];
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof PastorFilterValues, value: string) => void;
  onReset: () => void;
}

const ROLES = Object.values(Role);
const STATUSES = Object.values(UserStatus);

export function PastorsFilterBar({
  filters,
  orgTree,
  onSearchChange,
  onFilterChange,
  onReset,
}: PastorsFilterBarProps) {
  const zones = orgTree.find((s) => s.id === filters.stateId)?.zones ?? [];
  const branches = zones.find((z) => z.id === filters.zoneId)?.branches ?? [];

  const hasActiveFilters =
    filters.search ||
    filters.stateId ||
    filters.zoneId ||
    filters.branchId ||
    filters.role ||
    filters.status;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          className="h-10 pl-9 pr-9"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.stateId}
          onChange={(e) => {
            onFilterChange("stateId", e.target.value);
            onFilterChange("zoneId", "");
            onFilterChange("branchId", "");
          }}
        >
          <option value="">All states</option>
          {orgTree.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.zoneId}
          onChange={(e) => {
            onFilterChange("zoneId", e.target.value);
            onFilterChange("branchId", "");
          }}
          disabled={!filters.stateId}
        >
          <option value="">All zones</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.branchId}
          onChange={(e) => onFilterChange("branchId", e.target.value)}
          disabled={!filters.zoneId}
        >
          <option value="">All branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.role}
          onChange={(e) => onFilterChange("role", e.target.value)}
        >
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {formatRole(role)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              onFilterChange("status", filters.status === status ? "" : status)
            }
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filters.status === status
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {formatRole(status)}
          </button>
        ))}
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}
