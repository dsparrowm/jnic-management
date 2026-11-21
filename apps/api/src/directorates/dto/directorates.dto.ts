import { DirectorateOffice } from "@repo/types";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

export class UpsertAssignmentDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(DirectorateOffice)
  office!: DirectorateOffice;

  @IsOptional()
  @IsString()
  deskId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(80)
  agreedWeeklyHours?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  termYears?: number | null;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsEnum(DirectorateOffice)
  office?: DirectorateOffice;

  @IsOptional()
  @IsString()
  deskId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(80)
  agreedWeeklyHours?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  termYears?: number | null;

  @IsOptional()
  isActive?: boolean;
}

export class CreateServiceUnitDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsNotEmpty()
  unitTypeId!: string;

  @IsOptional()
  @IsString()
  coordinatorId?: string | null;
}

export class UpdateServiceUnitDto {
  @IsOptional()
  @IsString()
  coordinatorId?: string | null;
}
