"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgState } from "@/lib/api";

const EMPTY_VALUE = "__none__";

interface OrgStatePickerProps {
  orgTree: OrgState[];
  value: string;
  onChange: (stateId: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
}

export function OrgStatePicker({
  orgTree,
  value,
  onChange,
  placeholder = "Select state",
  allowEmpty = false,
  emptyLabel = "All states",
  disabled = false,
}: OrgStatePickerProps) {
  return (
    <Select
      value={value || (allowEmpty ? EMPTY_VALUE : undefined)}
      onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
        {allowEmpty && <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>}
        {orgTree.map((state) => (
          <SelectItem key={state.id} value={state.id}>
            {state.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
