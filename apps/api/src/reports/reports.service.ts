import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ReportStatus as PrismaReportStatus } from "@repo/database";
import {
  ReportStatus,
  Role,
  WEEKLY_REPORT_SUBMITTER_ROLES,
  canSubmitWeeklyReports,
  computeWeekOf,
  getBranchSubmissionState,
  parseReportDate,
} from "@repo/types";
import { AuthUser } from "../common/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { ListWeeklyReportsDto } from "./dto/list-weekly-reports.dto";
import { UpdateWeeklyReportDto } from "./dto/update-weekly-report.dto";
import { CreateWeeklyReportDto } from "./dto/weekly-report.dto";
import { toWeeklyReportView, weeklyReportInclude } from "./reports.mapper";

const SUBMITTER_ROLES = new Set<Role>(WEEKLY_REPORT_SUBMITTER_ROLES);
const HQ_VIEW_ROLES = new Set<Role>([Role.LEAD_PASTOR, Role.ADMIN]);

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
  constructor(private readonly prisma: PrismaService) {}

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

  private assertCanViewReport(user: AuthUser, report: WeeklyReportWithRelations): void {
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
      return;
    }

    if (HQ_VIEW_ROLES.has(user.role)) {
      return;
    }

    throw new ForbiddenException("Insufficient permissions");
  }

  private async maybeAdvanceReportStatus(
    user: AuthUser,
    report: WeeklyReportWithRelations,
  ): Promise<WeeklyReportWithRelations> {
    let nextStatus: PrismaReportStatus | null = null;

    if (user.role === Role.ZONAL_PASTOR && report.status === ReportStatus.SUBMITTED) {
      nextStatus = PrismaReportStatus.ZONE_REVIEWED;
    } else if (
      user.role === Role.STATE_PASTOR &&
      report.status === ReportStatus.ZONE_REVIEWED
    ) {
      nextStatus = PrismaReportStatus.STATE_REVIEWED;
    } else if (
      HQ_VIEW_ROLES.has(user.role) &&
      report.status === ReportStatus.STATE_REVIEWED
    ) {
      nextStatus = PrismaReportStatus.HQ_REVIEWED;
    }

    if (!nextStatus) {
      return report;
    }

    return this.prisma.weeklyReport.update({
      where: { id: report.id },
      data: { status: nextStatus },
      include: weeklyReportInclude,
    });
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
      throw new BadRequestException("Report is locked after zone review");
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

    this.assertCanViewReport(user, report);
    report = await this.maybeAdvanceReportStatus(user, report);

    return toWeeklyReportView(report, { editableForUserId: user.id });
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

    return {
      weekOf,
      zone: { id: zone.id, name: zone.name },
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

    const branchIds = state.zones.flatMap((zone) => zone.branches.map((branch) => branch.id));
    const reports = await this.prisma.weeklyReport.findMany({
      where: {
        weekOf: weekOfDate,
        branchId: { in: branchIds },
      },
      include: weeklyReportInclude,
    });

    const zones = state.zones.map((zone) => {
      const zoneReports = reports.filter((report) => report.branch.zoneId === zone.id);
      const branches = this.buildBranchRows(zone.branches, zoneReports, weekOf);

      return {
        zone: { id: zone.id, name: zone.name },
        totals: {
          attendance: this.sumAttendance(zoneReports),
          finance: this.sumFinance(zoneReports),
        },
        branches,
        summary: this.countSummary(branches),
      };
    });

    const allBranches = zones.flatMap((zone) => zone.branches);

    return {
      weekOf,
      state: { id: state.id, name: state.name },
      totals: {
        attendance: this.sumAttendance(reports),
        finance: this.sumFinance(reports),
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

    const reports = await this.prisma.weeklyReport.findMany({
      where: { weekOf: weekOfDate },
      include: weeklyReportInclude,
    });

    const stateSummaries = states.map((state) => {
      const stateReports = reports.filter(
        (report) => report.branch.zone.stateId === state.id,
      );

      const zones = state.zones.map((zone) => {
        const zoneReports = stateReports.filter((report) => report.branch.zoneId === zone.id);
        const branches = this.buildBranchRows(zone.branches, zoneReports, weekOf);

        return {
          zone: { id: zone.id, name: zone.name },
          totals: {
            attendance: this.sumAttendance(zoneReports),
            finance: this.sumFinance(zoneReports),
          },
          branches,
          summary: this.countSummary(branches),
        };
      });

      const allBranches = zones.flatMap((zone) => zone.branches);

      return {
        state: { id: state.id, name: state.name },
        totals: {
          attendance: this.sumAttendance(stateReports),
          finance: this.sumFinance(stateReports),
        },
        zones,
        summary: this.countSummary(allBranches),
      };
    });

    const allBranches = stateSummaries.flatMap((state) =>
      state.zones.flatMap((zone) => zone.branches),
    );

    return {
      weekOf,
      totals: {
        attendance: this.sumAttendance(reports),
        finance: this.sumFinance(reports),
      },
      states: stateSummaries,
      summary: this.countSummary(allBranches),
    };
  }
}
