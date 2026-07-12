import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from "class-validator";

export class AttendanceFieldsDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  adultCount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  teenageCount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  childrenCount!: number;
}

export class FinanceFieldsDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tithe!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offering!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  other!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}

export class CreateWeeklyReportDto extends AttendanceFieldsDto {
  @IsDateString()
  serviceDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tithe!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offering!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  other!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
