"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface OrgZoneOption {
  id: string;
  name: string;
  stateName?: string;
}

interface OrgZonePickerProps {
  zones: OrgZoneOption[];
  value: string;
  onChange: (zoneId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showStatePrefix?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function OrgZonePicker({
  zones,
  value,
  onChange,
  placeholder = "Select zone",
  disabled = false,
  showStatePrefix = false,
  allowEmpty = false,
  emptyLabel = "No zone",
}: OrgZonePickerProps) {
  return (
    <Select
      value={allowEmpty ? value || "__none__" : value || undefined}
      onValueChange={(next) => onChange(next === "__none__" ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
        {allowEmpty ? <SelectItem value="__none__">{emptyLabel}</SelectItem> : null}
        {zones.map((zone) => (
          <SelectItem key={zone.id} value={zone.id}>
            {showStatePrefix && zone.stateName
              ? `${zone.stateName} → ${zone.name}`
              : zone.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
