import { User } from "@repo/database";
import { Role } from "@repo/types";
import { AuthUser } from "./auth.types";

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    status: user.status,
    stateId: user.stateId,
    zoneId: user.zoneId,
    branchId: user.branchId,
    profilePicUrl: user.profilePicUrl,
  };
}

export function sanitizeUser(user: User) {
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
    profilePicUrl: user.profilePicUrl,
    onboardingTokenExpiry: user.onboardingTokenExpiry,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
