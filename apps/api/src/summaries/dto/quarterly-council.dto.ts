import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class QuarterlyCouncilDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  quarter!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;
}
