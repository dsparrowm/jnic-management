import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto } from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto.email, dto.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "LOGIN_FAILED";
      if (message === "INVALID_CREDENTIALS") {
        throw new UnauthorizedException("Invalid email or password");
      }
      if (message === "ACCOUNT_DEACTIVATED") {
        throw new UnauthorizedException("Account has been deactivated");
      }
      if (message === "ACCOUNT_PENDING") {
        throw new UnauthorizedException("Please complete onboarding first");
      }
      throw new UnauthorizedException("Login failed");
    }
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    try {
      return await this.authService.refresh(dto.refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
  }
}
