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
}

export function OrgZonePicker({
  zones,
  value,
  onChange,
  placeholder = "Select zone",
  disabled = false,
  showStatePrefix = false,
}: OrgZonePickerProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
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
