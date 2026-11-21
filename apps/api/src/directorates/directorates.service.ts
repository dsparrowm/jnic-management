import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DirectorateOffice, Prisma, UserStatus } from "@repo/database";
import { PersonnelMoveKind } from "@repo/types";
import { PrismaService } from "../prisma/prisma.service";
import {
  recordMove,
  seatFacetLabel,
  unitFacetLabel,
} from "../common/personnel-moves";
import {
  CreateServiceUnitDto,
  TransferAssignmentDto,
  UpdateAssignmentDto,
  UpdateServiceUnitDto,
  UpsertAssignmentDto,
} from "./dto/directorates.dto";

const memberUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  title: true,
  profilePicUrl: true,
  branch: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class DirectoratesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Overview list: all directorates with leadership, desk/unit counts and member totals. */
  async list() {
    const directorates = await this.prisma.directorate.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        desks: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
        unitTypes: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
        assignments: {
          where: { isActive: true },
          include: { user: { select: memberUserSelect } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return directorates.map((d) => ({
      id: d.id,
      key: d.key,
      name: d.name,
      mandate: d.mandate,
      deskCount: d.desks.length,
      unitTypeCount: d.unitTypes.length,
      memberCount: d.assignments.length,
      leadership: {
        director: this.pickOfficer(d.assignments, DirectorateOffice.DIRECTOR),
        deputyDirector: this.pickOfficer(d.assignments, DirectorateOffice.DEPUTY_DIRECTOR),
        secretary: this.pickOfficer(d.assignments, DirectorateOffice.SECRETARY),
      },
    }));
  }

  async get(id: string) {
    const directorate = await this.prisma.directorate.findUnique({
      where: { id },
      include: {
        desks: { orderBy: { sortOrder: "asc" } },
        unitTypes: { orderBy: { sortOrder: "asc" } },
        assignments: {
          where: { isActive: true },
          include: { user: { select: memberUserSelect } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!directorate) {
      throw new NotFoundException("Directorate not found");
    }

    return {
      id: directorate.id,
      key: directorate.key,
      name: directorate.name,
      mandate: directorate.mandate,
      desks: directorate.desks.map((desk) => ({
        id: desk.id,
        name: desk.name,
        duties: desk.duties as string[],
      })),
      branchUnits: directorate.unitTypes.map((u) => ({ id: u.id, name: u.name })),
      members: directorate.assignments.map((a) => this.toMemberRecord(a)),
    };
  }

  /** Assign or re-seat a user inside a directorate. One seat per person. */
  async upsertAssignment(
    directorateId: string,
    dto: UpsertAssignmentDto,
    actorId: string,
  ) {
    const directorate = await this.ensureDirectorate(directorateId);
    const deskId = await this.resolveDesk(directorateId, dto.deskId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        directorateAssignment: {
          include: {
            directorate: { select: { name: true } },
            desk: { select: { name: true } },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.status === UserStatus.DEACTIVATED) {
      throw new BadRequestException("Cannot assign a deactivated user");
    }

    const existing = user.directorateAssignment;
    if (existing && existing.directorateId !== directorateId) {
      const other = await this.prisma.directorate.findUnique({
        where: { id: existing.directorateId },
        select: { name: true },
      });
      throw new ConflictException(
        `User already belongs to ${other?.name ?? "another directorate"} — move them first`,
      );
    }

    const assignment = await this.prisma.directorateAssignment.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        directorateId,
        deskId,
        office: dto.office,
        agreedWeeklyHours: dto.agreedWeeklyHours ?? null,
        termYears: dto.termYears ?? null,
      },
      update: {
        directorateId,
        deskId,
        office: dto.office,
        agreedWeeklyHours: dto.agreedWeeklyHours ?? null,
        termYears: dto.termYears ?? null,
        isActive: true,
      },
      include: { user: { select: memberUserSelect } },
    });

    const deskName = deskId
      ? (
          await this.prisma.desk.findUnique({
            where: { id: deskId },
            select: { name: true },
          })
        )?.name ?? null
      : null;
    const from = existing?.isActive
      ? seatFacetLabel({
          office: existing.office,
          directorateName: existing.directorate.name,
          deskName: existing.desk?.name,
        })
      : "No seat";
    const to = seatFacetLabel({
      office: dto.office,
      directorateName: directorate.name,
      deskName,
    });
    if (from !== to) {
      await recordMove(this.prisma, {
        kind: PersonnelMoveKind.SEAT,
        userId: dto.userId,
        actorId,
        summary: `${from} → ${to}`,
        detail: {
          from: existing
            ? {
                directorateId: existing.directorateId,
                deskId: existing.deskId,
                office: existing.office,
              }
            : null,
          to: { directorateId, deskId, office: dto.office },
        },
        note: dto.note,
      });
    }
    return this.toMemberRecord(assignment);
  }

  /** Moves a person's seat to another directorate in one audited step. */
  async transferAssignment(
    directorateId: string,
    dto: TransferAssignmentDto,
    actorId: string,
  ) {
    const directorate = await this.ensureDirectorate(directorateId);
    const deskId = await this.resolveDesk(directorateId, dto.deskId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        directorateAssignment: {
          include: {
            directorate: { select: { name: true } },
            desk: { select: { name: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    if (user.status === UserStatus.DEACTIVATED) {
      throw new BadRequestException("Cannot transfer a deactivated user");
    }
    const existing = user.directorateAssignment;
    if (!existing?.isActive) {
      throw new BadRequestException("User has no active seat to transfer");
    }
    if (existing.directorateId === directorateId) {
      throw new BadRequestException("User already belongs to this directorate");
    }

    const assignment = await this.prisma.directorateAssignment.update({
      where: { id: existing.id },
      data: {
        directorateId,
        deskId,
        office: dto.office,
        agreedWeeklyHours: dto.agreedWeeklyHours ?? null,
        termYears: dto.termYears ?? null,
      },
      include: { user: { select: memberUserSelect } },
    });

    const deskName = deskId
      ? (
          await this.prisma.desk.findUnique({
            where: { id: deskId },
            select: { name: true },
          })
        )?.name ?? null
      : null;
    await recordMove(this.prisma, {
      kind: PersonnelMoveKind.SEAT,
      userId: dto.userId,
      actorId,
      summary: `${seatFacetLabel({
        office: existing.office,
        directorateName: existing.directorate.name,
        deskName: existing.desk?.name,
      })} → ${seatFacetLabel({
        office: dto.office,
        directorateName: directorate.name,
        deskName,
      })}`,
      detail: {
        from: {
          directorateId: existing.directorateId,
          deskId: existing.deskId,
          office: existing.office,
        },
        to: { directorateId, deskId, office: dto.office },
      },
      note: dto.note,
    });
    return this.toMemberRecord(assignment);
  }

  async updateAssignment(
    assignmentId: string,
    dto: UpdateAssignmentDto,
    actorId: string,
  ) {
    const assignment = await this.prisma.directorateAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        directorate: { select: { name: true } },
        desk: { select: { name: true } },
      },
    });
    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }

    const data: Prisma.DirectorateAssignmentUpdateInput = {};
    if (dto.office !== undefined) data.office = dto.office;
    if (dto.deskId !== undefined) {
      if (dto.deskId) {
        const deskId = await this.resolveDesk(assignment.directorateId, dto.deskId);
        data.desk = { connect: { id: deskId as string } };
      } else {
        data.desk = { disconnect: true };
      }
    }
    if (dto.agreedWeeklyHours !== undefined) data.agreedWeeklyHours = dto.agreedWeeklyHours;
    if (dto.termYears !== undefined) data.termYears = dto.termYears;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.directorateAssignment.update({
      where: { id: assignmentId },
      data,
      include: {
        user: { select: memberUserSelect },
        desk: { select: { name: true } },
      },
    });
    const from = seatFacetLabel({
      office: assignment.office,
      directorateName: assignment.directorate.name,
      deskName: assignment.desk?.name,
    });
    const to = seatFacetLabel({
      office: updated.office,
      directorateName: assignment.directorate.name,
      deskName: updated.desk?.name,
    });
    const statusChange =
      dto.isActive !== undefined && dto.isActive !== assignment.isActive
        ? dto.isActive
          ? " (reactivated)"
          : " (unseated)"
        : "";
    if (from !== to || statusChange) {
      await recordMove(this.prisma, {
        kind: PersonnelMoveKind.SEAT,
        userId: assignment.userId,
        actorId,
        summary: `${from} → ${to}${statusChange}`,
        detail: {
          from: { deskId: assignment.deskId, office: assignment.office, isActive: assignment.isActive },
          to: { deskId: updated.deskId, office: updated.office, isActive: updated.isActive },
        },
        note: dto.note,
      });
    }
    return this.toMemberRecord(updated);
  }

  async removeAssignment(assignmentId: string, actorId: string) {
    const assignment = await this.prisma.directorateAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        directorate: { select: { name: true } },
        desk: { select: { name: true } },
      },
    });
    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }
    await this.prisma.directorateAssignment.delete({ where: { id: assignmentId } });
    await recordMove(this.prisma, {
      kind: PersonnelMoveKind.SEAT,
      userId: assignment.userId,
      actorId,
      summary: `${seatFacetLabel({
        office: assignment.office,
        directorateName: assignment.directorate.name,
        deskName: assignment.desk?.name,
      })} → No seat`,
      detail: {
        from: {
          directorateId: assignment.directorateId,
          deskId: assignment.deskId,
          office: assignment.office,
        },
        to: null,
      },
    });
    return { removed: true };
  }

  /** Branch service units chartered by directorates. */
  async listServiceUnits(branchId?: string) {
    const units = await this.prisma.serviceUnit.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: "asc" },
      include: {
        branch: { select: { id: true, name: true } },
        unitType: { include: { directorate: { select: { id: true, name: true } } } },
        coordinator: { select: { id: true, name: true } },
      },
    });
    return units.map((u) => ({
      id: u.id,
      branch: u.branch,
      unitType: { id: u.unitType.id, name: u.unitType.name },
      directorate: u.unitType.directorate,
      coordinator: u.coordinator,
    }));
  }

  async createServiceUnit(dto: CreateServiceUnitDto, actorId: string) {
    const [branch, unitType] = await Promise.all([
      this.prisma.branch.findUnique({ where: { id: dto.branchId } }),
      this.prisma.branchUnitType.findUnique({ where: { id: dto.unitTypeId } }),
    ]);
    if (!branch) throw new NotFoundException("Branch not found");
    if (!unitType) throw new NotFoundException("Unit type not found");
    if (dto.coordinatorId) {
      await this.ensureActiveUser(dto.coordinatorId);
    }

    const existing = await this.prisma.serviceUnit.findUnique({
      where: { branchId_unitTypeId: { branchId: dto.branchId, unitTypeId: dto.unitTypeId } },
    });
    if (existing) {
      throw new ConflictException("This unit already exists in the branch");
    }

    const created = await this.prisma.serviceUnit.create({
      data: {
        branchId: dto.branchId,
        unitTypeId: dto.unitTypeId,
        coordinatorId: dto.coordinatorId ?? null,
      },
    });
    if (dto.coordinatorId) {
      await this.recordUnitMove({
        actorId,
        coordinatorId: dto.coordinatorId,
        unitLabel: unitFacetLabel({
          unitTypeName: unitType.name,
          branchName: branch.name,
        }),
        unitId: created.id,
        note: dto.note,
      });
    }
    return created;
  }

  async updateServiceUnit(id: string, dto: UpdateServiceUnitDto, actorId: string) {
    const unit = await this.prisma.serviceUnit.findUnique({
      where: { id },
      include: {
        branch: { select: { name: true } },
        unitType: { select: { name: true } },
        coordinator: { select: { id: true, name: true } },
      },
    });
    if (!unit) throw new NotFoundException("Service unit not found");
    if (dto.coordinatorId) {
      await this.ensureActiveUser(dto.coordinatorId);
    }

    const previousId = unit.coordinatorId;
    const nextId = dto.coordinatorId ?? null;
    const updated = await this.prisma.serviceUnit.update({
      where: { id },
      data: { coordinatorId: nextId },
    });

    if (nextId !== previousId) {
      const label = unitFacetLabel({
        unitTypeName: unit.unitType.name,
        branchName: unit.branch.name,
      });
      if (previousId) {
        await recordMove(this.prisma, {
          kind: PersonnelMoveKind.UNIT,
          userId: previousId,
          actorId,
          summary: `${label} → No unit`,
          detail: { from: { unitId: id }, to: null },
          note: dto.note,
        });
      }
      if (nextId) {
        await this.recordUnitMove({
          actorId,
          coordinatorId: nextId,
          unitLabel: label,
          unitId: id,
          note: dto.note,
        });
      }
    }
    return updated;
  }

  /** Clears the person's other coordinator seats and audits the move. */
  private async recordUnitMove(args: {
    actorId: string;
    coordinatorId: string;
    unitLabel: string;
    unitId: string;
    note?: string | null;
  }) {
    const held = await this.prisma.serviceUnit.findMany({
      where: { coordinatorId: args.coordinatorId, id: { not: args.unitId } },
      include: {
        branch: { select: { name: true } },
        unitType: { select: { name: true } },
      },
    });
    for (const unit of held) {
      await this.prisma.serviceUnit.update({
        where: { id: unit.id },
        data: { coordinatorId: null },
      });
      await recordMove(this.prisma, {
        kind: PersonnelMoveKind.UNIT,
        userId: args.coordinatorId,
        actorId: args.actorId,
        summary: `${unitFacetLabel({ unitTypeName: unit.unitType.name, branchName: unit.branch.name })} → No unit`,
        detail: { from: { unitId: unit.id }, to: null },
        note: args.note,
      });
    }
    await recordMove(this.prisma, {
      kind: PersonnelMoveKind.UNIT,
      userId: args.coordinatorId,
      actorId: args.actorId,
      summary: `${held.length ? unitFacetLabel({ unitTypeName: held[0].unitType.name, branchName: held[0].branch.name }) : "No unit"} → ${args.unitLabel}`,
      detail: {
        from: held.length ? { unitId: held[0].id } : null,
        to: { unitId: args.unitId },
      },
      note: args.note,
    });
  }

  async removeServiceUnit(id: string) {
    const unit = await this.prisma.serviceUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException("Service unit not found");
    await this.prisma.serviceUnit.delete({ where: { id } });
    return { removed: true };
  }

  private pickOfficer(
    assignments: { office: DirectorateOffice; user: { id: string; name: string } }[],
    office: DirectorateOffice,
  ) {
    const found = assignments.find((a) => a.office === office);
    return found ? { id: found.user.id, name: found.user.name } : null;
  }

  private toMemberRecord(assignment: {
    id: string;
    office: DirectorateOffice;
    deskId: string | null;
    agreedWeeklyHours: number | null;
    termYears: number | null;
    isActive: boolean;
    user: Prisma.UserGetPayload<{ select: typeof memberUserSelect }>;
  }) {
    return {
      id: assignment.id,
      office: assignment.office,
      deskId: assignment.deskId,
      agreedWeeklyHours: assignment.agreedWeeklyHours,
      termYears: assignment.termYears,
      isActive: assignment.isActive,
      user: {
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
        role: assignment.user.role,
        status: assignment.user.status,
        title: assignment.user.title,
        profilePicUrl: assignment.user.profilePicUrl,
        branch: assignment.user.branch,
      },
    };
  }

  private async ensureDirectorate(id: string) {
    const directorate = await this.prisma.directorate.findUnique({ where: { id } });
    if (!directorate) throw new NotFoundException("Directorate not found");
    return directorate;
  }

  private async resolveDesk(directorateId: string, deskId?: string | null) {
    if (!deskId) return null;
    const desk = await this.prisma.desk.findUnique({ where: { id: deskId } });
    if (!desk || desk.directorateId !== directorateId) {
      throw new BadRequestException("Desk is not in this directorate");
    }
    return desk.id;
  }

  private async ensureActiveUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!user) throw new NotFoundException("User not found");
    if (user.status === UserStatus.DEACTIVATED) {
      throw new BadRequestException("User is deactivated");
    }
    return user;
  }
}
