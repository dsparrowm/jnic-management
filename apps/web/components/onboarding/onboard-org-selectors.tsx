"use client";

import {
  Role,
  allowsOptionalBranch,
  allowsOptionalZone,
  requiresBranchId,
  requiresStateId,
  requiresZoneId,
} from "@repo/types";
import { OrgBranchPicker } from "@/components/org/org-branch-picker";
import { OrgStatePicker } from "@/components/org/org-state-picker";
import { OrgZonePicker } from "@/components/org/org-zone-picker";
import { OrgState } from "@/lib/api";
import { Label } from "@/components/ui/label";

export interface OnboardOrgValues {
  role: Role;
  stateId: string;
  zoneId: string;
  branchId: string;
}

interface OnboardOrgSelectorsProps {
  orgTree: OrgState[];
  values: OnboardOrgValues;
  onChange: (values: OnboardOrgValues) => void;
}

function findBranchInTree(orgTree: OrgState[], branchId: string) {
  for (const state of orgTree) {
    for (const zone of state.zones) {
      const branch = zone.branches.find((b) => b.id === branchId);
      if (branch) {
        return { stateId: state.id, zoneId: zone.id, branchId: branch.id };
      }
    }
  }
  return null;
}

export function OnboardOrgSelectors({ orgTree, values, onChange }: OnboardOrgSelectorsProps) {
  const showState = requiresStateId(values.role);
  const showZone = requiresZoneId(values.role) || allowsOptionalZone(values.role);
  const zoneRequired = requiresZoneId(values.role);
  const showBranchRequired = requiresBranchId(values.role);
  const showBranchOptional = allowsOptionalBranch(values.role);

  const selectedState = orgTree.find((s) => s.id === values.stateId);
  const zonesForState = selectedState?.zones ?? [];
  const branchesForZone =
    zonesForState.find((z) => z.id === values.zoneId)?.branches ?? [];
  const branchesForState = zonesForState.flatMap((z) =>
    z.branches.map((b) => ({ ...b, zoneName: z.name })),
  );
  const branchOptions =
    values.role === Role.STATE_PASTOR && !values.zoneId
      ? branchesForState
      : branchesForZone.map((b) => ({
          ...b,
          zoneName: zonesForState.find((z) => z.id === values.zoneId)?.name,
        }));

  function handleBranchChange(branchId: string) {
    if (!branchId) {
      onChange({ ...values, branchId: "" });
      return;
    }
    const resolved = findBranchInTree(orgTree, branchId);
    if (resolved) {
      onChange({ ...values, ...resolved });
    } else {
      onChange({ ...values, branchId });
    }
  }

  if (orgTree.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        No organisation states found. Add states, zones, and branches on the Organisation page
        first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {showState && (
        <div className="space-y-2">
          <Label>
            State<span className="text-destructive"> *</span>
          </Label>
          <OrgStatePicker
            orgTree={orgTree}
            value={values.stateId}
            onChange={(stateId) =>
              onChange({ ...values, stateId, zoneId: "", branchId: "" })
            }
            placeholder="Select state"
          />
        </div>
      )}

      {showZone && (
        <div className="space-y-2">
          <Label>
            Zone
            {zoneRequired ? (
              <span className="text-destructive"> *</span>
            ) : (
              <span className="font-normal text-muted-foreground"> (optional)</span>
            )}
          </Label>
          {values.stateId && zonesForState.length === 0 ? (
            <p className="text-sm text-muted-foreground">No zones in this state yet.</p>
          ) : (
            <OrgZonePicker
              zones={zonesForState.map((z) => ({ id: z.id, name: z.name }))}
              value={values.zoneId}
              onChange={(zoneId) => onChange({ ...values, zoneId, branchId: "" })}
              disabled={!values.stateId}
              placeholder={zoneRequired ? "Select zone" : "No zone"}
            />
          )}
        </div>
      )}

      {showBranchRequired && (
        <div className="space-y-2">
          <Label>
            Branch<span className="text-destructive"> *</span>
          </Label>
          {values.zoneId && branchesForZone.length === 0 ? (
            <p className="text-sm text-muted-foreground">No branches in this zone yet.</p>
          ) : (
            <OrgBranchPicker
              branches={branchesForZone.map((b) => ({ id: b.id, name: b.name }))}
              value={values.branchId}
              onChange={handleBranchChange}
              disabled={!values.zoneId}
              placeholder="Select branch"
            />
          )}
        </div>
      )}

      {showBranchOptional && (
        <div className="space-y-2">
          <Label>Home branch (optional)</Label>
          <OrgBranchPicker
            branches={branchOptions.map((b) => ({
              id: b.id,
              name: b.name,
              zoneName: "zoneName" in b ? b.zoneName : undefined,
            }))}
            value={values.branchId}
            onChange={handleBranchChange}
            disabled={!values.stateId}
            allowEmpty
            emptyLabel="No home branch"
            showZonePrefix={values.role === Role.STATE_PASTOR && !values.zoneId}
            placeholder="No home branch"
          />
          <p className="text-xs text-muted-foreground">
            Optional home branch — enables weekly report submission.
          </p>
        </div>
      )}
    </div>
  );
}
