"use client";

import { useEffect } from "react";
import {
  Role,
  allowsOptionalBranch,
  requiresBranchId,
  requiresDistrictId,
  requiresRegionId,
  requiresStateId,
  requiresZoneId,
} from "@repo/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgBranchPicker } from "@/components/org/org-branch-picker";
import { OrgStatePicker } from "@/components/org/org-state-picker";
import { OrgZonePicker } from "@/components/org/org-zone-picker";
import { allOrgStates, OrgTreeResponse } from "@/lib/api";
import { Label } from "@/components/ui/label";

export interface OnboardOrgValues {
  role: Role;
  regionId: string;
  stateId: string;
  zoneId: string;
  districtId: string;
  branchId: string;
}

interface OnboardOrgSelectorsProps {
  orgTree: OrgTreeResponse;
  values: OnboardOrgValues;
  onChange: (patch: Partial<OnboardOrgValues>) => void;
}

const NONE = "__none__";

function findBranchInTree(orgTree: OrgTreeResponse, branchId: string) {
  for (const state of allOrgStates(orgTree)) {
    const loose = state.branches.find((b) => b.id === branchId);
    if (loose) {
      return { stateId: state.id, zoneId: "", districtId: "", branchId: loose.id };
    }
    for (const zone of state.zones) {
      const unzoned = zone.branches.find((b) => b.id === branchId);
      if (unzoned) {
        return { stateId: state.id, zoneId: zone.id, districtId: "", branchId: unzoned.id };
      }
      for (const district of zone.districts) {
        const inDistrict = district.branches.find((b) => b.id === branchId);
        if (inDistrict) {
          return {
            stateId: state.id,
            zoneId: zone.id,
            districtId: district.id,
            branchId: inDistrict.id,
          };
        }
      }
    }
  }
  return null;
}

/** Keep valid org selections when switching pastor role; avoid stale Radix Select display. */
export function adaptOrgFieldsForRole(
  current: OnboardOrgValues,
  newRole: Role,
  orgTree: OrgTreeResponse,
): Pick<OnboardOrgValues, "regionId" | "stateId" | "zoneId" | "districtId" | "branchId"> {
  const states = allOrgStates(orgTree);
  const regionStillValid =
    Boolean(current.regionId) && orgTree.regions.some((r) => r.id === current.regionId);
  const regionId = requiresRegionId(newRole) && regionStillValid ? current.regionId : "";

  const stateStillValid =
    Boolean(current.stateId) && states.some((s) => s.id === current.stateId);
  const needsState = requiresStateId(newRole) || requiresDistrictId(newRole);
  let stateId = "";
  if (needsState) {
    if (stateStillValid) {
      stateId = current.stateId;
    } else if (states.length === 1) {
      stateId = states[0].id;
    }
  }

  const zones = stateId ? (states.find((s) => s.id === stateId)?.zones ?? []) : [];
  const zoneStillValid =
    Boolean(current.zoneId) && zones.some((z) => z.id === current.zoneId);
  const needsZone = requiresZoneId(newRole) || requiresDistrictId(newRole);
  const zoneId = stateId && zoneStillValid && needsZone ? current.zoneId : "";

  const districts = zoneId
    ? (zones.find((z) => z.id === zoneId)?.districts ?? [])
    : [];
  const districtStillValid =
    Boolean(current.districtId) && districts.some((d) => d.id === current.districtId);
  const districtId =
    zoneId && districtStillValid && requiresDistrictId(newRole) ? current.districtId : "";

  let branchId = "";
  if ((requiresBranchId(newRole) || allowsOptionalBranch(newRole)) && current.branchId) {
    branchId = current.branchId;
  }

  return { regionId, stateId, zoneId, districtId, branchId };
}

export function OnboardOrgSelectors({ orgTree, values, onChange }: OnboardOrgSelectorsProps) {
  const states = allOrgStates(orgTree);
  const showRegion = requiresRegionId(values.role);
  const showState = requiresStateId(values.role) || requiresDistrictId(values.role);
  const showZone = requiresZoneId(values.role) || requiresDistrictId(values.role);
  const showDistrict = requiresDistrictId(values.role);
  const showBranchRequired = requiresBranchId(values.role);
  const showBranchOptional = allowsOptionalBranch(values.role);

  useEffect(() => {
    if (showState && !values.stateId && states.length === 1) {
      onChange({ stateId: states[0].id, zoneId: "", districtId: "", branchId: "" });
    }
  }, [showState, values.stateId, states, onChange]);

  function applyChange(patch: Partial<OnboardOrgValues>) {
    onChange(patch);
  }

  const selectedState = states.find((s) => s.id === values.stateId);
  const zonesForState = selectedState?.zones ?? [];
  const selectedZone = zonesForState.find((z) => z.id === values.zoneId);
  const districtsForZone = selectedZone?.districts ?? [];

  const branchesInZone = [
    ...(selectedZone?.branches ?? []),
    ...districtsForZone.flatMap((d) => d.branches),
  ];

  type BranchOption = { id: string; name: string; zoneName?: string };

  const branchesForState: BranchOption[] = [
    ...zonesForState.flatMap((z) => [
      ...z.branches.map((b) => ({ id: b.id, name: b.name, zoneName: z.name })),
      ...z.districts.flatMap((d) =>
        d.branches.map((b) => ({ id: b.id, name: b.name, zoneName: `${z.name} · ${d.name}` })),
      ),
    ]),
    ...(selectedState?.branches ?? []).map((b) => ({ id: b.id, name: b.name })),
  ];

  const branchesForRegion: BranchOption[] = orgTree.regions
    .filter((r) => r.id === values.regionId)
    .flatMap((r) =>
      r.states.flatMap((s) => [
        ...s.branches.map((b) => ({ id: b.id, name: b.name, zoneName: s.name })),
        ...s.zones.flatMap((z) => [
          ...z.branches.map((b) => ({ id: b.id, name: b.name, zoneName: `${s.name} · ${z.name}` })),
          ...z.districts.flatMap((d) =>
            d.branches.map((b) => ({ id: b.id, name: b.name, zoneName: `${s.name} · ${d.name}` })),
          ),
        ]),
      ]),
    );

  const branchOptions: BranchOption[] =
    values.role === Role.STATE_PASTOR
      ? branchesForState
      : values.role === Role.REGIONAL_PASTOR
        ? branchesForRegion
        : branchesInZone.map((b) => ({ id: b.id, name: b.name }));

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
      if (values.role === Role.REGIONAL_PASTOR) {
        applyChange({ branchId: resolved.branchId });
        return;
      }
      applyChange(resolved);
      return;
    }
    applyChange({ branchId });
  }

  if (states.length === 0 && orgTree.regions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        No organisation found. Add regions, states, zones, districts and branches on the
        Organisation page first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {showRegion && (
        <div className="space-y-2">
          <Label>
            Region<span className="text-destructive"> *</span>
          </Label>
          <Select
            value={values.regionId || undefined}
            onValueChange={(regionId) => applyChange({ regionId })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
              {orgTree.regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showState && (
        <div className="space-y-2">
          <Label>
            State<span className="text-destructive"> *</span>
          </Label>
          <OrgStatePicker
            key={`onboard-state-${values.role}`}
            states={states}
            value={values.stateId}
            onChange={(stateId) =>
              applyChange({ stateId, zoneId: "", districtId: "", branchId: "" })
            }
            placeholder="Select state"
          />
        </div>
      )}

      {showZone && (
        <div className="space-y-2">
          <Label>
            Zone{requiresZoneId(values.role) && <span className="text-destructive"> *</span>}
          </Label>
          {values.stateId && zonesForState.length === 0 ? (
            <p className="text-sm text-muted-foreground">No zones in this state yet.</p>
          ) : (
            <OrgZonePicker
              key={`onboard-zone-${values.role}-${values.stateId}`}
              zones={zonesForState.map((z) => ({ id: z.id, name: z.name }))}
              value={values.zoneId}
              onChange={(zoneId) => applyChange({ zoneId, districtId: "", branchId: "" })}
              disabled={!values.stateId}
              placeholder="Select zone"
            />
          )}
        </div>
      )}

      {showDistrict && (
        <div className="space-y-2">
          <Label>
            District<span className="text-destructive"> *</span>
          </Label>
          {values.zoneId && districtsForZone.length === 0 ? (
            <p className="text-sm text-muted-foreground">No districts in this zone yet.</p>
          ) : (
            <Select
              key={`onboard-district-${values.role}-${values.zoneId}`}
              value={values.districtId || undefined}
              onValueChange={(districtId) => applyChange({ districtId })}
              disabled={!values.zoneId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                {districtsForZone.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {showBranchRequired && (
        <div className="space-y-2">
          <Label>
            Branch<span className="text-destructive"> *</span>
          </Label>
          {values.zoneId && branchesInZone.length === 0 ? (
            <p className="text-sm text-muted-foreground">No branches in this zone yet.</p>
          ) : (
            <OrgBranchPicker
              key={`onboard-branch-req-${values.role}-${values.zoneId}-${values.districtId}`}
              branches={branchOptions.map((b) => ({ id: b.id, name: b.name }))}
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
            key={`onboard-branch-opt-${values.role}-${values.stateId}-${values.zoneId}-${values.regionId}`}
            branches={branchOptions.map((b) => ({
              id: b.id,
              name: b.name,
              zoneName: "zoneName" in b ? b.zoneName : undefined,
            }))}
            value={values.branchId}
            onChange={handleBranchChange}
            disabled={
              (values.role === Role.REGIONAL_PASTOR && !values.regionId) ||
              (values.role !== Role.REGIONAL_PASTOR && !values.stateId)
            }
            allowEmpty
            emptyLabel="No home branch"
            showZonePrefix={values.role === Role.STATE_PASTOR || values.role === Role.REGIONAL_PASTOR}
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
