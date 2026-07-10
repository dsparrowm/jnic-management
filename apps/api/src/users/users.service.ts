import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserStatus } from "@repo/database";
import { PrismaService } from "../prisma/prisma.service";
import { sanitizeUser } from "../common/user.mapper";
import { ReassignUserDto } from "./dto/users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return sanitizeUser(user);
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map(sanitizeUser);
  }

  async deactivate(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.status === UserStatus.DEACTIVATED) {
      throw new BadRequestException("User is already deactivated");
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.DEACTIVATED },
    });
    return sanitizeUser(updated);
  }

  async reassign(userId: string, dto: ReassignUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role ?? user.role,
        stateId: dto.stateId === undefined ? user.stateId : dto.stateId,
        zoneId: dto.zoneId === undefined ? user.zoneId : dto.zoneId,
        branchId: dto.branchId === undefined ? user.branchId : dto.branchId,
      },
    });
    return sanitizeUser(updated);
  }
}
