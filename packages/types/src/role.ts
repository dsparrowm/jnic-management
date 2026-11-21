/** Platform roles — single source of truth for web, API, and mobile */
export enum Role {
  SENIOR_PASTOR = "SENIOR_PASTOR",
  RESIDENT_PASTOR = "RESIDENT_PASTOR",
  ADMIN = "ADMIN",
  REGIONAL_PASTOR = "REGIONAL_PASTOR",
  STATE_PASTOR = "STATE_PASTOR",
  ZONAL_PASTOR = "ZONAL_PASTOR",
  DISTRICT_PASTOR = "DISTRICT_PASTOR",
  BRANCH_PASTOR = "BRANCH_PASTOR",
}

/** HQ national-visibility roles: Senior Pastor and his assistant, the Resident Pastor. */
export const HQ_PASTOR_ROLES: Role[] = [Role.SENIOR_PASTOR, Role.RESIDENT_PASTOR];

export function isHqPastor(role: Role): boolean {
  return HQ_PASTOR_ROLES.includes(role);
}
