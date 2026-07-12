import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Role, WEEKLY_REPORT_SUBMITTER_ROLES } from "@repo/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthUser } from "../common/auth.types";
import { ListWeeklyReportsDto } from "./dto/list-weekly-reports.dto";
import { WeekSummaryQueryDto } from "./dto/week-summary-query.dto";
import { UpdateWeeklyReportDto } from "./dto/update-weekly-report.dto";
import { CreateWeeklyReportDto } from "./dto/weekly-report.dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post("weekly")
  @UseGuards(RolesGuard)
  @Roles(...WEEKLY_REPORT_SUBMITTER_ROLES)
  createWeeklyReport(@CurrentUser() user: AuthUser, @Body() dto: CreateWeeklyReportDto) {
    return this.reportsService.createWeeklyReport(user, dto);
  }

  @Patch("weekly/:id")
  @UseGuards(RolesGuard)
  @Roles(...WEEKLY_REPORT_SUBMITTER_ROLES)
  updateWeeklyReport(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateWeeklyReportDto,
  ) {
    return this.reportsService.updateWeeklyReport(user, id, dto);
  }

  @Get("weekly")
  @UseGuards(RolesGuard)
  @Roles(...WEEKLY_REPORT_SUBMITTER_ROLES)
  listWeeklyReports(@CurrentUser() user: AuthUser, @Query() query: ListWeeklyReportsDto) {
    return this.reportsService.listWeeklyReports(user, query);
  }

  @Get("zone/summary")
  @UseGuards(RolesGuard)
  @Roles(Role.ZONAL_PASTOR)
  getZoneSummary(@CurrentUser() user: AuthUser, @Query() query: WeekSummaryQueryDto) {
    return this.reportsService.getZoneSummary(user, query.weekOf);
  }

  @Get("state/summary")
  @UseGuards(RolesGuard)
  @Roles(Role.STATE_PASTOR)
  getStateSummary(@CurrentUser() user: AuthUser, @Query() query: WeekSummaryQueryDto) {
    return this.reportsService.getStateSummary(user, query.weekOf);
  }

  @Get("national/summary")
  @UseGuards(RolesGuard)
  @Roles(Role.LEAD_PASTOR, Role.ADMIN)
  getNationalSummary(@CurrentUser() user: AuthUser, @Query() query: WeekSummaryQueryDto) {
    return this.reportsService.getNationalSummary(user, query.weekOf);
  }

  @Get("weekly/:id")
  @UseGuards(RolesGuard)
  @Roles(
    ...WEEKLY_REPORT_SUBMITTER_ROLES,
    Role.ZONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.LEAD_PASTOR,
    Role.ADMIN,
  )
  getWeeklyReport(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reportsService.getWeeklyReport(user, id);
  }
}
