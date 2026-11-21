import { IsIn, IsOptional, IsString } from "class-validator";
import { ONBOARDABLE_ROLES, Role } from "@repo/types";

export class ReassignUserDto {
  @IsOptional()
  @IsIn(ONBOARDABLE_ROLES)
  role?: Role;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  regionId?: string | null;

  @IsOptional()
  @IsString()
  stateId?: string | null;

  @IsOptional()
  @IsString()
  zoneId?: string | null;

  @IsOptional()
  @IsString()
  districtId?: string | null;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @IsString()
  note?: string;
}
