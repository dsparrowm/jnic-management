import { Role } from "@repo/types";
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

  @IsOptional()
  @IsString()
  stateId?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class CompleteOnboardingDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
