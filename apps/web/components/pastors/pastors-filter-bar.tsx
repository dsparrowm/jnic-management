import { Role, UserStatus } from "@repo/types";
import { Search, X } from "lucide-react";
import { allOrgStates, DirectorateRecord, OrgTreeResponse } from "@/lib/api";
import { formatRole } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export interface PastorFilterValues {
  search: string;
  regionId: string;
  stateId: string;
  zoneId: string;
  districtId: string;
  branchId: string;
  directorateId: string;
  role: string;
  status: string;
}

interface PastorsFilterBarProps {
  filters: PastorFilterValues;
  orgTree: OrgTreeResponse;
  directorates: DirectorateRecord[];
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof PastorFilterValues, value: string) => void;
  onReset: () => void;
}

const ROLES = Object.values(Role);
const STATUSES = Object.values(UserStatus);

export function PastorsFilterBar({
  filters,
  orgTree,
  directorates,
  onSearchChange,
  onFilterChange,
  onReset,
}: PastorsFilterBarProps) {
  const states = allOrgStates(orgTree);
  const state = states.find((s) => s.id === filters.stateId);
  const zones = state?.zones ?? [];
  const zone = zones.find((z) => z.id === filters.zoneId);
  const districts = zone?.districts ?? [];
  const district = districts.find((d) => d.id === filters.districtId);
  const branches = filters.districtId
    ? (district?.branches ?? [])
    : [...(zone?.branches ?? []), ...districts.flatMap((d) => d.branches)];

  const hasActiveFilters =
    filters.search ||
    filters.regionId ||
    filters.stateId ||
    filters.zoneId ||
    filters.districtId ||
    filters.branchId ||
    filters.directorateId ||
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
        <NativeSelect
          value={filters.regionId}
          onChange={(e) => onFilterChange("regionId", e.target.value)}
        >
          <option value="">All regions</option>
          {orgTree.regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filters.stateId}
          onChange={(e) => {
            onFilterChange("stateId", e.target.value);
            onFilterChange("zoneId", "");
            onFilterChange("districtId", "");
            onFilterChange("branchId", "");
          }}
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filters.zoneId}
          onChange={(e) => {
            onFilterChange("zoneId", e.target.value);
            onFilterChange("districtId", "");
            onFilterChange("branchId", "");
          }}
          disabled={!filters.stateId}
        >
          <option value="">All zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filters.districtId}
          onChange={(e) => {
            onFilterChange("districtId", e.target.value);
            onFilterChange("branchId", "");
          }}
          disabled={!filters.zoneId}
        >
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filters.branchId}
          onChange={(e) => onFilterChange("branchId", e.target.value)}
          disabled={!filters.zoneId}
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filters.directorateId}
          onChange={(e) => onFilterChange("directorateId", e.target.value)}
        >
          <option value="">All directorates</option>
          {directorates.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filters.role}
          onChange={(e) => onFilterChange("role", e.target.value)}
        >
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {formatRole(role)}
            </option>
          ))}
        </NativeSelect>
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
