import { AppraisalPeriod } from "@repo/database";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpsertAppraisalDto {
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsEnum(AppraisalPeriod)
  period!: AppraisalPeriod;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score?: number | null;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  development?: string;

  @IsOptional()
  @IsString()
  recommendation?: string;

  @IsOptional()
  @IsBoolean()
  submitted?: boolean;
}

export class ListAppraisalsQuery {
  @IsOptional()
  @IsEnum(AppraisalPeriod)
  period?: AppraisalPeriod;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  subjectId?: string;
}

export class AppraisalCountsQuery {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsEnum(AppraisalPeriod)
  period?: AppraisalPeriod;
}
