import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, Max, Min } from "class-validator";

export class PastorDashboardQueryDto {
  @IsDateString()
  weekOf!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(12)
  weeks = 6;
}
