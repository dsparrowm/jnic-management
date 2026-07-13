import { Role } from "./index";

export type OrgAssignmentInput = {
  stateId?: string | null;
  zoneId?: string | null;
  branchId?: string | null;
};

export type ResolvedOrgAssignment = {
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
};

const PASTOR_ROLES = new Set<Role>([
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.BRANCH_PASTOR,
]);

export const WEEKLY_REPORT_SUBMITTER_ROLES: Role[] = [
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.BRANCH_PASTOR,
];

export function canSubmitWeeklyReports(
  role: Role,
  branchId: string | null | undefined,
): boolean {
  return Boolean(branchId) && WEEKLY_REPORT_SUBMITTER_ROLES.includes(role);
}

export function requiresStateId(role: Role): boolean {
  return PASTOR_ROLES.has(role);
}

export function requiresZoneId(role: Role): boolean {
  return role === Role.ZONAL_PASTOR || role === Role.BRANCH_PASTOR;
}

export function requiresBranchId(role: Role): boolean {
  return role === Role.BRANCH_PASTOR;
}

export function allowsOptionalBranch(role: Role): boolean {
  return role === Role.STATE_PASTOR || role === Role.ZONAL_PASTOR;
}

/** Client-side structural validation before API call. */
export function validateOrgAssignmentStructure(
  role: Role,
  input: OrgAssignmentInput,
): string | null {
  const stateId = input.stateId?.trim() || null;
  const zoneId = input.zoneId?.trim() || null;
  const branchId = input.branchId?.trim() || null;

  if (!PASTOR_ROLES.has(role)) {
    return "Invalid role for org assignment";
  }

  if (requiresStateId(role) && !stateId) {
    return "State is required for this role";
  }

  if (requiresZoneId(role) && !zoneId) {
    return "Zone is required for this role";
  }

  if (requiresBranchId(role) && !branchId) {
    return "Branch is required for this role";
  }

  if (zoneId && !stateId) {
    return "State is required when a zone is assigned";
  }

  return null;
}
