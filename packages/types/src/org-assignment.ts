import { Role } from "./role";

export type OrgAssignmentInput = {
  regionId?: string | null;
  stateId?: string | null;
  zoneId?: string | null;
  districtId?: string | null;
  branchId?: string | null;
};

export type ResolvedOrgAssignment = {
  regionId: string | null;
  stateId: string | null;
  zoneId: string | null;
  districtId: string | null;
  branchId: string | null;
};

const PASTOR_ROLES = new Set<Role>([
  Role.REGIONAL_PASTOR,
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.DISTRICT_PASTOR,
  Role.BRANCH_PASTOR,
]);

export const WEEKLY_REPORT_SUBMITTER_ROLES: Role[] = [
  Role.REGIONAL_PASTOR,
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.DISTRICT_PASTOR,
  Role.BRANCH_PASTOR,
];

export function canSubmitWeeklyReports(
  role: Role,
  branchId: string | null | undefined,
): boolean {
  return Boolean(branchId) && WEEKLY_REPORT_SUBMITTER_ROLES.includes(role);
}

export function requiresRegionId(role: Role): boolean {
  return role === Role.REGIONAL_PASTOR;
}

export function requiresStateId(role: Role): boolean {
  return (
    role === Role.STATE_PASTOR ||
    role === Role.ZONAL_PASTOR ||
    role === Role.BRANCH_PASTOR
  );
}

export function requiresZoneId(role: Role): boolean {
  return role === Role.ZONAL_PASTOR || role === Role.BRANCH_PASTOR;
}

export function requiresDistrictId(role: Role): boolean {
  return role === Role.DISTRICT_PASTOR;
}

export function requiresBranchId(role: Role): boolean {
  return role === Role.BRANCH_PASTOR;
}

/**
 * Territorial pastors may additionally serve a branch as its pastor;
 * a MEMBER may carry a branch as the seat of their service unit.
 */
export function allowsOptionalBranch(role: Role): boolean {
  return (
    role === Role.REGIONAL_PASTOR ||
    role === Role.STATE_PASTOR ||
    role === Role.ZONAL_PASTOR ||
    role === Role.DISTRICT_PASTOR ||
    role === Role.MEMBER
  );
}

/** Client-side structural validation before API call. */
export function validateOrgAssignmentStructure(
  role: Role,
  input: OrgAssignmentInput,
): string | null {
  const regionId = input.regionId?.trim() || null;
  const stateId = input.stateId?.trim() || null;
  const zoneId = input.zoneId?.trim() || null;
  const districtId = input.districtId?.trim() || null;
  const branchId = input.branchId?.trim() || null;

  if (role === Role.MEMBER) {
    // Directorate-only member: no territorial seat required; an optional
    // branch pins the service unit they coordinate.
    return null;
  }

  if (!PASTOR_ROLES.has(role)) {
    return "Invalid role for org assignment";
  }

  if (requiresRegionId(role) && !regionId) {
    return "Region is required for this role";
  }

  if (requiresStateId(role) && !stateId) {
    return "State is required for this role";
  }

  if (requiresZoneId(role) && !zoneId) {
    return "Zone is required for this role";
  }

  if (requiresDistrictId(role) && !districtId) {
    return "District is required for this role";
  }

  if (requiresBranchId(role) && !branchId) {
    return "Branch is required for this role";
  }

  if (zoneId && !stateId) {
    return "State is required when a zone is assigned";
  }

  return null;
}
