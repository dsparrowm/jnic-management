import { PersonnelCaseKind, PersonnelCaseStatus } from "@repo/database";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateCaseDto {
  @IsEnum(PersonnelCaseKind)
  kind!: PersonnelCaseKind;

  @IsOptional()
  @IsString()
  subjectId?: string | null;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  detail?: string;
}

export class UpdateCaseDto {
  @IsOptional()
  @IsEnum(PersonnelCaseStatus)
  status?: PersonnelCaseStatus;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsString()
  resolution?: string | null;
}

export class ListCasesQuery {
  @IsOptional()
  @IsEnum(PersonnelCaseKind)
  kind?: PersonnelCaseKind;

  @IsOptional()
  @IsEnum(PersonnelCaseStatus)
  status?: PersonnelCaseStatus;
}

export class CaseCountsQuery {
  @IsEnum(PersonnelCaseKind)
  kind!: PersonnelCaseKind;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
