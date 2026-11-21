import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserStatus } from "@repo/database";
import { ONBOARDABLE_ROLES, PersonnelMoveKind, Role } from "@repo/types";
import { FilesService } from "../files/files.service";
import { resolveAndValidateOrgAssignment } from "../common/org-assignment";
import { PrismaService } from "../prisma/prisma.service";
import { isHrPersonnel } from "../common/guards/hr-personnel.guard";
import {
  recordMove,
  territoryLabel,
} from "../common/personnel-moves";
import { sanitizeUser } from "../common/user.mapper";
import { ListPastorsDto } from "./dto/list-pastors.dto";
import { ReassignUserDto } from "./dto/users.dto";

const DIRECTORY_ROLES: Role[] = [
  Role.SENIOR_PASTOR,
  Role.RESIDENT_PASTOR,
  Role.REGIONAL_PASTOR,
  Role.STATE_PASTOR,
  Role.ZONAL_PASTOR,
  Role.DISTRICT_PASTOR,
  Role.BRANCH_PASTOR,
  Role.MEMBER,
];

const pastorInclude = {
  region: true,
  state: true,
  zone: true,
  district: true,
  branch: true,
  directorateAssignment: {
    include: {
      directorate: { select: { name: true } },
      desk: { select: { name: true } },
    },
  },
} satisfies Prisma.UserInclude;

function toPastorRecord(
  user: Prisma.UserGetPayload<{ include: typeof pastorInclude }>,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    title: user.title,
    profilePicUrl: user.profilePicUrl,
    createdAt: user.createdAt,
    region: user.region ? { id: user.region.id, name: user.region.name } : null,
    state: user.state ? { id: user.state.id, name: user.state.name } : null,
    zone: user.zone ? { id: user.zone.id, name: user.zone.name } : null,
    district: user.district ? { id: user.district.id, name: user.district.name } : null,
    branch: user.branch
      ? {
          id: user.branch.id,
          name: user.branch.name,
          address: user.branch.address,
        }
      : null,
    directorate: user.directorateAssignment
      ? {
          directorateId: user.directorateAssignment.directorateId,
          directorateName: user.directorateAssignment.directorate.name,
          office: user.directorateAssignment.office,
          deskId: user.directorateAssignment.deskId,
          deskName: user.directorateAssignment.desk?.name ?? null,
        }
      : null,
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
      { phone: { contains: term, mode: "insensitive" } },
    ];
  }
  if (dto.regionId) where.regionId = dto.regionId;
  if (dto.stateId) where.stateId = dto.stateId;
  if (dto.zoneId) where.zoneId = dto.zoneId;
  if (dto.districtId) where.districtId = dto.districtId;
  if (dto.branchId) where.branchId = dto.branchId;
  if (dto.directorateId) {
    where.directorateAssignment = { directorateId: dto.directorateId };
  }
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: pastorInclude,
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return {
      ...sanitizeUser(user),
      hrPersonnel: await isHrPersonnel(this.prisma, userId),
    };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: pastorInclude,
    });
    return users.map(sanitizeUser);
  }

  async listPastors(dto: ListPastorsDto) {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const where: Prisma.UserWhereInput = {
      ...buildPastorWhere(dto),
      role: dto.role ?? { in: DIRECTORY_ROLES },
    };
    const baseWhere: Prisma.UserWhereInput = {
      ...buildPastorWhere(dto, { excludeStatus: true }),
      role: dto.role ?? { in: DIRECTORY_ROLES },
    };

    const [items, total, active, pending, deactivated] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: pastorInclude,
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

  async getPastor(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: pastorInclude,
    });
    if (!user || !DIRECTORY_ROLES.includes(user.role as Role)) {
      throw new NotFoundException("Pastor not found");
    }
    return toPastorRecord(user);
  }

  async deactivate(userId: string, actorId: string, note?: string | null) {
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
    await recordMove(this.prisma, {
      kind: PersonnelMoveKind.STATUS,
      userId,
      actorId,
      summary: "Active → Deactivated",
      detail: { from: { status: "ACTIVE" }, to: { status: "DEACTIVATED" } },
      note,
    });
    return sanitizeUser(updated);
  }

  async reassign(userId: string, dto: ReassignUserDto, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: pastorInclude,
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const targetRole = (dto.role ?? user.role) as Role;
    if (!ONBOARDABLE_ROLES.includes(targetRole)) {
      throw new BadRequestException("Cannot assign Admin or Senior Pastor via reassign");
    }

    const regionId = dto.regionId === undefined ? user.regionId : dto.regionId;
    const stateId = dto.stateId === undefined ? user.stateId : dto.stateId;
    const zoneId = dto.zoneId === undefined ? user.zoneId : dto.zoneId;
    const districtId = dto.districtId === undefined ? user.districtId : dto.districtId;
    const branchId = dto.branchId === undefined ? user.branchId : dto.branchId;

    const org = await resolveAndValidateOrgAssignment(this.prisma, targetRole, {
      regionId,
      stateId,
      zoneId,
      districtId,
      branchId,
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      include: pastorInclude,
      data: {
        role: targetRole,
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        regionId: org.regionId,
        stateId: org.stateId,
        zoneId: org.zoneId,
        districtId: org.districtId,
        branchId: org.branchId,
      },
    });
    await recordMove(this.prisma, {
      kind: PersonnelMoveKind.TERRITORY,
      userId,
      actorId,
      summary: `${territoryLabel(user)} → ${territoryLabel(updated)}`,
      detail: {
        from: { role: user.role, regionId: user.regionId, stateId: user.stateId, zoneId: user.zoneId, districtId: user.districtId, branchId: user.branchId },
        to: { role: updated.role, regionId: updated.regionId, stateId: updated.stateId, zoneId: updated.zoneId, districtId: updated.districtId, branchId: updated.branchId },
      },
      note: dto.note,
    });
    return sanitizeUser(updated);
  }

  async listMoves(userId: string) {
    const moves = await this.prisma.personnelMove.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { id: true, name: true } } },
    });
    return moves.map((m) => ({
      id: m.id,
      kind: m.kind,
      summary: m.summary,
      note: m.note,
      actor: m.actor,
      createdAt: m.createdAt,
    }));
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
