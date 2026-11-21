import { Role } from "@repo/types";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateOnboardingUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(Role)
  role!: Role;

  /// Free-form ministerial title, e.g. "Youth Pastor".
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  @IsString()
  stateId?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  /// Optional directorate seat granted at onboarding.
  @IsOptional()
  @IsString()
  directorateId?: string;

  @IsOptional()
  @IsString()
  deskId?: string;
}

export class CompleteOnboardingDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
