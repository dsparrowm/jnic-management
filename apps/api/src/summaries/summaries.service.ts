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
  formatWeekChartLabel,
  formatReportDate,
} from "@repo/types";
import { AuthUser } from "../common/auth.types";
import { PrismaService } from "../prisma/prisma.service";

export const HQ_SCOPE_ID = "hq";

type ReportWithRelations = {
  weekOf: Date;
  branchId: string;
  branch: {
    id: string;
    name: string;
    zoneId: string;
    zone: {
      id: string;
      name: string;
      stateId: string;
      state: { id: string; name: string };
    };
  };
  attendance: {
    adultCount: number;
    teenageCount: number;
    childrenCount: number;
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
      const zoneId = report.branch.zone.id;
      const stateId = report.branch.zone.state.id;

      branchNames.set(branchId, report.branch.name);
      zoneNames.set(zoneId, report.branch.zone.name);
      stateNames.set(stateId, report.branch.zone.state.name);

      for (const [map, id] of [
        [branchTotals, branchId],
        [zoneTotals, zoneId],
        [stateTotals, stateId],
      ] as const) {
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

      const status =
        existing?.status === PrismaMonthlySummaryStatus.APPROVED
          ? PrismaMonthlySummaryStatus.APPROVED
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
    switch (user.role) {
      case Role.BRANCH_PASTOR:
        if (!user.branchId) return [];
        return [{ scopeType: SummaryScopeType.BRANCH, scopeId: user.branchId, scopeName: "My branch" }];
      case Role.ZONAL_PASTOR:
        if (!user.zoneId) return [];
        return [{ scopeType: SummaryScopeType.ZONE, scopeId: user.zoneId, scopeName: "My zone" }];
      case Role.STATE_PASTOR:
        if (!user.stateId) return [];
        return [{ scopeType: SummaryScopeType.STATE, scopeId: user.stateId, scopeName: "My state" }];
      case Role.ADMIN:
      case Role.LEAD_PASTOR:
        return [{ scopeType: SummaryScopeType.HQ, scopeId: HQ_SCOPE_ID, scopeName: "National" }];
      default:
        return [];
    }
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
    const state = await this.prisma.state.findUnique({ where: { id: scopeId } });
    return state?.name ?? scopeId;
  }

  private summaryMatchesReport(
    scopeType: SummaryScopeType,
    scopeId: string,
    report: ReportWithRelations,
  ): boolean {
    if (scopeType === SummaryScopeType.BRANCH) return report.branch.id === scopeId;
    if (scopeType === SummaryScopeType.ZONE) return report.branch.zone.id === scopeId;
    if (scopeType === SummaryScopeType.STATE) return report.branch.zone.state.id === scopeId;
    return true;
  }

  private mapSummaryTotals(record: {
    totalAdult: number;
    totalTeenage: number;
    totalChildren: number;
    totalTithe: unknown;
    totalOffering: unknown;
    totalOther: unknown;
    currency: string;
  }) {
    return {
      adult: record.totalAdult,
      teenage: record.totalTeenage,
      children: record.totalChildren,
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
      const stateId = report.branch.zone.state.id;
      weeklyReportsByState.set(stateId, (weeklyReportsByState.get(stateId) ?? 0) + 1);
      const branchIds = branchesByState.get(stateId) ?? new Set<string>();
      branchIds.add(report.branch.id);
      branchesByState.set(stateId, branchIds);
    }

    const branchCounts = await this.prisma.branch.groupBy({
      by: ["zoneId"],
      _count: { id: true },
      where: {
        zone: {
          stateId: { in: stateSummaries.map((summary) => summary.scopeId) },
        },
      },
    });
    const zones = await this.prisma.zone.findMany({
      where: { id: { in: branchCounts.map((row) => row.zoneId) } },
      select: { id: true, stateId: true },
    });
    const stateIdByZoneId = new Map(zones.map((zone) => [zone.id, zone.stateId]));
    const branchesTotalByState = new Map<string, number>();
    for (const row of branchCounts) {
      const stateId = stateIdByZoneId.get(row.zoneId);
      if (!stateId) continue;
      branchesTotalByState.set(
        stateId,
        (branchesTotalByState.get(stateId) ?? 0) + row._count.id,
      );
    }

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
    if (user.role !== Role.ADMIN && user.role !== Role.LEAD_PASTOR) {
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

    if (user.role !== Role.ADMIN && user.role !== Role.LEAD_PASTOR) {
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
    } else if (scopeType === SummaryScopeType.BRANCH) {
      branchesTotal = 1;
    }

    return {
      branchesReporting: branchIds.size,
      branchesTotal,
      weeklyReports: scopedReports.length,
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
    const isNationalViewer = user.role === Role.ADMIN || user.role === Role.LEAD_PASTOR;

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
          totals: this.mapSummaryTotals(record),
          weeks,
          coverage,
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
    if (user.role !== Role.LEAD_PASTOR) {
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

  async approveMonthlySummary(user: AuthUser, id: string): Promise<MonthlySummary> {
    if (user.role !== Role.LEAD_PASTOR) {
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
}
