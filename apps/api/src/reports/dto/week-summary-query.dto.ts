import { IsDateString } from "class-validator";

export class WeekSummaryQueryDto {
  @IsDateString()
  weekOf!: string;
}
