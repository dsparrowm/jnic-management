import { OrgChangeType } from "@repo/types";
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class CreateBranchDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  zoneId!: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateStateDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class UpdateZoneDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateOrgChangeRequestDto {
  @IsEnum(OrgChangeType)
  type!: OrgChangeType;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class ReviewOrgChangeDto {
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
