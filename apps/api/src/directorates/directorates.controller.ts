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
import { DirectoratesService } from "./directorates.service";
import {
  CreateServiceUnitDto,
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
  upsertAssignment(@Param("id") id: string, @Body() dto: UpsertAssignmentDto) {
    return this.directoratesService.upsertAssignment(id, dto);
  }

  @Patch("assignments/:assignmentId")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  updateAssignment(@Param("assignmentId") id: string, @Body() dto: UpdateAssignmentDto) {
    return this.directoratesService.updateAssignment(id, dto);
  }

  @Delete("assignments/:assignmentId")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  removeAssignment(@Param("assignmentId") id: string) {
    return this.directoratesService.removeAssignment(id);
  }

  @Post("units")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.BRANCH_PASTOR)
  createServiceUnit(@Body() dto: CreateServiceUnitDto) {
    return this.directoratesService.createServiceUnit(dto);
  }

  @Patch("units/:id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.BRANCH_PASTOR)
  updateServiceUnit(@Param("id") id: string, @Body() dto: UpdateServiceUnitDto) {
    return this.directoratesService.updateServiceUnit(id, dto);
  }

  @Delete("units/:id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.BRANCH_PASTOR)
  removeServiceUnit(@Param("id") id: string) {
    return this.directoratesService.removeServiceUnit(id);
  }
}
