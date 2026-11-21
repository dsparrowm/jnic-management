"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { allOrgStates, OrgTreeResponse } from "@/lib/api";

const EMPTY_VALUE = "__none__";

interface NamedOption {
  id: string;
  name: string;
  prefix?: string;
}

function Picker({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  allowEmpty = false,
  emptyLabel = "None",
}: {
  options: NamedOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Select
      value={allowEmpty ? value || EMPTY_VALUE : value || undefined}
      onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
        {allowEmpty && <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.prefix ? `${o.prefix} → ${o.name}` : o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface OrgCascadeValues {
  regionId: string;
  stateId: string;
  zoneId: string;
  districtId: string;
}

export const emptyCascadeValues: OrgCascadeValues = {
  regionId: "",
  stateId: "",
  zoneId: "",
  districtId: "",
};

interface OrgCascadeSelectorsProps {
  orgTree: OrgTreeResponse;
  values: OrgCascadeValues;
  onChange: (values: OrgCascadeValues) => void;
  showRegion?: boolean;
  showZone?: boolean;
  showDistrict?: boolean;
  regionRequired?: boolean;
  stateRequired?: boolean;
  zoneRequired?: boolean;
  districtRequired?: boolean;
  stateOptional?: boolean;
}

export function OrgCascadeSelectors({
  orgTree,
  values,
  onChange,
  showRegion = true,
  showZone = true,
  showDistrict = false,
  regionRequired = false,
  stateRequired = false,
  zoneRequired = false,
  districtRequired = false,
  stateOptional = false,
}: OrgCascadeSelectorsProps) {
  const regionOptions = orgTree.regions.map((r) => ({ id: r.id, name: r.name }));
  const states = allOrgStates(orgTree);
  const stateOptions = values.regionId
    ? (orgTree.regions.find((r) => r.id === values.regionId)?.states ?? states).map((s) => ({
        id: s.id,
        name: s.name,
      }))
    : states.map((s) => ({ id: s.id, name: s.name }));

  const state = states.find((s) => s.id === values.stateId);
  const zoneOptions = (state?.zones ?? []).map((z) => ({ id: z.id, name: z.name }));
  const zone = state?.zones.find((z) => z.id === values.zoneId);
  const districtOptions = (zone?.districts ?? []).map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="space-y-4">
      {showRegion && (
        <div className="space-y-2">
          <Label>
            Region
            {regionRequired && <span className="text-destructive"> *</span>}
          </Label>
          <Picker
            options={regionOptions}
            value={values.regionId}
            onChange={(regionId) =>
              onChange({ regionId, stateId: "", zoneId: "", districtId: "" })
            }
            placeholder="Select region"
            allowEmpty={!regionRequired}
            emptyLabel="No region"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>
          State
          {stateRequired && <span className="text-destructive"> *</span>}
          {stateOptional && (
            <span className="font-normal text-muted-foreground"> (optional filter)</span>
          )}
        </Label>
        <Picker
          options={stateOptions}
          value={values.stateId}
          onChange={(stateId) => onChange({ ...values, stateId, zoneId: "", districtId: "" })}
          placeholder={stateOptional ? "All states" : "Select state"}
          allowEmpty={stateOptional}
          emptyLabel="All states"
          disabled={regionRequired && !values.regionId}
        />
      </div>

      {showZone && (
        <div className="space-y-2">
          <Label>
            Zone
            {zoneRequired && <span className="text-destructive"> *</span>}
          </Label>
          <Picker
            options={zoneOptions}
            value={values.zoneId}
            onChange={(zoneId) => onChange({ ...values, zoneId, districtId: "" })}
            placeholder={zoneRequired ? "Select zone" : "No zone"}
            allowEmpty={!zoneRequired}
            emptyLabel="No zone"
            disabled={!values.stateId}
          />
        </div>
      )}

      {showDistrict && (
        <div className="space-y-2">
          <Label>
            District
            {districtRequired && <span className="text-destructive"> *</span>}
          </Label>
          <Picker
            options={districtOptions}
            value={values.districtId}
            onChange={(districtId) => onChange({ ...values, districtId })}
            placeholder={districtRequired ? "Select district" : "No district"}
            allowEmpty={!districtRequired}
            emptyLabel="No district"
            disabled={!values.zoneId}
          />
        </div>
      )}
    </div>
  );
}
