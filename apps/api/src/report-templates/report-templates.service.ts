import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DirectorateOffice,
  NotificationType,
  Prisma,
  Role,
  TemplateLevel,
  TemplateReportStatus,
} from "@repo/database";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/auth.types";
import {
  ReviewTemplateReportDto,
  SubmitTemplateReportDto,
} from "./dto/report-templates.dto";

const DESK_OFFICES = new Set<DirectorateOffice>([
  DirectorateOffice.DESK_HEAD,
  DirectorateOffice.DEPUTY_DESK_HEAD,
]);
const DIRECTORATE_OFFICES = new Set<DirectorateOffice>([
  DirectorateOffice.DIRECTOR,
  DirectorateOffice.DEPUTY_DIRECTOR,
  DirectorateOffice.SECRETARY,
]);

/** Status each reviewer writes when they act on a report of a given level. */
const REVIEW_WRITES: Record<TemplateLevel, Record<string, { status: TemplateReportStatus }>> = {
  UNIT: {
    DESK: { status: TemplateReportStatus.DESK_REVIEWED },
    DIRECTORATE: { status: TemplateReportStatus.DIRECTOR_REVIEWED },
  },
  DESK: {
    DIRECTORATE: { status: TemplateReportStatus.DIRECTOR_REVIEWED },
  },
  DIRECTORATE: {
    RESIDENT: { status: TemplateReportStatus.RESIDENT_REVIEWED },
  },
  COUNCIL: {
    SENIOR: { status: TemplateReportStatus.SENIOR_REVIEWED },
  },
};

@Injectable()
export class ReportTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async seatsFor(user: AuthUser) {
    const [units, assignment] = await Promise.all([
      this.prisma.serviceUnit.findMany({
        where: { coordinatorId: user.id },
        include: {
          unitType: { include: { directorate: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
      this.prisma.directorateAssignment.findUnique({
        where: { userId: user.id },
        include: { directorate: true, desk: true },
      }),
    ]);
    return { units, assignment };
  }

  /** Templates the caller can submit, with their scope options and this period's state. */
  async mine(user: AuthUser) {
    const { units, assignment } = await this.seatsFor(user);
    const directorateIds = new Set<string>();
    units.forEach((u) => directorateIds.add(u.unitType.directorateId));
    if (assignment?.isActive) directorateIds.add(assignment.directorateId);

    const templates = await this.prisma.reportTemplate.findMany({
      where: { active: true, directorateId: { in: [...directorateIds] } },
      include: { directorate: { select: { id: true, name: true } } },
      orderBy: [{ directorateId: "asc" }, { code: "asc" }],
    });

    const isHq =
      user.role === Role.SENIOR_PASTOR || user.role === Role.RESIDENT_PASTOR;

    return templates
      .map((t) => {
        const scopes: { serviceUnitId?: string; deskId?: string; label: string }[] = [];
        if (t.level === TemplateLevel.UNIT) {
          units
            .filter((u) => u.unitType.directorateId === t.directorateId)
            .forEach((u) =>
              scopes.push({
                serviceUnitId: u.id,
                label: `${u.unitType.name} — ${u.branch.name}`,
              }),
            );
        } else if (t.level === TemplateLevel.DESK) {
          if (
            assignment?.isActive &&
            assignment.directorateId === t.directorateId &&
            assignment.deskId &&
            DESK_OFFICES.has(assignment.office)
          ) {
            scopes.push({ deskId: assignment.deskId, label: assignment.desk!.name });
          }
        } else if (t.level === TemplateLevel.DIRECTORATE) {
          if (
            assignment?.isActive &&
            assignment.directorateId === t.directorateId &&
            DIRECTORATE_OFFICES.has(assignment.office)
          ) {
            scopes.push({ label: t.directorate.name });
          }
        } else if (t.level === TemplateLevel.COUNCIL) {
          if (
            assignment?.isActive &&
            assignment.directorateId === t.directorateId &&
            (DIRECTORATE_OFFICES.has(assignment.office) || isHq)
          ) {
            scopes.push({ label: t.directorate.name });
          }
        }
        return { ...t, scopes };
      })
      .filter((t) => t.scopes.length > 0);
  }

  async submit(user: AuthUser, templateId: string, dto: SubmitTemplateReportDto) {
    const template = await this.prisma.reportTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template?.active) throw new NotFoundException("Template not found");

    const allowed = await this.mine(user);
    const mine = allowed.find((t) => t.id === templateId);
    if (!mine) throw new ForbiddenException("You cannot submit this report");

    const scope = dto.scope ?? {};
    const match = mine.scopes.find(
      (s) =>
        (!s.serviceUnitId || s.serviceUnitId === scope.serviceUnitId) &&
        (!s.deskId || s.deskId === scope.deskId) &&
        (!s.serviceUnitId || s.serviceUnitId === scope.serviceUnitId),
    );
    if (!match) throw new ForbiddenException("Scope not in your assignment");

    let branchId: string | null = null;
    if (scope.serviceUnitId) {
      const unit = await this.prisma.serviceUnit.findUnique({
        where: { id: scope.serviceUnitId },
      });
      if (!unit || unit.coordinatorId !== user.id)
        throw new ForbiddenException("Not your unit");
      branchId = unit.branchId;
    }

    const report = await this.prisma.templateReport.create({
      data: {
        templateId,
        directorateId: template.directorateId,
        deskId: scope.deskId ?? null,
        serviceUnitId: scope.serviceUnitId ?? null,
        branchId,
        periodKey: dto.periodKey,
        data: dto.data as Prisma.InputJsonValue,
        status: TemplateReportStatus.SUBMITTED,
        submittedById: user.id,
      },
      include: { template: true },
    });

    await this.notifyReviewers(report.id);
    return report;
  }

  /** Reports waiting on the caller's seat. */
  async reviewQueue(user: AuthUser) {
    const { units, assignment } = await this.seatsFor(user);
    void units;
    const or: Prisma.TemplateReportWhereInput[] = [];

    if (assignment?.isActive) {
      if (DESK_OFFICES.has(assignment.office)) {
        or.push({
          directorateId: assignment.directorateId,
          status: TemplateReportStatus.SUBMITTED,
          template: { level: TemplateLevel.UNIT },
        });
      }
      if (DIRECTORATE_OFFICES.has(assignment.office)) {
        or.push(
          {
            directorateId: assignment.directorateId,
            status: TemplateReportStatus.DESK_REVIEWED,
            template: { level: TemplateLevel.UNIT },
          },
          {
            directorateId: assignment.directorateId,
            status: TemplateReportStatus.SUBMITTED,
            template: { level: TemplateLevel.DESK },
          },
        );
      }
    }
    if (user.role === Role.RESIDENT_PASTOR) {
      or.push({
        status: TemplateReportStatus.SUBMITTED,
        template: { level: TemplateLevel.DIRECTORATE },
      });
    }
    if (user.role === Role.SENIOR_PASTOR) {
      or.push({
        status: TemplateReportStatus.SUBMITTED,
        template: { level: TemplateLevel.COUNCIL },
      });
    }
    if (!or.length) return [];

    return this.prisma.templateReport.findMany({
      where: { OR: or },
      include: {
        template: { include: { directorate: { select: { name: true } } } },
        serviceUnit: { include: { unitType: true, branch: true } },
        desk: true,
        submittedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async review(user: AuthUser, reportId: string, dto: ReviewTemplateReportDto) {
    const report = await this.prisma.templateReport.findUnique({
      where: { id: reportId },
      include: { template: true },
    });
    if (!report) throw new NotFoundException("Report not found");

    const { assignment } = await this.seatsFor(user);
    let reviewer: "DESK" | "DIRECTORATE" | "RESIDENT" | "SENIOR" | null = null;

    const inDirectoriate = assignment?.isActive && assignment.directorateId === report.directorateId;
    if (
      report.template.level === TemplateLevel.UNIT &&
      report.status === TemplateReportStatus.SUBMITTED &&
      inDirectoriate &&
      DESK_OFFICES.has(assignment!.office)
    )
      reviewer = "DESK";
    if (
      inDirectoriate &&
      DIRECTORATE_OFFICES.has(assignment!.office) &&
      ((report.template.level === TemplateLevel.UNIT &&
        report.status === TemplateReportStatus.DESK_REVIEWED) ||
        (report.template.level === TemplateLevel.DESK &&
          report.status === TemplateReportStatus.SUBMITTED))
    )
      reviewer = "DIRECTORATE";
    if (
      report.template.level === TemplateLevel.DIRECTORATE &&
      report.status === TemplateReportStatus.SUBMITTED &&
      user.role === Role.RESIDENT_PASTOR
    )
      reviewer = "RESIDENT";
    if (
      report.template.level === TemplateLevel.COUNCIL &&
      report.status === TemplateReportStatus.SUBMITTED &&
      user.role === Role.SENIOR_PASTOR
    )
      reviewer = "SENIOR";

    if (!reviewer)
      throw new ForbiddenException("This report is not awaiting your review");

    const next = REVIEW_WRITES[report.template.level][reviewer].status;
    const updated = await this.prisma.templateReport.update({
      where: { id: reportId },
      data: {
        status: next,
        data: dto.note
          ? ({ ...(report.data as object), _reviewNotes: [...((report.data as any)?._reviewNotes ?? []), { by: user.id, note: dto.note }] } as Prisma.InputJsonValue)
          : undefined,
      },
      include: { template: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: report.submittedById,
        type: NotificationType.ROLLUP_FORWARDED,
        title: `${updated.template.name} reviewed`,
        body: `Your ${updated.template.code} report was marked ${next
          .toLowerCase()
          .replace("_", " ")}.`,
        metadata: { templateReportId: reportId },
      },
    });
    await this.notifyReviewers(reportId);
    return updated;
  }

  async myReports(user: AuthUser) {
    return this.prisma.templateReport.findMany({
      where: { submittedById: user.id },
      include: {
        template: { include: { directorate: { select: { name: true } } } },
        serviceUnit: { include: { unitType: true, branch: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  private async notifyReviewers(reportId: string) {
    const report = await this.prisma.templateReport.findUnique({
      where: { id: reportId },
      include: { template: { include: { directorate: true } } },
    });
    if (!report) return;
    const { level } = report.template;

    let userIds: string[] = [];
    if (report.status === TemplateReportStatus.SUBMITTED && level === TemplateLevel.UNIT) {
      const heads = await this.prisma.directorateAssignment.findMany({
        where: {
          directorateId: report.directorateId,
          isActive: true,
          office: { in: [DirectorateOffice.DESK_HEAD, DirectorateOffice.DEPUTY_DESK_HEAD] },
        },
        select: { userId: true },
      });
      userIds = heads.map((h) => h.userId);
    } else if (
      (report.status === TemplateReportStatus.DESK_REVIEWED && level === TemplateLevel.UNIT) ||
      (report.status === TemplateReportStatus.SUBMITTED && level === TemplateLevel.DESK)
    ) {
      const directors = await this.prisma.directorateAssignment.findMany({
        where: {
          directorateId: report.directorateId,
          isActive: true,
          office: {
            in: [DirectorateOffice.DIRECTOR, DirectorateOffice.DEPUTY_DIRECTOR, DirectorateOffice.SECRETARY],
          },
        },
        select: { userId: true },
      });
      userIds = directors.map((d) => d.userId);
    } else if (
      report.status === TemplateReportStatus.SUBMITTED &&
      level === TemplateLevel.DIRECTORATE
    ) {
      const residents = await this.prisma.user.findMany({
        where: { role: Role.RESIDENT_PASTOR, status: "ACTIVE" },
        select: { id: true },
      });
      userIds = residents.map((r) => r.id);
    } else if (
      report.status === TemplateReportStatus.SUBMITTED &&
      level === TemplateLevel.COUNCIL
    ) {
      const seniors = await this.prisma.user.findMany({
        where: { role: Role.SENIOR_PASTOR, status: "ACTIVE" },
        select: { id: true },
      });
      userIds = seniors.map((s) => s.id);
    }

    if (!userIds.length) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: NotificationType.ROLLUP_FORWARDED,
        title: `${report.template.name} awaiting review`,
        body: `${report.template.directorate.name} · ${report.periodKey} was submitted.`,
        metadata: { templateReportId: report.id },
      })),
    });
  }
}
