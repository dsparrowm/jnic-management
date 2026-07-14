import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { MonthlySummary } from "@repo/database";
import { Role } from "@repo/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthUser } from "../common/auth.types";
import { ListMonthlySummariesDto } from "./dto/list-monthly-summaries.dto";
import { SummariesService } from "./summaries.service";

@Controller("summaries")
@UseGuards(JwtAuthGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get("monthly/pending-approval")
  @UseGuards(RolesGuard)
  @Roles(Role.LEAD_PASTOR)
  listPendingApproval(@CurrentUser() user: AuthUser) {
    return this.summariesService.listPendingApprovals(user);
  }

  @Get("monthly")
  @UseGuards(RolesGuard)
  @Roles(
    Role.BRANCH_PASTOR,
    Role.ZONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.LEAD_PASTOR,
    Role.ADMIN,
  )
  listMonthly(@CurrentUser() user: AuthUser, @Query() query: ListMonthlySummariesDto) {
    return this.summariesService.listMonthlySummaries(user, query.month, query.year);
  }

  @Post("monthly/:id/approve")
  @UseGuards(RolesGuard)
  @Roles(Role.LEAD_PASTOR)
  approveMonthly(@CurrentUser() user: AuthUser, @Param("id") id: string): Promise<MonthlySummary> {
    return this.summariesService.approveMonthlySummary(user, id);
  }
}
