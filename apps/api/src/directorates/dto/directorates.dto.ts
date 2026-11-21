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

  @IsOptional()
  @IsString()
  note?: string;
}

export class TransferAssignmentDto {
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

  @IsOptional()
  @IsString()
  note?: string;
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

  @IsOptional()
  @IsString()
  note?: string;
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

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateServiceUnitDto {
  @IsOptional()
  @IsString()
  coordinatorId?: string | null;

  @IsOptional()
  @IsString()
  note?: string;
}
