import { IsIn, IsOptional, IsString } from "class-validator";
import { ONBOARDABLE_ROLES, Role } from "@repo/types";

export class ReassignUserDto {
  @IsOptional()
  @IsIn(ONBOARDABLE_ROLES)
  role?: Role;

  @IsOptional()
  @IsString()
  stateId?: string | null;

  @IsOptional()
  @IsString()
  zoneId?: string | null;

  @IsOptional()
  @IsString()
  branchId?: string | null;
}
