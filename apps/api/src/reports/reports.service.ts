import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  ReportStatus as PrismaReportStatus,
  SummaryScopeType as PrismaSummaryScopeType,
} from "@repo/database";
import {
  ReportStatus,
  Role,
  NotificationType,
  SummaryScopeType,
  WEEKLY_REPORT_SUBMITTER_ROLES,
  canSubmitWeeklyReports,
  computeWeekOf,
  formatWeekChartLabel,
  getBranchSubmissionState,
  listWeekRange,
  parseReportDate,
  formatReportDate,
  formatWeekEndingLabel,
} from "@repo/types";
import { isRollupVisibleToUpstream, toRollupView } from "./rollup.mapper";
import { AuthUser } from "../common/auth.types";
import { EmailService } from "../email/email.service";
import { getWebAppUrl } from "../common/web-origin";
import { PrismaService } from "../prisma/prisma.service";
import { ListWeeklyReportsDto } from "./dto/list-weekly-reports.dto";
import { UpdateWeeklyReportDto } from "./dto/update-weekly-report.dto";
import { CreateWeeklyReportDto } from "./dto/weekly-report.dto";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { toFeedbackView } from "./feedback.mapper";
import { toWeeklyReportView, weeklyReportInclude } from "./reports.mapper";

const SUBMITTER_ROLES = new Set<Role>(WEEKLY_REPORT_SUBMITTER_ROLES);
const HQ_VIEW_ROLES = new Set<Role>([Role.LEAD_PASTOR, Role.ADMIN]);
const FEEDBACK_ROLES = new Set<Role>([
  Role.ZONAL_PASTOR,
  Role.STATE_PASTOR,
  Role.LEAD_PASTOR,
  Role.ADMIN,
]);

type WeeklyReportWithRelations = Prisma.WeeklyReportGetPayload<{
  include: typeof weeklyReportInclude;
}>;

type BranchRow = {
  branch: { id: string; name: string };
  report: ReturnType<typeof toWeeklyReportView> | null;
  submissionState: ReturnType<typeof getBranchSubmissionState>;
  missed: boolean;
};

type CountSummary = {
  total: number;
  submitted: number;
  missed: number;
  pending: number;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private assertWeeklyReportSubmitter(user: AuthUser): string {
    if (!canSubmitWeeklyReports(user.role, user.branchId)) {
      throw new ForbiddenException("Insufficient permissions");
    }
    return user.branchId!;
  }

  private assertZonalPastor(user: AuthUser): string {
    if (user.role !== Role.ZONAL_PASTOR) {
      throw new ForbiddenException("Insufficient permissions");
    }
    if (!user.zoneId) {
      throw new BadRequestException("No zone assigned to your account");
    }
    return user.zoneId;
  }

  private assertStatePastor(user: AuthUser): string {
    if (user.role !== Role.STATE_PASTOR) {
      throw new ForbiddenException("Insufficient permissions");
    }
    if (!user.stateId) {
      throw new BadRequestException("No state assigned to your account");
    }
    return user.stateId;
  }

  private assertHqViewer(user: AuthUser): void {
    if (!HQ_VIEW_ROLES.has(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }

  private buildBranchScope(user: AuthUser): Prisma.WeeklyReportWhereInput {
    const branchId = this.assertWeeklyReportSubmitter(user);
    return { branchId };
  }

  private async getRollup(scopeType: SummaryScopeType, scopeId: string, weekOf: Date) {
    return this.prisma.hierarchyWeeklyRollup.findUnique({
      where: {
        scopeType_scopeId_weekOf: {
          scopeType: scopeType as PrismaSummaryScopeType,
          scopeId,
          weekOf,
        },
      },
    });
  }

  private async markRollupStaleIfForwarded(
    scopeType: SummaryScopeType,
    scopeId: string,
    weekOf: Date,
  ): Promise<void> {
    const rollup = await this.getRollup(scopeType, scopeId, weekOf);
    if (rollup?.status === "FORWARDED") {
      await this.prisma.hierarchyWeeklyRollup.update({
        where: { id: rollup.id },
        data: { status: "STALE" },
      });
    }
  }

  private async assertCanViewReport(
    user: AuthUser,
    report: WeeklyReportWithRelations,
  ): Promise<void> {
    if (SUBMITTER_ROLES.has(user.role)) {
      if (report.branchId !== user.branchId) {
        throw new ForbiddenException("Insufficient permissions");
      }
      return;
    }

    if (user.role === Role.ZONAL_PASTOR) {
      if (!user.zoneId || report.branch.zoneId !== user.zoneId) {
        throw new ForbiddenException("Insufficient permissions");
      }
      return;
    }

    if (user.role === Role.STATE_PASTOR) {
      if (!user.stateId || report.branch.zone.stateId !== user.stateId) {
        throw new ForbiddenException("Insufficient permissions");
      }
      const zoneRollup = await this.getRollup(
        SummaryScopeType.ZONE,
        report.branch.zoneId,
        report.weekOf,
      );
      if (!isRollupVisibleToUpstream(zoneRollup)) {
        throw new ForbiddenException(
          "Branch report is not yet available — zone has not forwarded",
        );
      }
      return;
    }

    if (HQ_VIEW_ROLES.has(user.role)) {
      const stateRollup = await this.getRollup(
        SummaryScopeType.STATE,
        report.branch.zone.stateId,
        report.weekOf,
      );
      if (!isRollupVisibleToUpstream(stateRollup)) {
        throw new ForbiddenException(
          "Report is not yet available — state has not forwarded",
        );
      }
      const zoneRollup = await this.getRollup(
        SummaryScopeType.ZONE,
        report.branch.zoneId,
        report.weekOf,
      );
      if (!isRollupVisibleToUpstream(zoneRollup)) {
        throw new ForbiddenException(
          "Branch report is not yet available — zone has not forwarded",
        );
      }
      return;
    }

    throw new ForbiddenException("Insufficient permissions");
  }

  private assertCanLeaveFeedback(user: AuthUser): void {
    if (!FEEDBACK_ROLES.has(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }

  private async getReportForAccess(
    user: AuthUser,
    reportId: string,
  ): Promise<WeeklyReportWithRelations> {
    const report = await this.prisma.weeklyReport.findUnique({
      where: { id: reportId },
      include: weeklyReportInclude,
    });
    if (!report) {
      throw new NotFoundException("Report not found");
    }
    await this.assertCanViewReport(user, report);
    return report;
  }

  private async notifyRollupForwarded(
    recipients: { id: string }[],
    scopeLabel: string,
    weekOf: string,
    fromName: string,
  ): Promise<void> {
    const weekLabel = formatWeekEndingLabel(weekOf);
    await Promise.all(
      recipients.map((recipient) =>
        this.prisma.notification.create({
          data: {
            userId: recipient.id,
            type: NotificationType.ROLLUP_FORWARDED,
            title: `${scopeLabel} report forwarded`,
            body: `${fromName} forwarded the weekly report for week ending ${weekLabel}.`,
            metadata: { weekOf, scopeLabel },
          },
        }),
      ),
    );
  }

  private sumAttendance(reports: WeeklyReportWithRelations[]) {
    return reports.reduce(
      (totals, report) => {
        if (!report.attendance) return totals;
        return {
          adultCount: totals.adultCount + report.attendance.adultCount,
          teenageCount: totals.teenageCount + report.attendance.teenageCount,
          childrenCount: totals.childrenCount + report.attendance.childrenCount,
        };
      },
      { adultCount: 0, teenageCount: 0, childrenCount: 0 },
    );
  }

  private sumFinance(reports: WeeklyReportWithRelations[]) {
    return reports.reduce(
      (totals, report) => {
        if (!report.finance) return totals;
        return {
          tithe: totals.tithe + Number(report.finance.tithe),
          offering: totals.offering + Number(report.finance.offering),
          other: totals.other + Number(report.finance.other),
          currency: report.finance.currency,
        };
      },
      { tithe: 0, offering: 0, other: 0, currency: "NGN" },
    );
  }

  private buildBranchRows(
    branches: { id: string; name: string }[],
    reports: WeeklyReportWithRelations[],
    weekOf: string,
  ): BranchRow[] {
    const reportByBranchId = new Map(reports.map((report) => [report.branchId, report]));

    return branches.map((branch) => {
      const report = reportByBranchId.get(branch.id);
      const submissionState = getBranchSubmissionState(weekOf, Boolean(report));

      return {
        branch: { id: branch.id, name: branch.name },
        report: report ? toWeeklyReportView(report) : null,
        submissionState,
        missed: submissionState === "MISSED",
      };
    });
  }

  private countSummary(rows: BranchRow[]): CountSummary {
    const submitted = rows.filter((row) => row.report).length;
    const missed = rows.filter((row) => row.missed).length;
    return {
      total: rows.length,
      submitted,
      missed,
      pending: rows.length - submitted - missed,
    };
  }

  async createWeeklyReport(user: AuthUser, dto: CreateWeeklyReportDto) {
    const branchId = this.assertWeeklyReportSubmitter(user);
    const serviceDate = parseReportDate(dto.serviceDate);
    const weekOf = parseReportDate(computeWeekOf(dto.serviceDate));
    const currency = dto.currency ?? "NGN";

    const existing = await this.prisma.weeklyReport.findUnique({
      where: { branchId_weekOf: { branchId, weekOf } },
    });
    if (existing) {
      throw new ConflictException("A report already exists for this week");
    }

    const report = await this.prisma.$transaction(async (tx) => {
      const created = await tx.weeklyReport.create({
        data: {
          branchId,
          serviceDate,
          weekOf,
          status: PrismaReportStatus.SUBMITTED,
          submittedById: user.id,
        },
      });

      await tx.attendance.create({
        data: {
          reportId: created.id,
          adultCount: dto.adultCount,
          teenageCount: dto.teenageCount,
          childrenCount: dto.childrenCount,
        },
      });

      await tx.finance.create({
        data: {
          reportId: created.id,
          tithe: dto.tithe,
          offering: dto.offering,
          other: dto.other,
          currency,
        },
      });

      return tx.weeklyReport.findUniqueOrThrow({
        where: { id: created.id },
        include: weeklyReportInclude,
      });
    });

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { zoneId: true, zone: { select: { stateId: true } } },
    });
    if (branch) {
      await this.markRollupStaleIfForwarded(SummaryScopeType.ZONE, branch.zoneId, weekOf);
      await this.markRollupStaleIfForwarded(
        SummaryScopeType.STATE,
        branch.zone.stateId,
        weekOf,
      );
    }

    return toWeeklyReportView(report, { editableForUserId: user.id });
  }

  async updateWeeklyReport(user: AuthUser, reportId: string, dto: UpdateWeeklyReportDto) {
    this.assertWeeklyReportSubmitter(user);

    const report = await this.prisma.weeklyReport.findUnique({
      where: { id: reportId },
      include: weeklyReportInclude,
    });
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (report.branchId !== user.branchId) {
      throw new ForbiddenException("Insufficient permissions");
    }
    if (report.submittedById !== user.id) {
      throw new ForbiddenException("Only the original submitter can edit this report");
    }
    if (report.status !== ReportStatus.SUBMITTED) {
      throw new BadRequestException("Report is locked after zone forward");
    }

    const serviceDate = dto.serviceDate ? parseReportDate(dto.serviceDate) : undefined;
    const weekOf = dto.serviceDate
      ? parseReportDate(computeWeekOf(dto.serviceDate))
      : undefined;

    if (weekOf && weekOf.getTime() !== report.weekOf.getTime()) {
      const conflict = await this.prisma.weeklyReport.findUnique({
        where: {
          branchId_weekOf: { branchId: report.branchId, weekOf },
        },
      });
      if (conflict && conflict.id !== report.id) {
        throw new ConflictException("A report already exists for that week");
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.weeklyReport.update({
        where: { id: reportId },
        data: {
          ...(serviceDate ? { serviceDate } : {}),
          ...(weekOf ? { weekOf } : {}),
        },
      });

      if (
        dto.adultCount !== undefined ||
        dto.teenageCount !== undefined ||
        dto.childrenCount !== undefined
      ) {
        await tx.attendance.update({
          where: { reportId },
          data: {
            ...(dto.adultCount !== undefined ? { adultCount: dto.adultCount } : {}),
            ...(dto.teenageCount !== undefined ? { teenageCount: dto.teenageCount } : {}),
            ...(dto.childrenCount !== undefined ? { childrenCount: dto.childrenCount } : {}),
          },
        });
      }

      if (
        dto.tithe !== undefined ||
        dto.offering !== undefined ||
        dto.other !== undefined ||
        dto.currency !== undefined
      ) {
        await tx.finance.update({
          where: { reportId },
          data: {
            ...(dto.tithe !== undefined ? { tithe: dto.tithe } : {}),
            ...(dto.offering !== undefined ? { offering: dto.offering } : {}),
            ...(dto.other !== undefined ? { other: dto.other } : {}),
            ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
          },
        });
      }

      return tx.weeklyReport.findUniqueOrThrow({
        where: { id: reportId },
        include: weeklyReportInclude,
      });
    });

    return toWeeklyReportView(updated, { editableForUserId: user.id });
  }

  async listWeeklyReports(user: AuthUser, dto: ListWeeklyReportsDto) {
    const where = this.buildBranchScope(user);
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;

    if (dto.weekOf) {
      where.weekOf = parseReportDate(dto.weekOf);
    }

    const [items, total] = await Promise.all([
      this.prisma.weeklyReport.findMany({
        where,
        include: weeklyReportInclude,
        orderBy: { weekOf: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.weeklyReport.count({ where }),
    ]);

    return {
      items: items.map((report) => toWeeklyReportView(report, { editableForUserId: user.id })),
      total,
      page,
      perPage,
    };
  }

  async getWeeklyReport(user: AuthUser, reportId: string) {
    let report = await this.prisma.weeklyReport.findUnique({
      where: { id: reportId },
      include: weeklyReportInclude,
    });
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    await this.assertCanViewReport(user, report);
    return toWeeklyReportView(report, { editableForUserId: user.id });
  }

  async forwardZoneReport(user: AuthUser, weekOf: string) {
    const zoneId = this.assertZonalPastor(user);
    const weekOfDate = parseReportDate(weekOf);

    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: { branches: true, state: true },
    });
    if (!zone) {
      throw new NotFoundException("Zone not found");
    }

    const existing = await this.getRollup(SummaryScopeType.ZONE, zoneId, weekOfDate);
    const nextVersion =
      existing && (existing.status === "FORWARDED" || existing.status === "STALE")
        ? existing.version + 1
        : 1;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.hierarchyWeeklyRollup.upsert({
        where: {
          scopeType_scopeId_weekOf: {
            scopeType: PrismaSummaryScopeType.ZONE,
            scopeId: zoneId,
            weekOf: weekOfDate,
          },
        },
        create: {
          scopeType: PrismaSummaryScopeType.ZONE,
          scopeId: zoneId,
          weekOf: weekOfDate,
          status: "FORWARDED",
          version: 1,
          forwardedAt: now,
          forwardedById: user.id,
        },
        update: {
          status: "FORWARDED",
          version: nextVersion,
          forwardedAt: now,
          forwardedById: user.id,
        },
      });

      await tx.weeklyReport.updateMany({
        where: {
          weekOf: weekOfDate,
          branchId: { in: zone.branches.map((branch) => branch.id) },
          status: PrismaReportStatus.SUBMITTED,
        },
        data: { status: PrismaReportStatus.ZONE_REVIEWED },
      });

      const stateRollup = await tx.hierarchyWeeklyRollup.findUnique({
        where: {
          scopeType_scopeId_weekOf: {
            scopeType: PrismaSummaryScopeType.STATE,
            scopeId: zone.stateId,
            weekOf: weekOfDate,
          },
        },
      });
      if (stateRollup?.status === "FORWARDED") {
        await tx.hierarchyWeeklyRollup.update({
          where: { id: stateRollup.id },
          data: { status: "STALE" },
        });
      }
    });

    const statePastors = await this.prisma.user.findMany({
      where: { role: Role.STATE_PASTOR, stateId: zone.stateId, status: "ACTIVE" },
      select: { id: true },
    });
    void this.notifyRollupForwarded(
      statePastors,
      zone.name,
      weekOf,
      user.name,
    );

    return this.getZoneSummary(user, weekOf);
  }

  async forwardStateReport(user: AuthUser, weekOf: string) {
    const stateId = this.assertStatePastor(user);
    const weekOfDate = parseReportDate(weekOf);

    const state = await this.prisma.state.findUnique({
      where: { id: stateId },
      include: { zones: { include: { branches: true } } },
    });
    if (!state) {
      throw new NotFoundException("State not found");
    }

    const existing = await this.getRollup(SummaryScopeType.STATE, stateId, weekOfDate);
    const nextVersion =
      existing && (existing.status === "FORWARDED" || existing.status === "STALE")
        ? existing.version + 1
        : 1;
    const now = new Date();
    const branchIds = state.zones.flatMap((zone) => zone.branches.map((branch) => branch.id));

    await this.prisma.$transaction(async (tx) => {
      await tx.hierarchyWeeklyRollup.upsert({
        where: {
          scopeType_scopeId_weekOf: {
            scopeType: PrismaSummaryScopeType.STATE,
            scopeId: stateId,
            weekOf: weekOfDate,
          },
        },
        create: {
          scopeType: PrismaSummaryScopeType.STATE,
          scopeId: stateId,
          weekOf: weekOfDate,
          status: "FORWARDED",
          version: 1,
          forwardedAt: now,
          forwardedById: user.id,
        },
        update: {
          status: "FORWARDED",
          version: nextVersion,
          forwardedAt: now,
          forwardedById: user.id,
        },
      });

      await tx.weeklyReport.updateMany({
        where: {
          weekOf: weekOfDate,
          branchId: { in: branchIds },
          status: {
            in: [PrismaReportStatus.ZONE_REVIEWED, PrismaReportStatus.STATE_REVIEWED],
          },
        },
        data: { status: PrismaReportStatus.HQ_REVIEWED },
      });
    });

    const hqViewers = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.LEAD_PASTOR, Role.ADMIN] },
        status: "ACTIVE",
      },
      select: { id: true },
    });
    void this.notifyRollupForwarded(hqViewers, state.name, weekOf, user.name);

    return this.getStateSummary(user, weekOf);
  }

  async getZoneSummary(user: AuthUser, weekOf: string) {
    const zoneId = this.assertZonalPastor(user);
    const weekOfDate = parseReportDate(weekOf);

    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        branches: { orderBy: { name: "asc" } },
      },
    });
    if (!zone) {
      throw new NotFoundException("Zone not found");
    }

    const reports = await this.prisma.weeklyReport.findMany({
      where: {
        weekOf: weekOfDate,
        branchId: { in: zone.branches.map((branch) => branch.id) },
      },
      include: weeklyReportInclude,
    });

    const branches = this.buildBranchRows(zone.branches, reports, weekOf);
    const rollup = await this.getRollup(SummaryScopeType.ZONE, zoneId, weekOfDate);

    return {
      weekOf,
      zone: { id: zone.id, name: zone.name },
      rollup: toRollupView(rollup),
      totals: {
        attendance: this.sumAttendance(reports),
        finance: this.sumFinance(reports),
      },
      branches,
      summary: this.countSummary(branches),
    };
  }

  async getStateSummary(user: AuthUser, weekOf: string) {
    const stateId = this.assertStatePastor(user);
    const weekOfDate = parseReportDate(weekOf);

    const state = await this.prisma.state.findUnique({
      where: { id: stateId },
      include: {
        zones: {
          orderBy: { name: "asc" },
          include: {
            branches: { orderBy: { name: "asc" } },
          },
        },
      },
    });
    if (!state) {
      throw new NotFoundException("State not found");
    }

    const zoneIds = state.zones.map((zone) => zone.id);
    const branchIds = state.zones.flatMap((zone) => zone.branches.map((branch) => branch.id));
    const [reports, zoneRollups, stateRollup] = await Promise.all([
      this.prisma.weeklyReport.findMany({
        where: {
          weekOf: weekOfDate,
          branchId: { in: branchIds },
        },
        include: weeklyReportInclude,
      }),
      this.prisma.hierarchyWeeklyRollup.findMany({
        where: {
          weekOf: weekOfDate,
          scopeType: PrismaSummaryScopeType.ZONE,
          scopeId: { in: zoneIds },
        },
      }),
      this.getRollup(SummaryScopeType.STATE, stateId, weekOfDate),
    ]);

    const zoneRollupById = new Map(zoneRollups.map((rollup) => [rollup.scopeId, rollup]));

    const zones = await Promise.all(
      state.zones.map(async (zone) => {
        const zoneRollup = zoneRollupById.get(zone.id) ?? null;
        const forwarded = isRollupVisibleToUpstream(zoneRollup);
        const zoneReports = reports.filter((report) => report.branch.zoneId === zone.id);
        const branches = forwarded
          ? this.buildBranchRows(zone.branches, zoneReports, weekOf)
          : [];

        return {
          zone: { id: zone.id, name: zone.name },
          rollup: toRollupView(zoneRollup),
          forwarded,
          totals: forwarded
            ? {
                attendance: this.sumAttendance(zoneReports),
                finance: this.sumFinance(zoneReports),
              }
            : {
                attendance: { adultCount: 0, teenageCount: 0, childrenCount: 0 },
                finance: { tithe: 0, offering: 0, other: 0, currency: "NGN" },
              },
          branches,
          summary: forwarded
            ? this.countSummary(branches)
            : { total: zone.branches.length, submitted: 0, missed: 0, pending: 0 },
        };
      }),
    );

    const visibleReports = reports.filter((report) => {
      const zoneRollup = zoneRollupById.get(report.branch.zoneId);
      return isRollupVisibleToUpstream(zoneRollup ?? null);
    });
    const allBranches = zones.flatMap((zone) => zone.branches);

    return {
      weekOf,
      state: { id: state.id, name: state.name },
      rollup: toRollupView(stateRollup),
      totals: {
        attendance: this.sumAttendance(visibleReports),
        finance: this.sumFinance(visibleReports),
      },
      zones,
      summary: this.countSummary(allBranches),
    };
  }

  async getNationalSummary(user: AuthUser, weekOf: string) {
    this.assertHqViewer(user);
    const weekOfDate = parseReportDate(weekOf);

    const states = await this.prisma.state.findMany({
      orderBy: { name: "asc" },
      include: {
        zones: {
          orderBy: { name: "asc" },
          include: {
            branches: { orderBy: { name: "asc" } },
          },
        },
      },
    });

    const stateIds = states.map((state) => state.id);
    const zoneIds = states.flatMap((state) => state.zones.map((zone) => zone.id));

    const [reports, stateRollups, zoneRollups] = await Promise.all([
      this.prisma.weeklyReport.findMany({
        where: { weekOf: weekOfDate },
        include: weeklyReportInclude,
      }),
      this.prisma.hierarchyWeeklyRollup.findMany({
        where: {
          weekOf: weekOfDate,
          scopeType: PrismaSummaryScopeType.STATE,
          scopeId: { in: stateIds },
        },
      }),
      this.prisma.hierarchyWeeklyRollup.findMany({
        where: {
          weekOf: weekOfDate,
          scopeType: PrismaSummaryScopeType.ZONE,
          scopeId: { in: zoneIds },
        },
      }),
    ]);

    const stateRollupById = new Map(stateRollups.map((rollup) => [rollup.scopeId, rollup]));
    const zoneRollupById = new Map(zoneRollups.map((rollup) => [rollup.scopeId, rollup]));

    const stateSummaries = states
      .filter((state) => isRollupVisibleToUpstream(stateRollupById.get(state.id) ?? null))
      .map((state) => {
        const stateReports = reports.filter(
          (report) => report.branch.zone.stateId === state.id,
        );

        const zones = state.zones
          .filter((zone) => isRollupVisibleToUpstream(zoneRollupById.get(zone.id) ?? null))
          .map((zone) => {
            const zoneReports = stateReports.filter((report) => report.branch.zoneId === zone.id);
            const branches = this.buildBranchRows(zone.branches, zoneReports, weekOf);

            return {
              zone: { id: zone.id, name: zone.name },
              rollup: toRollupView(zoneRollupById.get(zone.id) ?? null),
              forwarded: true,
              totals: {
                attendance: this.sumAttendance(zoneReports),
                finance: this.sumFinance(zoneReports),
              },
              branches,
              summary: this.countSummary(branches),
            };
          });

        const allBranches = zones.flatMap((zone) => zone.branches);
        const visibleReports = stateReports.filter((report) =>
          isRollupVisibleToUpstream(zoneRollupById.get(report.branch.zoneId) ?? null),
        );

        return {
          state: { id: state.id, name: state.name },
          rollup: toRollupView(stateRollupById.get(state.id) ?? null),
          totals: {
            attendance: this.sumAttendance(visibleReports),
            finance: this.sumFinance(visibleReports),
          },
          zones,
          summary: this.countSummary(allBranches),
        };
      });

    const allBranches = stateSummaries.flatMap((state) =>
      state.zones.flatMap((zone) => zone.branches),
    );
    const visibleReports = reports.filter((report) => {
      const stateRollup = stateRollupById.get(report.branch.zone.stateId);
      const zoneRollup = zoneRollupById.get(report.branch.zoneId);
      return (
        isRollupVisibleToUpstream(stateRollup ?? null) &&
        isRollupVisibleToUpstream(zoneRollup ?? null)
      );
    });

    return {
      weekOf,
      totals: {
        attendance: this.sumAttendance(visibleReports),
        finance: this.sumFinance(visibleReports),
      },
      states: stateSummaries,
      summary: this.countSummary(allBranches),
    };
  }

  async getNationalAnalytics(user: AuthUser, weekOf: string, weeks = 12) {
    this.assertHqViewer(user);
    const weekRange = listWeekRange(weekOf, weeks);
    const weekDates = weekRange.map((w) => parseReportDate(w));
    const anchorWeekDate = parseReportDate(weekOf);

    const states = await this.prisma.state.findMany({
      orderBy: { name: "asc" },
      include: {
        zones: {
          include: {
            branches: true,
          },
        },
      },
    });

    const branchCountByState = new Map<string, number>();
    const stateMeta = new Map(states.map((state) => [state.id, { id: state.id, name: state.name }]));
    for (const state of states) {
      const branchCount = state.zones.reduce(
        (count, zone) => count + zone.branches.length,
        0,
      );
      branchCountByState.set(state.id, branchCount);
    }

    const reports = await this.prisma.weeklyReport.findMany({
      where: {
        weekOf: { in: weekDates },
      },
      include: {
        attendance: true,
        finance: true,
        branch: {
          include: {
            zone: {
              include: {
                state: true,
              },
            },
          },
        },
      },
    });

    type StateAttendance = {
      stateId: string;
      stateName: string;
      adultCount: number;
      teenageCount: number;
      childrenCount: number;
      total: number;
    };

    const attendanceByWeekAndState = new Map<string, Map<string, StateAttendance>>();

    for (const weekKey of weekRange) {
      attendanceByWeekAndState.set(weekKey, new Map());
    }

    const financeByState = new Map<
      string,
      {
        stateId: string;
        stateName: string;
        tithe: number;
        offering: number;
        other: number;
        total: number;
        currency: string;
        branchesSubmitted: number;
        branchesTotal: number;
      }
    >();

    for (const state of states) {
      financeByState.set(state.id, {
        stateId: state.id,
        stateName: state.name,
        tithe: 0,
        offering: 0,
        other: 0,
        total: 0,
        currency: "NGN",
        branchesSubmitted: 0,
        branchesTotal: branchCountByState.get(state.id) ?? 0,
      });
    }

    const financeBranchesByState = new Map<string, Set<string>>();

    for (const report of reports) {
      const stateId = report.branch.zone.stateId;
      const stateInfo = stateMeta.get(stateId);
      if (!stateInfo) continue;

      const reportWeekKey = formatReportDate(report.weekOf);
      const weekMap = attendanceByWeekAndState.get(reportWeekKey);
      if (weekMap && report.attendance) {
        const existing = weekMap.get(stateId) ?? {
          stateId,
          stateName: stateInfo.name,
          adultCount: 0,
          teenageCount: 0,
          childrenCount: 0,
          total: 0,
        };
        existing.adultCount += report.attendance.adultCount;
        existing.teenageCount += report.attendance.teenageCount;
        existing.childrenCount += report.attendance.childrenCount;
        existing.total =
          existing.adultCount + existing.teenageCount + existing.childrenCount;
        weekMap.set(stateId, existing);
      }

      if (report.weekOf.getTime() === anchorWeekDate.getTime() && report.finance) {
        const financeRow = financeByState.get(stateId);
        if (!financeRow) continue;

        financeRow.tithe += Number(report.finance.tithe);
        financeRow.offering += Number(report.finance.offering);
        financeRow.other += Number(report.finance.other);
        financeRow.total = financeRow.tithe + financeRow.offering + financeRow.other;
        financeRow.currency = report.finance.currency;

        const branchSet = financeBranchesByState.get(stateId) ?? new Set<string>();
        branchSet.add(report.branchId);
        financeBranchesByState.set(stateId, branchSet);
      }
    }

    for (const [stateId, branchSet] of financeBranchesByState) {
      const financeRow = financeByState.get(stateId);
      if (financeRow) {
        financeRow.branchesSubmitted = branchSet.size;
      }
    }

    const attendanceTrend = weekRange.map((weekKey) => {
      const weekMap = attendanceByWeekAndState.get(weekKey) ?? new Map();
      const byState = states
        .map((state) => {
          const row = weekMap.get(state.id);
          return (
            row ?? {
              stateId: state.id,
              stateName: state.name,
              adultCount: 0,
              teenageCount: 0,
              childrenCount: 0,
              total: 0,
            }
          );
        })
        .filter((row) => row.total > 0);

      return {
        weekOf: weekKey,
        weekLabel: formatWeekChartLabel(weekKey),
        byState,
      };
    });

    return {
      weekOf,
      weeks: weekRange.length,
      attendanceTrend,
      financeByState: states.map((state) => financeByState.get(state.id)!),
    };
  }

  async listFeedback(user: AuthUser, reportId: string) {
    await this.getReportForAccess(user, reportId);

    const items = await this.prisma.feedback.findMany({
      where: { reportId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return { items: items.map(toFeedbackView) };
  }

  async createFeedback(user: AuthUser, reportId: string, dto: CreateFeedbackDto) {
    this.assertCanLeaveFeedback(user);
    const report = await this.getReportForAccess(user, reportId);

    const feedback = await this.prisma.feedback.create({
      data: {
        reportId,
        fromUserId: user.id,
        toUserId: report.submittedById,
        message: dto.message.trim(),
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: report.submittedById,
        type: NotificationType.FEEDBACK_RECEIVED,
        title: `Feedback on ${report.branch.name}`,
        body: `${user.name} left feedback on your weekly report.`,
        metadata: {
          reportId: report.id,
          feedbackId: feedback.id,
          branchId: report.branchId,
        },
      },
    });

    const weekLabel = formatReportDate(report.weekOf);
    const reportUrl = `${getWebAppUrl()}/reports/submit`;

    void this.emailService
      .sendFeedbackNotification(
        report.submittedBy.email,
        report.submittedBy.name,
        user.name,
        report.branch.name,
        weekLabel,
        feedback.message,
        reportUrl,
      )
      .catch(() => {
        // Email failures should not roll back feedback creation.
      });

    return toFeedbackView(feedback);
  }
}
