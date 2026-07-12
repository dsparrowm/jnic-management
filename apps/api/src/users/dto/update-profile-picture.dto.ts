import { IsString, MinLength } from "class-validator";

export class UpdateProfilePictureDto {
  @IsString()
  @MinLength(1)
  key!: string;
}
