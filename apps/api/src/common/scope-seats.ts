import { Role } from "@repo/database";
import type { AuthUser } from "./auth.types";

const SCOPE_ROLES = new Set<Role>([
  Role.DISTRICT_PASTOR,
  Role.ZONAL_PASTOR,
  Role.STATE_PASTOR,
  Role.REGIONAL_PASTOR,
]);

// A user's role is their highest seat. Any lower scope id they carry is an
// acting seat: a REGIONAL_PASTOR with stateId acts as that state's pastor.
// Only populate a lower id when the person actually serves that scope.
export function districtSeatId(user: AuthUser): string | null {
  return SCOPE_ROLES.has(user.role) ? user.districtId : null;
}

export function zonalSeatId(user: AuthUser): string | null {
  return user.role !== Role.DISTRICT_PASTOR &&
    user.role !== Role.BRANCH_PASTOR &&
    SCOPE_ROLES.has(user.role)
    ? user.zoneId
    : null;
}

export function stateSeatId(user: AuthUser): string | null {
  return user.role === Role.STATE_PASTOR || user.role === Role.REGIONAL_PASTOR
    ? user.stateId
    : null;
}

export function regionalSeatId(user: AuthUser): string | null {
  return user.role === Role.REGIONAL_PASTOR ? user.regionId : null;
}

// Roles that can fill a scope's seat, widest first acting downward.
const SEAT_ROLES: Partial<Record<Role, Role[]>> = {
  [Role.DISTRICT_PASTOR]: [
    Role.DISTRICT_PASTOR,
    Role.ZONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.REGIONAL_PASTOR,
  ],
  [Role.ZONAL_PASTOR]: [
    Role.ZONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.REGIONAL_PASTOR,
  ],
  [Role.STATE_PASTOR]: [Role.STATE_PASTOR, Role.REGIONAL_PASTOR],
  [Role.REGIONAL_PASTOR]: [Role.REGIONAL_PASTOR],
};

export function seatRoles(role: Role): Role[] {
  return SEAT_ROLES[role] ?? [role];
}
