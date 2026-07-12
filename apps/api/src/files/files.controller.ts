import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUser } from "../common/auth.types";
import { PresignProfilePictureDto } from "./dto/presign-profile-picture.dto";
import { FilesService } from "./files.service";

@Controller("files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("profile-picture/presign")
  presignProfilePicture(
    @CurrentUser() user: AuthUser,
    @Body() dto: PresignProfilePictureDto,
  ) {
    return this.filesService.createProfilePicturePresign(
      user.id,
      dto.contentType,
      dto.fileSize,
    );
  }
}
