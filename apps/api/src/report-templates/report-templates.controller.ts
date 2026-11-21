import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUser } from "../common/auth.types";
import {
  ReviewTemplateReportDto,
  SubmitTemplateReportDto,
} from "./dto/report-templates.dto";
import { ReportTemplatesService } from "./report-templates.service";

@Controller("report-templates")
@UseGuards(JwtAuthGuard)
export class ReportTemplatesController {
  constructor(private readonly reportTemplates: ReportTemplatesService) {}

  /** Templates the caller's seats let them submit. */
  @Get("mine")
  mine(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.reportTemplates.mine(user);
  }

  /** Reports awaiting the caller's review (desk head / director / resident / senior). */
  @Get("review-queue")
  reviewQueue(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.reportTemplates.reviewQueue(user);
  }

  /** The caller's own submissions. */
  @Get("reports")
  myReports(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.reportTemplates.myReports(user);
  }

  @Post(":id/submit")
  submit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: SubmitTemplateReportDto,
  ): Promise<unknown> {
    return this.reportTemplates.submit(user, id, dto);
  }

  @Post("reports/:id/review")
  review(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReviewTemplateReportDto,
  ): Promise<unknown> {
    return this.reportTemplates.review(user, id, dto);
  }
}
