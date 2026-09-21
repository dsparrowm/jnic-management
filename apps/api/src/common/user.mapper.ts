import { User } from "@repo/database";
import { Role } from "@repo/types";
import { AuthUser } from "./auth.types";

type OrgName = { name: string };

type UserWithOrg = User & {
  state?: OrgName | null;
  zone?: OrgName | null;
  branch?: OrgName | null;
};

export function toAuthUser(user: UserWithOrg): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    status: user.status,
    stateId: user.stateId,
    zoneId: user.zoneId,
    branchId: user.branchId,
    stateName: user.state?.name ?? null,
    zoneName: user.zone?.name ?? null,
    branchName: user.branch?.name ?? null,
    profilePicUrl: user.profilePicUrl,
  };
}

export function sanitizeUser(user: UserWithOrg) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    stateId: user.stateId,
    zoneId: user.zoneId,
    branchId: user.branchId,
    stateName: user.state?.name ?? null,
    zoneName: user.zone?.name ?? null,
    branchName: user.branch?.name ?? null,
    profilePicUrl: user.profilePicUrl,
    onboardingTokenExpiry: user.onboardingTokenExpiry,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
