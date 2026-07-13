"use client";

import { useEffect } from "react";
import {
  Role,
  allowsOptionalBranch,
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
  onChange: (patch: Partial<OnboardOrgValues>) => void;
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

/** Keep valid org selections when switching pastor role; avoid stale Radix Select display. */
export function adaptOrgFieldsForRole(
  current: OnboardOrgValues,
  newRole: Role,
  orgTree: OrgState[],
): Pick<OnboardOrgValues, "stateId" | "zoneId" | "branchId"> {
  const stateStillValid =
    Boolean(current.stateId) && orgTree.some((s) => s.id === current.stateId);

  let stateId = "";
  if (requiresStateId(newRole)) {
    if (stateStillValid) {
      stateId = current.stateId;
    } else if (orgTree.length === 1) {
      stateId = orgTree[0].id;
    }
  }

  const zones = stateId
    ? (orgTree.find((s) => s.id === stateId)?.zones ?? [])
    : [];
  const zoneStillValid =
    Boolean(current.zoneId) && zones.some((z) => z.id === current.zoneId);

  let zoneId = "";
  if (stateId && zoneStillValid && requiresZoneId(newRole)) {
    zoneId = current.zoneId;
  }

  let branchId = "";
  if (requiresBranchId(newRole) && zoneId) {
    const branches = zones.find((z) => z.id === zoneId)?.branches ?? [];
    if (current.branchId && branches.some((b) => b.id === current.branchId)) {
      branchId = current.branchId;
    }
  }

  return { stateId, zoneId, branchId };
}

export function OnboardOrgSelectors({ orgTree, values, onChange }: OnboardOrgSelectorsProps) {
  const showState = requiresStateId(values.role);

  useEffect(() => {
    if (!showState || values.stateId || orgTree.length !== 1) return;
    onChange({ stateId: orgTree[0].id, zoneId: "", branchId: "" });
  }, [showState, values.role, values.stateId, orgTree, onChange]);

  function applyChange(patch: Partial<OnboardOrgValues>) {
    onChange(patch);
  }

  useEffect(() => {
    if (values.role === Role.STATE_PASTOR && values.zoneId) {
      onChange({ zoneId: "" });
    }
  }, [values.role, values.zoneId, onChange]);

  const showZone = requiresZoneId(values.role);
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
    values.role === Role.STATE_PASTOR
      ? branchesForState
      : branchesForZone.map((b) => ({
          ...b,
          zoneName: zonesForState.find((z) => z.id === values.zoneId)?.name,
        }));

  function handleBranchChange(branchId: string) {
    if (!branchId) {
      applyChange({ branchId: "" });
      return;
    }
    const resolved = findBranchInTree(orgTree, branchId);
    if (resolved) {
      if (values.role === Role.STATE_PASTOR) {
        applyChange({ stateId: resolved.stateId, branchId: resolved.branchId });
        return;
      }
      applyChange(resolved);
      return;
    }
    applyChange({ branchId });
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
            key={`onboard-state-${values.role}`}
            orgTree={orgTree}
            value={values.stateId}
            onChange={(stateId) => applyChange({ stateId, zoneId: "", branchId: "" })}
            placeholder="Select state"
          />
        </div>
      )}

      {showZone && (
        <div className="space-y-2">
          <Label>
            Zone<span className="text-destructive"> *</span>
          </Label>
          {values.stateId && zonesForState.length === 0 ? (
            <p className="text-sm text-muted-foreground">No zones in this state yet.</p>
          ) : (
            <OrgZonePicker
              key={`onboard-zone-${values.role}-${values.stateId}`}
              zones={zonesForState.map((z) => ({ id: z.id, name: z.name }))}
              value={values.zoneId}
              onChange={(zoneId) => applyChange({ zoneId, branchId: "" })}
              disabled={!values.stateId}
              placeholder="Select zone"
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
              key={`onboard-branch-req-${values.role}-${values.zoneId}`}
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
            key={`onboard-branch-opt-${values.role}-${values.stateId}-${values.zoneId}`}
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
            showZonePrefix={values.role === Role.STATE_PASTOR}
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
