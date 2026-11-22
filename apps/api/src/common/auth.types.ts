import { DirectorateOffice, Role } from "@repo/types";

export interface DirectorateFacet {
  directorateId: string;
  directorateName: string;
  office: DirectorateOffice;
  deskId: string | null;
  deskName: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  title: string | null;
  regionId: string | null;
  stateId: string | null;
  zoneId: string | null;
  districtId: string | null;
  branchId: string | null;
  regionName?: string | null;
  stateName?: string | null;
  zoneName?: string | null;
  districtName?: string | null;
  branchName?: string | null;
  directorate?: DirectorateFacet | null;
  hrPersonnel?: boolean;
  hrAccess?: {
    personnel: boolean;
    welfare: boolean;
    discipline: boolean;
    appraisals: boolean;
  };
  profilePicUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: AuthUser;
}
