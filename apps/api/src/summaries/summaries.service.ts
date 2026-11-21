import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  MonthlySummary,
  MonthlySummaryStatus as PrismaMonthlySummaryStatus,
  SummaryScopeType as PrismaSummaryScopeType,
} from "@repo/database";
import {
  Role,
  SummaryScopeType,
  canSubmitWeeklyReports,
  formatWeekChartLabel,
  formatReportDate,
  isHqPastor,
} from "@repo/types";
import { AuthUser } from "../common/auth.types";
import {
  regionalSeatId,
  stateSeatId,
  zonalSeatId,
} from "../common/scope-seats";
import { PrismaService } from "../prisma/prisma.service";
import { FileMonthlySummaryDto } from "./dto/file-monthly-summary.dto";

export const HQ_SCOPE_ID = "hq";

type ReportWithRelations = {
  weekOf: Date;
  branchId: string;
  branch: {
    id: string;
    name: string;
    zoneId: string | null;
    stateId: string;
    state: { id: string; name: string; regionId: string | null };
    zone: {
      id: string;
      name: string;
      stateId: string;
      state: { id: string; name: string; regionId: string | null };
    } | null;
  };
  attendance: {
    adultCount: number;
    teenageCount: number;
    childrenCount: number;
    menCount: number;
    womenCount: number;
    youthCount: number;
    firstTimeVisitors: number;
    newConverts: number;
  } | null;
  finance: {
    tithe: unknown;
    offering: unknown;
    other: unknown;
    currency: string;
  } | null;
};

type AggregateTotals = {
  totalAdult: number;
  totalTeenage: number;
  totalChildren: number;
  totalMen: number;
  totalWomen: number;
  totalYouth: number;
  totalVisitors: number;
  totalConverts: number;
  totalTithe: number;
  totalOffering: number;
  totalOther: number;
  currency: string;
};

type WeekBucket = AggregateTotals & { weekOf: string; weekLabel: string };

@Injectable()
export class SummariesService {
  constructor(private readonly prisma: PrismaService) {}

  private monthDateRange(month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return { start, end };
  }

  private emptyTotals(): AggregateTotals {
    return {
      totalAdult: 0,
      totalTeenage: 0,
      totalChildren: 0,
      totalMen: 0,
      totalWomen: 0,
      totalYouth: 0,
      totalVisitors: 0,
      totalConverts: 0,
      totalTithe: 0,
      totalOffering: 0,
      totalOther: 0,
      currency: "NGN",
    };
  }

  private addReportToTotals(totals: AggregateTotals, report: ReportWithRelations) {
    if (report.attendance) {
      totals.totalAdult += report.attendance.adultCount;
      totals.totalTeenage += report.attendance.teenageCount;
      totals.totalChildren += report.attendance.childrenCount;
      totals.totalMen += report.attendance.menCount;
      totals.totalWomen += report.attendance.womenCount;
      totals.totalYouth += report.attendance.youthCount;
      totals.totalVisitors += report.attendance.firstTimeVisitors;
      totals.totalConverts += report.attendance.newConverts;
    }
    if (report.finance) {
      totals.totalTithe += Number(report.finance.tithe);
      totals.totalOffering += Number(report.finance.offering);
      totals.totalOther += Number(report.finance.other);
      totals.currency = report.finance.currency;
    }
  }

  private mergeTotals(target: AggregateTotals, source: AggregateTotals) {
    target.totalAdult += source.totalAdult;
    target.totalTeenage += source.totalTeenage;
    target.totalChildren += source.totalChildren;
    target.totalMen += source.totalMen;
    target.totalWomen += source.totalWomen;
    target.totalYouth += source.totalYouth;
    target.totalVisitors += source.totalVisitors;
    target.totalConverts += source.totalConverts;
    target.totalTithe += source.totalTithe;
    target.totalOffering += source.totalOffering;
    target.totalOther += source.totalOther;
    if (source.currency) target.currency = source.currency;
  }

  private async computeMonthlySummaries(month: number, year: number) {
    const { start, end } = this.monthDateRange(month, year);

    const reports = (await this.prisma.weeklyReport.findMany({
      where: {
        weekOf: { gte: start, lte: end },
      },
      include: {
        attendance: true,
        finance: true,
        branch: {
          include: {
            state: true,
            zone: {
              include: { state: true },
            },
          },
        },
      },
    })) as ReportWithRelations[];

    const branchTotals = new Map<string, AggregateTotals>();
    const zoneTotals = new Map<string, AggregateTotals>();
    const stateTotals = new Map<string, AggregateTotals>();
    const hqTotals = this.emptyTotals();

    const branchNames = new Map<string, string>();
    const zoneNames = new Map<string, string>();
    const stateNames = new Map<string, string>();

    for (const report of reports) {
      const branchId = report.branch.id;
      const zoneId = report.branch.zone?.id ?? null;
      const stateId = report.branch.stateId;

      branchNames.set(branchId, report.branch.name);
      if (zoneId && report.branch.zone) {
        zoneNames.set(zoneId, report.branch.zone.name);
      }
      stateNames.set(stateId, report.branch.state.name);

      const scopes: Array<[Map<string, AggregateTotals>, string]> = [
        [branchTotals, branchId],
        [stateTotals, stateId],
      ];
      if (zoneId) scopes.push([zoneTotals, zoneId]);

      for (const [map, id] of scopes) {
        const current = map.get(id) ?? this.emptyTotals();
        this.addReportToTotals(current, report);
        map.set(id, current);
      }

      this.addReportToTotals(hqTotals, report);
    }

    const upsert = async (
      scopeType: PrismaSummaryScopeType,
      scopeId: string,
      totals: AggregateTotals,
      defaultStatus: PrismaMonthlySummaryStatus,
    ) => {
      const existing = await this.prisma.monthlySummary.findUnique({
        where: {
          scopeType_scopeId_month_year: {
            scopeType,
            scopeId,
            month,
            year,
          },
        },
      });

      const totalsUnchanged =
        existing != null &&
        existing.currency === totals.currency &&
        existing.totalAdult === totals.totalAdult &&
        existing.totalTeenage === totals.totalTeenage &&
        existing.totalChildren === totals.totalChildren &&
        existing.totalMen === totals.totalMen &&
        existing.totalWomen === totals.totalWomen &&
        existing.totalYouth === totals.totalYouth &&
        existing.totalVisitors === totals.totalVisitors &&
        existing.totalConverts === totals.totalConverts &&
        Number(existing.totalTithe) === totals.totalTithe &&
        Number(existing.totalOffering) === totals.totalOffering &&
        Number(existing.totalOther) === totals.totalOther;

      const status =
        existing?.status === PrismaMonthlySummaryStatus.APPROVED ||
        (existing?.status === PrismaMonthlySummaryStatus.RETURNED &&
          totalsUnchanged)
          ? existing.status
          : defaultStatus;

      await this.prisma.monthlySummary.upsert({
        where: {
          scopeType_scopeId_month_year: {
            scopeType,
            scopeId,
            month,
            year,
          },
        },
        create: {
          scopeType,
          scopeId,
          month,
          year,
          ...totals,
          status: defaultStatus,
        },
        update: {
          ...totals,
          status,
          ...(status === PrismaMonthlySummaryStatus.APPROVED
            ? {}
            : { approvedAt: null, approvedById: null }),
        },
      });
    };

    for (const [scopeId, totals] of branchTotals) {
      await upsert(PrismaSummaryScopeType.BRANCH, scopeId, totals, PrismaMonthlySummaryStatus.APPROVED);
    }
    for (const [scopeId, totals] of zoneTotals) {
      await upsert(PrismaSummaryScopeType.ZONE, scopeId, totals, PrismaMonthlySummaryStatus.APPROVED);
    }
    for (const [scopeId, totals] of stateTotals) {
      await upsert(PrismaSummaryScopeType.STATE, scopeId, totals, PrismaMonthlySummaryStatus.APPROVED);
    }
    if (reports.length > 0) {
      await upsert(
        PrismaSummaryScopeType.HQ,
        HQ_SCOPE_ID,
        hqTotals,
        PrismaMonthlySummaryStatus.PENDING_LP_APPROVAL,
      );
    }

    return { branchNames, zoneNames, stateNames, reports };
  }

  private buildWeeklyBreakdown(
    reports: ReportWithRelations[],
    filter: (report: ReportWithRelations) => boolean,
  ): WeekBucket[] {
    const byWeek = new Map<string, WeekBucket>();

    for (const report of reports.filter(filter)) {
      const weekOf = formatReportDate(report.weekOf);
      const bucket =
        byWeek.get(weekOf) ??
        ({
          weekOf,
          weekLabel: formatWeekChartLabel(weekOf),
          ...this.emptyTotals(),
        } satisfies WeekBucket);
      this.addReportToTotals(bucket, report);
      byWeek.set(weekOf, bucket);
    }

    return [...byWeek.values()].sort((a, b) => a.weekOf.localeCompare(b.weekOf));
  }

  private getVisibleScopeFilters(user: AuthUser): Array<{
    scopeType: SummaryScopeType;
    scopeId: string;
    scopeName: string;
  }> {
    if (user.role === Role.ADMIN || isHqPastor(user.role)) {
      return [{ scopeType: SummaryScopeType.HQ, scopeId: HQ_SCOPE_ID, scopeName: "National" }];
    }
    // Every seat the user holds, widest first — a dual-seated pastor (e.g.
    // regional + acting state) sees each scope they serve.
    const scopes: Array<{ scopeType: SummaryScopeType; scopeId: string; scopeName: string }> = [];
    const regionId = regionalSeatId(user);
    if (regionId) {
      scopes.push({ scopeType: SummaryScopeType.REGION, scopeId: regionId, scopeName: "My region" });
    }
    const stateId = stateSeatId(user);
    if (stateId) {
      scopes.push({ scopeType: SummaryScopeType.STATE, scopeId: stateId, scopeName: "My state" });
    }
    const zoneId = zonalSeatId(user);
    if (zoneId) {
      scopes.push({ scopeType: SummaryScopeType.ZONE, scopeId: zoneId, scopeName: "My zone" });
    }
    if (user.role === Role.BRANCH_PASTOR && user.branchId) {
      scopes.push({ scopeType: SummaryScopeType.BRANCH, scopeId: user.branchId, scopeName: "My branch" });
    }
    return scopes;
  }

  private async resolveScopeName(
    scopeType: SummaryScopeType,
    scopeId: string,
  ): Promise<string> {
    if (scopeType === SummaryScopeType.HQ) return "National";
    if (scopeType === SummaryScopeType.BRANCH) {
      const branch = await this.prisma.branch.findUnique({ where: { id: scopeId } });
      return branch?.name ?? scopeId;
    }
    if (scopeType === SummaryScopeType.ZONE) {
      const zone = await this.prisma.zone.findUnique({ where: { id: scopeId } });
      return zone?.name ?? scopeId;
    }
    if (scopeType === SummaryScopeType.REGION) {
      const region = await this.prisma.region.findUnique({ where: { id: scopeId } });
      return region?.name ?? scopeId;
    }
    const state = await this.prisma.state.findUnique({ where: { id: scopeId } });
    return state?.name ?? scopeId;
  }

  private summaryMatchesReport(
    scopeType: SummaryScopeType,
    scopeId: string,
    report: ReportWithRelations,
  ): boolean {
    if (scopeType === SummaryScopeType.BRANCH) return report.branch.id === scopeId;
    if (scopeType === SummaryScopeType.ZONE) return report.branch.zone?.id === scopeId;
    if (scopeType === SummaryScopeType.STATE) return report.branch.stateId === scopeId;
    if (scopeType === SummaryScopeType.REGION) {
      return report.branch.state?.regionId === scopeId;
    }
    return true;
  }

  private mapSummaryTotals(record: {
    totalAdult: number;
    totalTeenage: number;
    totalChildren: number;
    totalMen: number;
    totalWomen: number;
    totalYouth: number;
    totalVisitors: number;
    totalConverts: number;
    totalTithe: unknown;
    totalOffering: unknown;
    totalOther: unknown;
    currency: string;
  }) {
    return {
      adult: record.totalAdult,
      teenage: record.totalTeenage,
      children: record.totalChildren,
      men: record.totalMen,
      women: record.totalWomen,
      youth: record.totalYouth,
      visitors: record.totalVisitors,
      converts: record.totalConverts,
      tithe: Number(record.totalTithe),
      offering: Number(record.totalOffering),
      other: Number(record.totalOther),
      currency: record.currency,
    };
  }

  private async buildStateBreakdown(
    month: number,
    year: number,
    reports: ReportWithRelations[],
  ) {
    const stateSummaries = await this.prisma.monthlySummary.findMany({
      where: {
        scopeType: PrismaSummaryScopeType.STATE,
        month,
        year,
      },
    });

    if (stateSummaries.length === 0) {
      return [];
    }

    const states = await this.prisma.state.findMany({
      where: { id: { in: stateSummaries.map((summary) => summary.scopeId) } },
      select: { id: true, name: true },
    });
    const stateNameById = new Map(states.map((state) => [state.id, state.name]));

    const branchesByState = new Map<string, Set<string>>();
    const weeklyReportsByState = new Map<string, number>();
    for (const report of reports) {
      const stateId = report.branch.stateId;
      weeklyReportsByState.set(stateId, (weeklyReportsByState.get(stateId) ?? 0) + 1);
      const branchIds = branchesByState.get(stateId) ?? new Set<string>();
      branchIds.add(report.branch.id);
      branchesByState.set(stateId, branchIds);
    }

    const branchCounts = await this.prisma.branch.groupBy({
      by: ["stateId"],
      _count: { id: true },
      where: {
        stateId: { in: stateSummaries.map((summary) => summary.scopeId) },
      },
    });
    const branchesTotalByState = new Map(
      branchCounts.map((row) => [row.stateId, row._count.id]),
    );

    return stateSummaries
      .map((record) => ({
        stateId: record.scopeId,
        stateName: stateNameById.get(record.scopeId) ?? record.scopeId,
        branchesReporting: branchesByState.get(record.scopeId)?.size ?? 0,
        branchesTotal: branchesTotalByState.get(record.scopeId) ?? 0,
        weeklyReports: weeklyReportsByState.get(record.scopeId) ?? 0,
        totals: this.mapSummaryTotals(record),
      }))
      .sort((a, b) => a.stateName.localeCompare(b.stateName));
  }

  private async buildScopeOptions(user: AuthUser) {
    if (user.role !== Role.ADMIN && !isHqPastor(user.role)) {
      return undefined;
    }

    const states = await this.prisma.state.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return [
      {
        scopeType: SummaryScopeType.HQ,
        scopeId: HQ_SCOPE_ID,
        scopeName: "National",
      },
      ...states.map((state) => ({
        scopeType: SummaryScopeType.STATE,
        scopeId: state.id,
        scopeName: state.name,
      })),
    ];
  }

  private async resolveRequestScopes(
    user: AuthUser,
    options?: { scopeType?: SummaryScopeType; scopeId?: string },
  ): Promise<
    Array<{
      scopeType: SummaryScopeType;
      scopeId: string;
      scopeName: string;
    }>
  > {
    if (!options?.scopeType) {
      return this.getVisibleScopeFilters(user);
    }

    if (user.role !== Role.ADMIN && !isHqPastor(user.role)) {
      throw new ForbiddenException("Scope override not permitted");
    }

    if (options.scopeType === SummaryScopeType.HQ) {
      return [
        {
          scopeType: SummaryScopeType.HQ,
          scopeId: HQ_SCOPE_ID,
          scopeName: "National",
        },
      ];
    }

    if (options.scopeType === SummaryScopeType.STATE) {
      if (!options.scopeId) {
        throw new BadRequestException("scopeId is required when scopeType is STATE");
      }

      const state = await this.prisma.state.findUnique({ where: { id: options.scopeId } });
      if (!state) {
        throw new NotFoundException("State not found");
      }

      return [
        {
          scopeType: SummaryScopeType.STATE,
          scopeId: state.id,
          scopeName: state.name,
        },
      ];
    }

    throw new BadRequestException("Invalid scopeType for monthly summary filter");
  }

  private async buildCoverage(
    reports: ReportWithRelations[],
    scopeType: SummaryScopeType,
    scopeId: string,
  ) {
    const scopedReports = reports.filter((report) =>
      this.summaryMatchesReport(scopeType, scopeId, report),
    );
    const branchIds = new Set(scopedReports.map((report) => report.branch.id));

    let branchesTotal = 0;
    if (scopeType === SummaryScopeType.HQ) {
      branchesTotal = await this.prisma.branch.count();
    } else if (scopeType === SummaryScopeType.STATE) {
      branchesTotal = await this.prisma.branch.count({
        where: { zone: { stateId: scopeId } },
      });
    } else if (scopeType === SummaryScopeType.ZONE) {
      branchesTotal = await this.prisma.branch.count({ where: { zoneId: scopeId } });
    } else if (scopeType === SummaryScopeType.REGION) {
      branchesTotal = await this.prisma.branch.count({
        where: { zone: { state: { regionId: scopeId } } },
      });
    } else if (scopeType === SummaryScopeType.BRANCH) {
      branchesTotal = 1;
    }

    return {
      branchesReporting: branchIds.size,
      branchesTotal,
      weeklyReports: scopedReports.length,
    };
  }

  private countSundaysInMonth(month: number, year: number): number {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0) {
        count += 1;
      }
    }
    return count;
  }

  private formatMonthLabel(month: number, year: number): string {
    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
  }

  async getZoneMonthSnapshot(user: AuthUser, month: number, year: number) {
    const zoneId = zonalSeatId(user);
    if (!zoneId) {
      return null;
    }

    const { reports } = await this.computeMonthlySummaries(month, year);
    const weeks = this.buildWeeklyBreakdown(reports, (report) =>
      this.summaryMatchesReport(SummaryScopeType.ZONE, zoneId, report),
    );

    const totals = this.emptyTotals();
    for (const week of weeks) {
      this.mergeTotals(totals, week);
    }

    const coverage = await this.buildCoverage(
      reports,
      SummaryScopeType.ZONE,
      zoneId,
    );

    return {
      month,
      year,
      label: this.formatMonthLabel(month, year),
      weeksReported: coverage.branchesReporting,
      weeksExpected: coverage.branchesTotal,
      totals: {
        adult: totals.totalAdult,
        teenage: totals.totalTeenage,
        children: totals.totalChildren,
        tithe: totals.totalTithe,
        offering: totals.totalOffering,
        other: totals.totalOther,
        currency: totals.currency,
      },
    };
  }

  async getStateMonthSnapshot(user: AuthUser, month: number, year: number) {
    const stateId = stateSeatId(user);
    if (!stateId) {
      return null;
    }

    const { reports } = await this.computeMonthlySummaries(month, year);
    const weeks = this.buildWeeklyBreakdown(reports, (report) =>
      this.summaryMatchesReport(SummaryScopeType.STATE, stateId, report),
    );

    const totals = this.emptyTotals();
    for (const week of weeks) {
      this.mergeTotals(totals, week);
    }

    const coverage = await this.buildCoverage(
      reports,
      SummaryScopeType.STATE,
      stateId,
    );

    return {
      month,
      year,
      label: this.formatMonthLabel(month, year),
      weeksReported: coverage.branchesReporting,
      weeksExpected: coverage.branchesTotal,
      totals: {
        adult: totals.totalAdult,
        teenage: totals.totalTeenage,
        children: totals.totalChildren,
        tithe: totals.totalTithe,
        offering: totals.totalOffering,
        other: totals.totalOther,
        currency: totals.currency,
      },
    };
  }

  async getBranchMonthSnapshot(user: AuthUser, month: number, year: number) {
    if (!canSubmitWeeklyReports(user.role, user.branchId)) {
      return null;
    }

    const { reports } = await this.computeMonthlySummaries(month, year);
    const weeks = this.buildWeeklyBreakdown(reports, (report) =>
      this.summaryMatchesReport(SummaryScopeType.BRANCH, user.branchId!, report),
    );

    const totals = this.emptyTotals();
    for (const week of weeks) {
      this.mergeTotals(totals, week);
    }

    return {
      month,
      year,
      label: this.formatMonthLabel(month, year),
      weeksReported: weeks.length,
      weeksExpected: this.countSundaysInMonth(month, year),
      totals: {
        adult: totals.totalAdult,
        teenage: totals.totalTeenage,
        children: totals.totalChildren,
        tithe: totals.totalTithe,
        offering: totals.totalOffering,
        other: totals.totalOther,
        currency: totals.currency,
      },
    };
  }

  async listMonthlySummaries(
    user: AuthUser,
    month: number,
    year: number,
    options?: { scopeType?: SummaryScopeType; scopeId?: string },
  ) {
    const { reports } = await this.computeMonthlySummaries(month, year);
    const scopes = await this.resolveRequestScopes(user, options);
    const scopeOptions = await this.buildScopeOptions(user);
    const isNationalViewer = user.role === Role.ADMIN || isHqPastor(user.role);

    const summaries = await Promise.all(
      scopes.map(async (scope) => {
        const record = await this.prisma.monthlySummary.findUnique({
          where: {
            scopeType_scopeId_month_year: {
              scopeType: scope.scopeType as PrismaSummaryScopeType,
              scopeId: scope.scopeId,
              month,
              year,
            },
          },
          include: { filedBy: { select: { name: true } } },
        });

        if (!record) {
          return null;
        }

        const scopeName = await this.resolveScopeName(scope.scopeType, scope.scopeId);
        const weeks = this.buildWeeklyBreakdown(reports, (report) =>
          this.summaryMatchesReport(scope.scopeType, scope.scopeId, report),
        ).map((week) => ({
          weekOf: week.weekOf,
          weekLabel: week.weekLabel,
          adult: week.totalAdult,
          teenage: week.totalTeenage,
          children: week.totalChildren,
          tithe: week.totalTithe,
          offering: week.totalOffering,
          other: week.totalOther,
          currency: week.currency,
        }));

        const stateBreakdown =
          scope.scopeType === SummaryScopeType.HQ && isNationalViewer
            ? await this.buildStateBreakdown(month, year, reports)
            : undefined;
        const coverage = await this.buildCoverage(reports, scope.scopeType, scope.scopeId);

        return {
          id: record.id,
          scopeType: record.scopeType,
          scopeId: record.scopeId,
          scopeName,
          month: record.month,
          year: record.year,
          status: record.status,
          approvedAt: record.approvedAt?.toISOString() ?? null,
          returnNote: record.returnNote,
          returnedAt: record.returnedAt?.toISOString() ?? null,
          totals: this.mapSummaryTotals(record),
          weeks,
          coverage,
          reportingRate:
            coverage.branchesTotal > 0
              ? Math.round((coverage.branchesReporting / coverage.branchesTotal) * 100)
              : null,
          filing: {
            newChurches: record.newChurches,
            welfareNote: record.welfareNote,
            plansNote: record.plansNote,
            filedAt: record.filedAt?.toISOString() ?? null,
            filedByName: record.filedBy?.name ?? null,
          },
          ...(stateBreakdown ? { stateBreakdown } : {}),
        };
      }),
    );

    return {
      month,
      year,
      items: summaries.filter((item) => item !== null),
      ...(scopeOptions ? { scopeOptions } : {}),
    };
  }

  async listPendingApprovals(user: AuthUser) {
    if (!isHqPastor(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const items = await this.prisma.monthlySummary.findMany({
      where: {
        scopeType: PrismaSummaryScopeType.HQ,
        status: PrismaMonthlySummaryStatus.PENDING_LP_APPROVAL,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        scopeType: item.scopeType,
        scopeId: item.scopeId,
        scopeName: "National",
        month: item.month,
        year: item.year,
        status: item.status,
        returnNote: item.returnNote,
        returnedAt: item.returnedAt?.toISOString() ?? null,
        totals: {
          adult: item.totalAdult,
          teenage: item.totalTeenage,
          children: item.totalChildren,
          tithe: Number(item.totalTithe),
          offering: Number(item.totalOffering),
          other: Number(item.totalOther),
          currency: item.currency,
        },
      })),
    };
  }

  /** B5: assembled quarterly council view for Senior/Resident Pastor. */
  async getQuarterlyCouncil(user: AuthUser, quarter: number, year: number) {
    if (!isHqPastor(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }
    if (quarter < 1 || quarter > 4) {
      throw new BadRequestException("Quarter must be 1–4");
    }

    const months = [quarter * 3 - 2, quarter * 3 - 1, quarter * 3];

    const summaries = await this.prisma.monthlySummary.findMany({
      where: { year, month: { in: months } },
      include: { filedBy: { select: { name: true } } },
      orderBy: [{ month: "asc" }],
    });

    // Quarter totals from the national (HQ) monthly summaries.
    const hqMonths = summaries.filter(
      (s) => s.scopeType === PrismaSummaryScopeType.HQ,
    );
    const totals = hqMonths.reduce(
      (acc, s) => ({
        men: acc.men + s.totalMen,
        women: acc.women + s.totalWomen,
        youth: acc.youth + s.totalYouth,
        children: acc.children + s.totalChildren,
        visitors: acc.visitors + s.totalVisitors,
        converts: acc.converts + s.totalConverts,
        newChurches: acc.newChurches + s.newChurches,
        tithe: acc.tithe + Number(s.totalTithe),
        offering: acc.offering + Number(s.totalOffering),
        other: acc.other + Number(s.totalOther),
        currency: s.currency,
      }),
      {
        men: 0,
        women: 0,
        youth: 0,
        children: 0,
        visitors: 0,
        converts: 0,
        newChurches: 0,
        tithe: 0,
        offering: 0,
        other: 0,
        currency: "NGN",
      },
    );

    // B4 filing compliance across territory scopes for the quarter's latest month.
    const latestMonth = months[months.length - 1];
    const latestSummaries = summaries.filter(
      (s) => s.month === latestMonth && s.scopeType !== PrismaSummaryScopeType.BRANCH,
    );
    const territoryFilings = await Promise.all(
      latestSummaries.map(async (s) => ({
        scopeType: s.scopeType,
        scopeId: s.scopeId,
        scopeName: await this.resolveScopeName(
          s.scopeType as unknown as SummaryScopeType,
          s.scopeId,
        ),
        filed: s.filedAt != null,
        filedByName: s.filedBy?.name ?? null,
        filedAt: s.filedAt?.toISOString() ?? null,
        status: s.status,
      })),
    );

    // Directorate report submissions for the quarter (monthly + quarterly period keys).
    const periodKeys = [
      ...months.map((m) => `${year}-${String(m).padStart(2, "0")}`),
      `${year}-Q${quarter}`,
    ];
    const templateReports = await this.prisma.templateReport.findMany({
      where: { periodKey: { in: periodKeys } },
      select: {
        directorateId: true,
        status: true,
        directorate: { select: { name: true } },
      },
    });
    const byDirectorate = new Map<
      string,
      { name: string; submitted: number; reviewed: number }
    >();
    for (const r of templateReports) {
      const entry =
        byDirectorate.get(r.directorateId) ??
        { name: r.directorate.name, submitted: 0, reviewed: 0 };
      entry.submitted += 1;
      if (r.status !== "SUBMITTED") entry.reviewed += 1;
      byDirectorate.set(r.directorateId, entry);
    }

    return {
      quarter,
      year,
      label: `Q${quarter} ${year}`,
      months: hqMonths.map((s) => ({
        month: s.month,
        monthLabel: this.formatMonthLabel(s.month, s.year),
        totals: this.mapSummaryTotals(s),
        filing: {
          filed: s.filedAt != null,
          filedByName: s.filedBy?.name ?? null,
          filedAt: s.filedAt?.toISOString() ?? null,
          newChurches: s.newChurches,
          welfareNote: s.welfareNote,
          plansNote: s.plansNote,
        },
        status: s.status,
      })),
      totals,
      territoryFilings,
      directorateReports: [...byDirectorate.entries()].map(
        ([directorateId, entry]) => ({ directorateId, ...entry }),
      ),
    };
  }

  async fileMonthlySummary(
    user: AuthUser,
    id: string,
    dto: FileMonthlySummaryDto,
  ): Promise<MonthlySummary> {
    const summary = await this.prisma.monthlySummary.findUnique({ where: { id } });
    if (!summary) {
      throw new NotFoundException("Monthly summary not found");
    }
    if (summary.status === PrismaMonthlySummaryStatus.APPROVED) {
      throw new BadRequestException("Approved summaries cannot be re-filed");
    }

    const ownsScope =
      (summary.scopeType === PrismaSummaryScopeType.ZONE &&
        zonalSeatId(user) === summary.scopeId) ||
      (summary.scopeType === PrismaSummaryScopeType.STATE &&
        stateSeatId(user) === summary.scopeId) ||
      (summary.scopeType === PrismaSummaryScopeType.REGION &&
        regionalSeatId(user) === summary.scopeId) ||
      (summary.scopeType === PrismaSummaryScopeType.HQ && isHqPastor(user.role));

    if (!ownsScope) {
      throw new ForbiddenException("Only the scope's pastor files its B4 report");
    }

    return this.prisma.monthlySummary.update({
      where: { id },
      data: {
        newChurches: dto.newChurches ?? summary.newChurches,
        welfareNote: dto.welfareNote?.trim() || null,
        plansNote: dto.plansNote?.trim() || null,
        filedById: user.id,
        filedAt: new Date(),
      },
    });
  }

  async approveMonthlySummary(user: AuthUser, id: string): Promise<MonthlySummary> {
    if (!isHqPastor(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const summary = await this.prisma.monthlySummary.findUnique({ where: { id } });
    if (!summary) {
      throw new NotFoundException("Monthly summary not found");
    }
    if (summary.scopeType !== PrismaSummaryScopeType.HQ) {
      throw new ForbiddenException("Only national summaries require approval");
    }
    if (summary.status === PrismaMonthlySummaryStatus.APPROVED) {
      return summary;
    }

    return this.prisma.monthlySummary.update({
      where: { id },
      data: {
        status: PrismaMonthlySummaryStatus.APPROVED,
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });
  }

  async returnMonthlySummary(
    user: AuthUser,
    id: string,
    note?: string,
  ): Promise<MonthlySummary> {
    if (!isHqPastor(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const summary = await this.prisma.monthlySummary.findUnique({ where: { id } });
    if (!summary) {
      throw new NotFoundException("Monthly summary not found");
    }
    if (summary.scopeType !== PrismaSummaryScopeType.HQ) {
      throw new ForbiddenException("Only national summaries can be returned");
    }
    if (summary.status === PrismaMonthlySummaryStatus.APPROVED) {
      throw new BadRequestException("Approved summaries cannot be returned");
    }
    if (summary.status === PrismaMonthlySummaryStatus.RETURNED) {
      return summary;
    }

    return this.prisma.monthlySummary.update({
      where: { id },
      data: {
        status: PrismaMonthlySummaryStatus.RETURNED,
        returnedById: user.id,
        returnedAt: new Date(),
        returnNote: note?.trim() || null,
      },
    });
  }
}
