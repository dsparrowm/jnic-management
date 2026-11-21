import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@repo/types";
import { Public } from "../common/decorators/public.decorator";
import { sanitizeOnboardingToken } from "../common/onboarding-token";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AllowHrPersonnel } from "../common/decorators/allow-hr-personnel.decorator";
import { AuthUser } from "../common/auth.types";
import { CompleteOnboardingDto, CreateOnboardingUserDto } from "./dto/onboarding.dto";
import { OnboardingService } from "./onboarding.service";

@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post("users")
  @UseGuards(JwtAuthGuard)
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  createUser(@CurrentUser() admin: AuthUser, @Body() dto: CreateOnboardingUserDto) {
    return this.onboardingService.createUser(admin.id, dto);
  }

  @Post("users/:id/resend")
  @UseGuards(JwtAuthGuard)
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  resend(@Param("id") id: string) {
    return this.onboardingService.resend(id);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Get("validate/:token")
  validate(@Param("token") token: string) {
    return this.onboardingService.validateToken(sanitizeOnboardingToken(token));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("complete")
  complete(@Body() dto: CompleteOnboardingDto) {
    return this.onboardingService.complete(dto);
  }
}
