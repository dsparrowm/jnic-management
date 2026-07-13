import { OrgChangeType } from "@repo/types";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class CreateStateDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class CreateZoneDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  stateId!: string;
}

export class CreateBranchDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsNotEmpty()
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
