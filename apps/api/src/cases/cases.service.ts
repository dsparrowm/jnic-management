import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PersonnelCaseKind,
  PersonnelCaseStatus,
  Prisma,
} from "@repo/database";
import { Role } from "@repo/types";
import type { AuthUser } from "../common/auth.types";
import {
  isHrCaseOfficer,
  isHrPersonnel,
} from "../common/guards/hr-personnel.guard";
import { PrismaService } from "../prisma/prisma.service";
import {
  CaseCountsQuery,
  CreateCaseDto,
  ListCasesQuery,
  UpdateCaseDto,
} from "./dto/cases.dto";

const caseInclude = {
  subject: { select: { id: true, name: true, role: true } },
  openedBy: { select: { id: true, name: true } },
} satisfies Prisma.PersonnelCaseInclude;

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOfficer(user: AuthUser, kind: string) {
    if (user.role === Role.ADMIN) return;
    if (await isHrCaseOfficer(this.prisma, user.id, kind)) return;
    throw new ForbiddenException("You do not manage this case register");
  }

  async create(user: AuthUser, dto: CreateCaseDto) {
    await this.assertOfficer(user, dto.kind);
    if (dto.subjectId) {
      const subject = await this.prisma.user.findUnique({
        where: { id: dto.subjectId },
        select: { id: true },
      });
      if (!subject) throw new BadRequestException("Subject not found");
    }
    const created = await this.prisma.personnelCase.create({
      data: {
        kind: dto.kind,
        subjectId: dto.subjectId ?? null,
        openedById: user.id,
        title: dto.title,
        detail: dto.detail ?? null,
      },
      include: caseInclude,
    });
    return created;
  }

  /** Lists the registers the caller can see — all for admin/HR, per-desk otherwise. */
  async list(user: AuthUser, query: ListCasesQuery) {
    const isAdmin = user.role === Role.ADMIN;
    const hr = await isHrPersonnel(this.prisma, user.id);
    if (query.kind) {
      await this.assertOfficer(user, query.kind);
    } else if (!isAdmin && !hr) {
      const canWelfare = await isHrCaseOfficer(this.prisma, user.id, "WELFARE");
      const canDiscipline = await isHrCaseOfficer(
        this.prisma,
        user.id,
        "DISCIPLINE",
      );
      if (!canWelfare && !canDiscipline) {
        throw new ForbiddenException("You do not manage any case register");
      }
    }
    const where: Prisma.PersonnelCaseWhereInput = {};
    if (query.kind) where.kind = query.kind;
    if (query.status) where.status = query.status;
    const cases = await this.prisma.personnelCase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: caseInclude,
    });
    return cases;
  }

  async update(user: AuthUser, id: string, dto: UpdateCaseDto) {
    const existing = await this.prisma.personnelCase.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Case not found");
    await this.assertOfficer(user, existing.kind);

    const closing =
      dto.status === PersonnelCaseStatus.RESOLVED ||
      dto.status === PersonnelCaseStatus.CLOSED;
    const reopening =
      dto.status === PersonnelCaseStatus.OPEN &&
      existing.status !== PersonnelCaseStatus.OPEN;

    return this.prisma.personnelCase.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.detail !== undefined ? { detail: dto.detail } : {}),
        ...(dto.resolution !== undefined ? { resolution: dto.resolution } : {}),
        ...(closing ? { resolvedAt: new Date() } : {}),
        ...(reopening ? { resolvedAt: null } : {}),
      },
      include: caseInclude,
    });
  }

  /** Non-identifying counts for the D-forms — only numbers leave the register. */
  async counts(user: AuthUser, query: CaseCountsQuery) {
    await this.assertOfficer(user, query.kind);
    const from = new Date(Date.UTC(query.year, query.month - 1, 1));
    const to = new Date(Date.UTC(query.year, query.month, 1));
    const [opened, closed, openNow] = await Promise.all([
      this.prisma.personnelCase.count({
        where: { kind: query.kind, createdAt: { gte: from, lt: to } },
      }),
      this.prisma.personnelCase.count({
        where: { kind: query.kind, resolvedAt: { gte: from, lt: to } },
      }),
      this.prisma.personnelCase.count({
        where: { kind: query.kind, status: PersonnelCaseStatus.OPEN },
      }),
    ]);
    return { kind: query.kind, year: query.year, month: query.month, opened, closed, openNow };
  }

  /** Which registers this user may manage — drives the mobile tab visibility. */
  async myRegisters(user: AuthUser) {
    if (user.role === Role.ADMIN) {
      return { welfare: true, discipline: true };
    }
    const [welfare, discipline] = await Promise.all([
      isHrCaseOfficer(this.prisma, user.id, PersonnelCaseKind.WELFARE),
      isHrCaseOfficer(this.prisma, user.id, PersonnelCaseKind.DISCIPLINE),
    ]);
    return { welfare, discipline };
  }
}
