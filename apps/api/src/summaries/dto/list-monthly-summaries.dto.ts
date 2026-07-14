import { SummaryScopeType } from "@repo/types";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

export class ListMonthlySummariesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsEnum(SummaryScopeType)
  scopeType?: SummaryScopeType;

  @ValidateIf((dto: ListMonthlySummariesDto) => dto.scopeType === SummaryScopeType.STATE)
  @IsString()
  @IsUUID()
  scopeId?: string;
}
