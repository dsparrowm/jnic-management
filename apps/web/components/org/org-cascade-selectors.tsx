import { OrgStatePicker } from "@/components/org/org-state-picker";
import { OrgZonePicker } from "@/components/org/org-zone-picker";
import { OrgState } from "@/lib/api";
import { Label } from "@/components/ui/label";

export interface OrgCascadeValues {
  stateId: string;
  zoneId: string;
}

interface OrgCascadeSelectorsProps {
  orgTree: OrgState[];
  values: OrgCascadeValues;
  onChange: (values: OrgCascadeValues) => void;
  stateRequired?: boolean;
  zoneRequired?: boolean;
  stateOptional?: boolean;
  showZone?: boolean;
  stateLabel?: string;
  zoneLabel?: string;
}

export function OrgCascadeSelectors({
  orgTree,
  values,
  onChange,
  stateRequired = false,
  zoneRequired = false,
  stateOptional = false,
  showZone = true,
  stateLabel = "State",
  zoneLabel = "Zone",
}: OrgCascadeSelectorsProps) {
  const zones = values.stateId
    ? (orgTree.find((s) => s.id === values.stateId)?.zones ?? [])
    : [];

  const showAllZones = !values.stateId;
  const allZoneOptions = showAllZones
    ? orgTree.flatMap((s) => s.zones.map((z) => ({ id: z.id, name: z.name, stateName: s.name })))
    : zones.map((z) => ({ id: z.id, name: z.name }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          {stateLabel}
          {stateRequired && <span className="text-destructive"> *</span>}
          {stateOptional && (
            <span className="font-normal text-muted-foreground"> (optional filter)</span>
          )}
        </Label>
        <OrgStatePicker
          orgTree={orgTree}
          value={values.stateId}
          onChange={(stateId) => onChange({ stateId, zoneId: "" })}
          placeholder={stateOptional ? "All states" : "Select state"}
          allowEmpty={stateOptional}
          emptyLabel="All states"
        />
      </div>

      {showZone && (
        <div className="space-y-2">
          <Label>
            {zoneLabel}
            {zoneRequired && <span className="text-destructive"> *</span>}
          </Label>
          <OrgZonePicker
            zones={allZoneOptions}
            value={values.zoneId}
            onChange={(zoneId) => onChange({ ...values, zoneId })}
            disabled={stateRequired && !values.stateId}
            showStatePrefix={showAllZones}
          />
        </div>
      )}
    </div>
  );
}
