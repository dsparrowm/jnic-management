import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@repo/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AllowHrPersonnel } from "../common/decorators/allow-hr-personnel.decorator";
import { AuthUser } from "../common/auth.types";
import { ListPastorsDto } from "./dto/list-pastors.dto";
import { UpdateProfilePictureDto } from "./dto/update-profile-picture.dto";
import { ReassignUserDto } from "./dto/users.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch("me/profile-picture")
  updateProfilePicture(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfilePictureDto,
  ) {
    return this.usersService.updateProfilePicture(user.id, dto.key);
  }

  @Get("pastors")
  @AllowHrPersonnel()
  @Roles(
    Role.ADMIN,
    Role.SENIOR_PASTOR,
    Role.RESIDENT_PASTOR,
    Role.REGIONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.ZONAL_PASTOR,
    Role.BRANCH_PASTOR,
  )
  listPastors(@Query() query: ListPastorsDto) {
    return this.usersService.listPastors(query);
  }

  @Get("pastors/:id")
  @AllowHrPersonnel()
  @Roles(
    Role.ADMIN,
    Role.SENIOR_PASTOR,
    Role.RESIDENT_PASTOR,
    Role.REGIONAL_PASTOR,
    Role.STATE_PASTOR,
    Role.ZONAL_PASTOR,
    Role.BRANCH_PASTOR,
  )
  getPastor(@Param("id") id: string) {
    return this.usersService.getPastor(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listUsers() {
    return this.usersService.listUsers();
  }

  @Patch(":id/deactivate")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  deactivate(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: { note?: string },
  ) {
    return this.usersService.deactivate(id, actor.id, dto?.note);
  }

  @Patch(":id/reassign")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  reassign(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() dto: ReassignUserDto,
  ) {
    return this.usersService.reassign(id, dto, actor.id);
  }

  @Get(":id/moves")
  @AllowHrPersonnel()
  @Roles(Role.ADMIN)
  listMoves(@Param("id") id: string) {
    return this.usersService.listMoves(id);
  }
}
