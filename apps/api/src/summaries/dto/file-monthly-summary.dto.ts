import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class FileMonthlySummaryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  newChurches?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welfareNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  plansNote?: string;
}
