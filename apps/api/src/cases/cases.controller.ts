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
import { CasesService } from "./cases.service";
import {
  CaseCountsQuery,
  CreateCaseDto,
  ListCasesQuery,
  UpdateCaseDto,
} from "./dto/cases.dto";

@Controller("cases")
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get("my-registers")
  myRegisters(@CurrentUser() user: AuthUser) {
    return this.casesService.myRegisters(user);
  }

  @Get("counts")
  counts(@CurrentUser() user: AuthUser, @Query() query: CaseCountsQuery) {
    return this.casesService.counts(user, query);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListCasesQuery) {
    return this.casesService.list(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCaseDto) {
    return this.casesService.create(user, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.casesService.update(user, id, dto);
  }
}
