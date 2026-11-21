import { OrgChangeType } from "@repo/types";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class CreateRegionDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  regionalPastorId?: string | null;
}

export class CreateStateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  regionId?: string;
}

export class UpdateStateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  regionId?: string | null;

  @IsOptional()
  @IsString()
  statePastorId?: string | null;
}

export class CreateZoneDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  stateId!: string;
}

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  zonalPastorId?: string | null;
}

export class CreateDistrictDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsNotEmpty()
  zoneId!: string;
}

export class UpdateDistrictDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  districtPastorId?: string | null;
}

export class CreateBranchDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsNotEmpty()
  stateId!: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  districtId?: string | null;

  @IsOptional()
  @IsString()
  branchPastorId?: string | null;
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
