import { IsEnum, IsOptional, IsString } from "class-validator";
import { Role } from "@repo/types";

export class ReassignUserDto {
  @IsOptional()
  @IsEnum(Role)
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
