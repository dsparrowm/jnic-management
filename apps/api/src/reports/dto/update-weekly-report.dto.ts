import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateWeeklyReportDto {
  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  menCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  womenCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  youthCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  childrenCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tithe?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offering?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  other?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  midweekAttendance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  firstTimeVisitors?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  newConverts?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  followUpVisits?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitsActive?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activeUnitIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  outreachHeld?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  noServiceNote?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pastoralIssues?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prayerRequests?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextWeekPlans?: string | null;
}
