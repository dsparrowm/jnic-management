"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_VALUE = "__none__";

export interface OrgBranchOption {
  id: string;
  name: string;
  zoneName?: string;
}

interface OrgBranchPickerProps {
  branches: OrgBranchOption[];
  value: string;
  onChange: (branchId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  showZonePrefix?: boolean;
}

export function OrgBranchPicker({
  branches,
  value,
  onChange,
  placeholder = "Select branch",
  disabled = false,
  allowEmpty = false,
  emptyLabel = "No branch",
  showZonePrefix = false,
}: OrgBranchPickerProps) {
  return (
    <Select
      value={value || (allowEmpty ? EMPTY_VALUE : undefined)}
      onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72 w-[var(--radix-select-trigger-width)]">
        {allowEmpty && <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>}
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {showZonePrefix && branch.zoneName
              ? `${branch.zoneName} → ${branch.name}`
              : branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
