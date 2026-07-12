import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";

export class UpdateWeeklyReportDto {
  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  adultCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teenageCount?: number;

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
}
