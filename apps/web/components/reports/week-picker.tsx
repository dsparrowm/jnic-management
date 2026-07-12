"use client";

import { computeWeekOf } from "@repo/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WeekPickerProps {
  weekOf: string;
  onWeekOfChange: (weekOf: string) => void;
}

export function WeekPicker({ weekOf, onWeekOfChange }: WeekPickerProps) {
  return (
    <div className="max-w-xs space-y-2">
      <Label htmlFor="weekOf">Week ending</Label>
      <Input
        id="weekOf"
        type="date"
        value={weekOf}
        onChange={(event) => onWeekOfChange(computeWeekOf(event.target.value))}
      />
    </div>
  );
}
