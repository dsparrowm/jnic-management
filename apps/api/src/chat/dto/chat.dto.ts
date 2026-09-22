import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateDirectChatDto {
  @IsString()
  userId!: string;
}

export class SendChatMessageDto {
  @IsString()
  @MaxLength(2000)
  body!: string;
}

export class ListChatMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 50;
}
