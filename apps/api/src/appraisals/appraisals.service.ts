import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AppraisalPeriod, Prisma } from "@repo/database";
import { Role } from "@repo/types";
import type { AuthUser } from "../common/auth.types";
import { isHrCaseOfficer } from "../common/guards/hr-personnel.guard";
import { PrismaService } from "../prisma/prisma.service";
import {
  AppraisalCountsQuery,
  ListAppraisalsQuery,
  UpsertAppraisalDto,
} from "./dto/appraisals.dto";

const appraisalInclude = {
  subject: { select: { id: true, name: true, role: true } },
  reviewer: { select: { id: true, name: true } },
} satisfies Prisma.PersonnelAppraisalInclude;

@Injectable()
export class AppraisalsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOfficer(user: AuthUser) {
    if (user.role === Role.ADMIN) return;
    if (await isHrCaseOfficer(this.prisma, user.id, "APPRAISAL")) return;
    throw new ForbiddenException("You do not manage appraisals");
  }

  /** One record per person per period — upsert keyed on (subject, period, year). */
  async upsert(user: AuthUser, dto: UpsertAppraisalDto) {
    await this.assertOfficer(user);
    const subject = await this.prisma.user.findUnique({
      where: { id: dto.subjectId },
      select: { id: true },
    });
    if (!subject) throw new BadRequestException("Subject not found");
    return this.prisma.personnelAppraisal.upsert({
      where: {
        subjectId_period_year: {
          subjectId: dto.subjectId,
          period: dto.period,
          year: dto.year,
        },
      },
      create: {
        subjectId: dto.subjectId,
        reviewerId: user.id,
        period: dto.period,
        year: dto.year,
        score: dto.score ?? null,
        strengths: dto.strengths ?? null,
        development: dto.development ?? null,
        recommendation: dto.recommendation ?? null,
        submitted: dto.submitted ?? false,
      },
      update: {
        reviewerId: user.id,
        score: dto.score ?? null,
        strengths: dto.strengths ?? null,
        development: dto.development ?? null,
        recommendation: dto.recommendation ?? null,
        submitted: dto.submitted ?? false,
      },
      include: appraisalInclude,
    });
  }

  async list(user: AuthUser, query: ListAppraisalsQuery) {
    await this.assertOfficer(user);
    const where: Prisma.PersonnelAppraisalWhereInput = {};
    if (query.period) where.period = query.period;
    if (query.year) where.year = query.year;
    if (query.subjectId) where.subjectId = query.subjectId;
    return this.prisma.personnelAppraisal.findMany({
      where,
      orderBy: [{ year: "desc" }, { period: "asc" }],
      take: 200,
      include: appraisalInclude,
    });
  }

  async update(
    user: AuthUser,
    id: string,
    dto: Partial<UpsertAppraisalDto>,
  ) {
    await this.assertOfficer(user);
    const existing = await this.prisma.personnelAppraisal.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Appraisal not found");
    return this.prisma.personnelAppraisal.update({
      where: { id },
      data: {
        reviewerId: user.id,
        ...(dto.score !== undefined ? { score: dto.score } : {}),
        ...(dto.strengths !== undefined ? { strengths: dto.strengths } : {}),
        ...(dto.development !== undefined
          ? { development: dto.development }
          : {}),
        ...(dto.recommendation !== undefined
          ? { recommendation: dto.recommendation }
          : {}),
        ...(dto.submitted !== undefined ? { submitted: dto.submitted } : {}),
      },
      include: appraisalInclude,
    });
  }

  /** Non-identifying counts — "Appraisals completed" feeds the D-reports. */
  async counts(user: AuthUser, query: AppraisalCountsQuery) {
    await this.assertOfficer(user);
    const where: Prisma.PersonnelAppraisalWhereInput = { year: query.year };
    if (query.period) where.period = query.period;
    const [total, submitted] = await Promise.all([
      this.prisma.personnelAppraisal.count({ where }),
      this.prisma.personnelAppraisal.count({
        where: { ...where, submitted: true },
      }),
    ]);
    return { year: query.year, period: query.period ?? null, total, submitted };
  }

  async myAccess(user: AuthUser) {
    if (user.role === Role.ADMIN) return { appraisals: true };
    return {
      appraisals: await isHrCaseOfficer(this.prisma, user.id, "APPRAISAL"),
    };
  }
}
