import { Type } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class ReportScopeDto {
  @IsOptional()
  @IsString()
  serviceUnitId?: string;

  @IsOptional()
  @IsString()
  deskId?: string;
}

export class SubmitTemplateReportDto {
  @IsString()
  @IsNotEmpty()
  periodKey!: string; // e.g. "2026-W47" or "2026-11"

  @ValidateNested()
  @Type(() => ReportScopeDto)
  scope!: ReportScopeDto;

  @IsObject()
  data!: Record<string, unknown>;
}

export class ReviewTemplateReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
