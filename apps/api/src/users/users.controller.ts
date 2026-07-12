import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@repo/types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listPastors(@Query() query: ListPastorsDto) {
    return this.usersService.listPastors(query);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listUsers() {
    return this.usersService.listUsers();
  }

  @Patch(":id/deactivate")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deactivate(@Param("id") id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(":id/reassign")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  reassign(@Param("id") id: string, @Body() dto: ReassignUserDto) {
    return this.usersService.reassign(id, dto);
  }
}
