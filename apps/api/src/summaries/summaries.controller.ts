import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { MonthlySummary } from "@repo/database";
import { Role } from "@repo/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthUser } from "../common/auth.types";
import { FileMonthlySummaryDto } from "./dto/file-monthly-summary.dto";
import { ListMonthlySummariesDto } from "./dto/list-monthly-summaries.dto";
import { QuarterlyCouncilDto } from "./dto/quarterly-council.dto";
import { ReturnMonthlySummaryDto } from "./dto/return-monthly-summary.dto";
import { SummariesService } from "./summaries.service";

@Controller("summaries")
@UseGuards(JwtAuthGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get("monthly/pending-approval")
  @UseGuards(RolesGuard)
  @Roles(Role.SENIOR_PASTOR, Role.RESIDENT_PASTOR)
  listPendingApproval(@CurrentUser() user: AuthUser) {
    return this.summariesService.listPendingApprovals(user);
  }

  @Get("monthly")
  @UseGuards(RolesGuard)
  @Roles(
    Role.BRANCH_PASTOR,
    Role.DISTRICT_PASTOR,
    Role.ZONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.REGIONAL_PASTOR,
    Role.SENIOR_PASTOR,
    Role.RESIDENT_PASTOR,
    Role.ADMIN,
  )
  listMonthly(@CurrentUser() user: AuthUser, @Query() query: ListMonthlySummariesDto) {
    return this.summariesService.listMonthlySummaries(user, query.month, query.year, {
      scopeType: query.scopeType,
      scopeId: query.scopeId,
    });
  }

  @Get("quarterly")
  @UseGuards(RolesGuard)
  @Roles(Role.SENIOR_PASTOR, Role.RESIDENT_PASTOR)
  quarterlyCouncil(@CurrentUser() user: AuthUser, @Query() query: QuarterlyCouncilDto) {
    return this.summariesService.getQuarterlyCouncil(user, query.quarter, query.year);
  }

  @Post("monthly/:id/file")
  @UseGuards(RolesGuard)
  @Roles(
    Role.ZONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.REGIONAL_PASTOR,
    Role.SENIOR_PASTOR,
    Role.RESIDENT_PASTOR,
  )
  fileMonthly(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: FileMonthlySummaryDto,
  ): Promise<MonthlySummary> {
    return this.summariesService.fileMonthlySummary(user, id, dto);
  }

  @Post("monthly/:id/approve")
  @UseGuards(RolesGuard)
  @Roles(Role.SENIOR_PASTOR, Role.RESIDENT_PASTOR)
  approveMonthly(@CurrentUser() user: AuthUser, @Param("id") id: string): Promise<MonthlySummary> {
    return this.summariesService.approveMonthlySummary(user, id);
  }

  @Post("monthly/:id/return")
  @UseGuards(RolesGuard)
  @Roles(Role.SENIOR_PASTOR, Role.RESIDENT_PASTOR)
  returnMonthly(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReturnMonthlySummaryDto,
  ): Promise<MonthlySummary> {
    return this.summariesService.returnMonthlySummary(user, id, dto.note);
  }
}
