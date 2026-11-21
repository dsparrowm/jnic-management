import { User } from "@repo/database";
import { DirectorateOffice, Role } from "@repo/types";
import { AuthUser } from "./auth.types";

type OrgName = { name: string };

type DirectorateAssignmentWithRefs = {
  directorateId: string;
  office: string;
  deskId: string | null;
  directorate: OrgName;
  desk?: OrgName | null;
};

type UserWithOrg = User & {
  region?: OrgName | null;
  state?: OrgName | null;
  zone?: OrgName | null;
  district?: OrgName | null;
  branch?: OrgName | null;
  directorateAssignment?: DirectorateAssignmentWithRefs | null;
};

function toDirectorateFacet(assignment?: DirectorateAssignmentWithRefs | null) {
  if (!assignment) return null;
  return {
    directorateId: assignment.directorateId,
    directorateName: assignment.directorate.name,
    office: assignment.office as DirectorateOffice,
    deskId: assignment.deskId,
    deskName: assignment.desk?.name ?? null,
  };
}

export function toAuthUser(user: UserWithOrg): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    status: user.status,
    title: user.title,
    regionId: user.regionId,
    stateId: user.stateId,
    zoneId: user.zoneId,
    districtId: user.districtId,
    branchId: user.branchId,
    regionName: user.region?.name ?? null,
    stateName: user.state?.name ?? null,
    zoneName: user.zone?.name ?? null,
    districtName: user.district?.name ?? null,
    branchName: user.branch?.name ?? null,
    directorate: user.directorateAssignment
      ? {
          directorateId: user.directorateAssignment.directorateId,
          directorateName: user.directorateAssignment.directorate.name,
          office: user.directorateAssignment.office as DirectorateOffice,
          deskId: user.directorateAssignment.deskId,
          deskName: user.directorateAssignment.desk?.name ?? null,
        }
      : null,
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
    title: user.title,
    regionId: user.regionId,
    stateId: user.stateId,
    zoneId: user.zoneId,
    districtId: user.districtId,
    branchId: user.branchId,
    regionName: user.region?.name ?? null,
    stateName: user.state?.name ?? null,
    zoneName: user.zone?.name ?? null,
    districtName: user.district?.name ?? null,
    branchName: user.branch?.name ?? null,
    directorate: toDirectorateFacet(user.directorateAssignment),
    profilePicUrl: user.profilePicUrl,
    onboardingTokenExpiry: user.onboardingTokenExpiry,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
