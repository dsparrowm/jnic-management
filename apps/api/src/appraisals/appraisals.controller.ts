import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AuthUser } from "../common/auth.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AppraisalsService } from "./appraisals.service";
import {
  AppraisalCountsQuery,
  ListAppraisalsQuery,
  UpsertAppraisalDto,
} from "./dto/appraisals.dto";

@Controller("appraisals")
@UseGuards(JwtAuthGuard)
export class AppraisalsController {
  constructor(private readonly appraisalsService: AppraisalsService) {}

  @Get("my-access")
  myAccess(@CurrentUser() user: AuthUser) {
    return this.appraisalsService.myAccess(user);
  }

  @Get("counts")
  counts(@CurrentUser() user: AuthUser, @Query() query: AppraisalCountsQuery) {
    return this.appraisalsService.counts(user, query);
  }

  @Get("subjects")
  subjects(@CurrentUser() user: AuthUser) {
    return this.appraisalsService.subjects(user);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListAppraisalsQuery) {
    return this.appraisalsService.list(user, query);
  }

  @Post()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertAppraisalDto) {
    return this.appraisalsService.upsert(user, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: Partial<UpsertAppraisalDto>,
  ) {
    return this.appraisalsService.update(user, id, dto);
  }
}
