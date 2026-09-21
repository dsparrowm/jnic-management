import { Role } from "@repo/types";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
  stateName?: string | null;
  zoneName?: string | null;
  branchName?: string | null;
  profilePicUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: AuthUser;
}
