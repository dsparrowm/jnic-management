import { Controller, Get, Query } from "@nestjs/common";
import { Role } from "@repo/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthUser } from "../common/auth.types";
import { DashboardService } from "./dashboard.service";
import { HqDashboardQueryDto } from "./dto/hq-dashboard-query.dto";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("hq")
  @Roles(Role.ADMIN, Role.LEAD_PASTOR)
  getHqDashboard(
    @CurrentUser() user: AuthUser,
    @Query() query: HqDashboardQueryDto,
  ) {
    return this.dashboardService.getHqDashboard(user, query.weekOf, query.weeks);
  }
}
