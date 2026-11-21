import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@repo/types";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AllowHrPersonnel } from "../common/decorators/allow-hr-personnel.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthUser } from "../common/auth.types";
import { DirectoratesService } from "./directorates.service";
import {
  CreateServiceUnitDto,
  TransferAssignmentDto,
  UpdateAssignmentDto,
  UpdateServiceUnitDto,
  UpsertAssignmentDto,
} from "./dto/directorates.dto";

@Controller("directorates")
@UseGuards(JwtAuthGuard)
export class DirectoratesController {
  constructor(private readonly directoratesService: DirectoratesService) {}

  @Get()
  list() {
    return this.directoratesService.list();
  }

  @Get("units")
  listServiceUnits(@Query("branchId") branchId?: string) {
    return this.directoratesService.listServiceUnits(branchId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.directoratesService.get(id);
  }

  @Post(":id/assignments")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  upsertAssignment(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpsertAssignmentDto,
  ) {
    return this.directoratesService.upsertAssignment(id, dto, actor.id);
  }

  @Post(":id/assignments/transfer")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  transferAssignment(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: TransferAssignmentDto,
  ) {
    return this.directoratesService.transferAssignment(id, dto, actor.id);
  }

  @Patch("assignments/:assignmentId")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  updateAssignment(
    @CurrentUser() actor: AuthUser,
    @Param("assignmentId") id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.directoratesService.updateAssignment(id, dto, actor.id);
  }

  @Delete("assignments/:assignmentId")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  removeAssignment(
    @CurrentUser() actor: AuthUser,
    @Param("assignmentId") id: string,
  ) {
    return this.directoratesService.removeAssignment(id, actor.id);
  }

  @Post("units")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN, Role.BRANCH_PASTOR)
  createServiceUnit(
    @CurrentUser() actor: AuthUser,
    @Body() dto: CreateServiceUnitDto,
  ) {
    return this.directoratesService.createServiceUnit(dto, actor.id);
  }

  @Patch("units/:id")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN, Role.BRANCH_PASTOR)
  updateServiceUnit(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateServiceUnitDto,
  ) {
    return this.directoratesService.updateServiceUnit(id, dto, actor.id);
  }

  @Delete("units/:id")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN, Role.BRANCH_PASTOR)
  removeServiceUnit(@Param("id") id: string) {
    return this.directoratesService.removeServiceUnit(id);
  }
}
