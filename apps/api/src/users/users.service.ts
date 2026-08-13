import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserStatus } from "@repo/database";
import { ONBOARDABLE_ROLES, Role } from "@repo/types";
import { FilesService } from "../files/files.service";
import { resolveAndValidateOrgAssignment } from "../common/org-assignment";
import { PrismaService } from "../prisma/prisma.service";
import { sanitizeUser } from "../common/user.mapper";
import { ListPastorsDto } from "./dto/list-pastors.dto";
import { ReassignUserDto } from "./dto/users.dto";

function toPastorRecord(
  user: Prisma.UserGetPayload<{
    include: { state: true; zone: true; branch: true };
  }>,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    profilePicUrl: user.profilePicUrl,
    createdAt: user.createdAt,
    state: user.state ? { id: user.state.id, name: user.state.name } : null,
    zone: user.zone ? { id: user.zone.id, name: user.zone.name } : null,
    branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
  };
}

function buildPastorWhere(
  dto: ListPastorsDto,
  options?: { excludeStatus?: boolean },
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (dto.search?.trim()) {
    const term = dto.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }
  if (dto.stateId) where.stateId = dto.stateId;
  if (dto.zoneId) where.zoneId = dto.zoneId;
  if (dto.branchId) where.branchId = dto.branchId;
  if (dto.role) where.role = dto.role;
  if (!options?.excludeStatus && dto.status) where.status = dto.status;

  return where;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

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

  async listPastors(dto: ListPastorsDto) {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const where = buildPastorWhere(dto);
    const baseWhere = buildPastorWhere(dto, { excludeStatus: true });

    const [items, total, active, pending, deactivated] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { state: true, zone: true, branch: true },
        orderBy: { name: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({
        where: { ...baseWhere, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { ...baseWhere, status: UserStatus.PENDING },
      }),
      this.prisma.user.count({
        where: { ...baseWhere, status: UserStatus.DEACTIVATED },
      }),
    ]);

    return {
      items: items.map(toPastorRecord),
      total,
      page,
      perPage,
      summary: {
        total: active + pending + deactivated,
        active,
        pending,
        deactivated,
      },
    };
  }

  async deactivate(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.status === UserStatus.DEACTIVATED) {
      throw new BadRequestException("User is already deactivated");
    }

    if (user.role === Role.ADMIN && user.status === UserStatus.ACTIVE) {
      const otherActiveAdmins = await this.prisma.user.count({
        where: {
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          id: { not: userId },
        },
      });
      if (otherActiveAdmins === 0) {
        throw new BadRequestException("Cannot deactivate the last active admin");
      }
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

    const targetRole = (dto.role ?? user.role) as Role;
    if (!ONBOARDABLE_ROLES.includes(targetRole)) {
      throw new BadRequestException("Cannot assign Admin or Lead Pastor via reassign");
    }

    const stateId = dto.stateId === undefined ? user.stateId : dto.stateId;
    const zoneId = dto.zoneId === undefined ? user.zoneId : dto.zoneId;
    const branchId = dto.branchId === undefined ? user.branchId : dto.branchId;

    const org = await resolveAndValidateOrgAssignment(this.prisma, targetRole, {
      stateId,
      zoneId,
      branchId,
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: targetRole,
        stateId: org.stateId,
        zoneId: org.zoneId,
        branchId: org.branchId,
      },
    });
    return sanitizeUser(updated);
  }

  async updateProfilePicture(userId: string, key: string) {
    this.filesService.assertProfilePictureKeyForUser(key, userId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const profilePicUrl = this.filesService.buildPublicUrl(key);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePicUrl },
    });
    return sanitizeUser(updated);
  }
}
