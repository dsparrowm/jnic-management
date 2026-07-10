import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role } from "@repo/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthUser } from "../common/auth.types";
import {
  CreateBranchDto,
  CreateOrgChangeRequestDto,
  ReviewOrgChangeDto,
  UpdateBranchDto,
  UpdateStateDto,
  UpdateZoneDto,
} from "./dto/org.dto";
import { OrgService } from "./org.service";

@Controller("org")
@UseGuards(JwtAuthGuard)
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get("tree")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.LEAD_PASTOR)
  getTree() {
    return this.orgService.getTree();
  }

  @Post("branches")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createBranch(@Body() dto: CreateBranchDto) {
    return this.orgService.createBranch(dto);
  }

  @Patch("states/:id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateState(@Param("id") id: string, @Body() dto: UpdateStateDto) {
    return this.orgService.updateState(id, dto);
  }

  @Patch("zones/:id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateZone(@Param("id") id: string, @Body() dto: UpdateZoneDto) {
    return this.orgService.updateZone(id, dto);
  }

  @Patch("branches/:id")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateBranch(@Param("id") id: string, @Body() dto: UpdateBranchDto) {
    return this.orgService.updateBranch(id, dto);
  }

  @Post("change-requests")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  proposeChange(@CurrentUser() admin: AuthUser, @Body() dto: CreateOrgChangeRequestDto) {
    return this.orgService.proposeChange(admin.id, dto);
  }

  @Get("change-requests")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.LEAD_PASTOR)
  listChangeRequests() {
    return this.orgService.listChangeRequests();
  }

  @Post("change-requests/:id/approve")
  @UseGuards(RolesGuard)
  @Roles(Role.LEAD_PASTOR)
  approveChange(
    @CurrentUser() lp: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReviewOrgChangeDto,
  ) {
    return this.orgService.approveChange(id, lp.id, dto.reviewNote);
  }

  @Post("change-requests/:id/reject")
  @UseGuards(RolesGuard)
  @Roles(Role.LEAD_PASTOR)
  rejectChange(
    @CurrentUser() lp: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReviewOrgChangeDto,
  ) {
    return this.orgService.rejectChange(id, lp.id, dto.reviewNote);
  }
}
