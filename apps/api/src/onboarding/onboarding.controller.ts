import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@repo/types";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthUser } from "../common/auth.types";
import { CompleteOnboardingDto, CreateOnboardingUserDto } from "./dto/onboarding.dto";
import { OnboardingService } from "./onboarding.service";

@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createUser(@CurrentUser() admin: AuthUser, @Body() dto: CreateOnboardingUserDto) {
    return this.onboardingService.createUser(admin.id, dto);
  }

  @Post("users/:id/resend")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  resend(@Param("id") id: string) {
    return this.onboardingService.resend(id);
  }

  @Public()
  @Get("validate/:token")
  validate(@Param("token") token: string) {
    return this.onboardingService.validateToken(token);
  }

  @Public()
  @Post("complete")
  complete(@Body() dto: CompleteOnboardingDto) {
    return this.onboardingService.complete(dto);
  }
}
