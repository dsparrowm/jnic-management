import { Type } from "class-transformer";
import { IsIn, IsInt, Max, Min } from "class-validator";

export const PROFILE_PICTURE_MAX_BYTES = 2 * 1024 * 1024;

export const PROFILE_PICTURE_CONTENT_TYPES = ["image/jpeg", "image/png"] as const;

export type ProfilePictureContentType = (typeof PROFILE_PICTURE_CONTENT_TYPES)[number];

export class PresignProfilePictureDto {
  @IsIn(PROFILE_PICTURE_CONTENT_TYPES)
  contentType!: ProfilePictureContentType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PROFILE_PICTURE_MAX_BYTES)
  fileSize!: number;
}
