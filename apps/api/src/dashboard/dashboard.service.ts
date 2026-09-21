import { ForbiddenException, Injectable } from "@nestjs/common";
import {
  NotificationType,
  Role,
  formatWeekEndingLabel,
  getBranchSubmissionState,
  getTodayInLagos,
  type HqDashboardResponse,
  type HqHomeTask,
  type PastorDashboardResponse,
  type PastorHomeWeekSnapshot,
  type StateSummaryResponse,
  type ZoneSummaryResponse,
} from "@repo/types";
import type { AuthUser } from "../common/auth.types";
import { NotificationsService } from "../notifications/notifications.service";
import { OrgService } from "../org/org.service";
import { ReportsService } from "../reports/reports.service";
import { SummariesService } from "../summaries/summaries.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly orgService: OrgService,
    private readonly usersService: UsersService,
    private readonly reportsService: ReportsService,
    private readonly summariesService: SummariesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private assertPastorRole(user: AuthUser) {
    if (
      user.role !== Role.BRANCH_PASTOR &&
      user.role !== Role.ZONAL_PASTOR &&
      user.role !== Role.STATE_PASTOR
    ) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }

  private currentMonthYearInLagos() {
    const [year, month] = getTodayInLagos().split("-").map(Number);
    return { month, year };
  }

  async getPastorDashboard(
    user: AuthUser,
    weekOf: string,
    weeks = 6,
  ): Promise<PastorDashboardResponse> {
    this.assertPastorRole(user);
    const { month, year } = this.currentMonthYearInLagos();

    const [
      branchInsights,
      notifications,
      zone,
      state,
      monthSnapshot,
      zoneInsights,
      zoneMonth,
      stateInsights,
      stateMonth,
    ] = await Promise.all([
        this.reportsService.getBranchPastorInsights(user, weekOf, weeks),
        this.notificationsService.listForUser(user.id, 4),
        user.role === Role.ZONAL_PASTOR
          ? this.reportsService.getZoneSummary(user, weekOf)
          : Promise.resolve(null),
        user.role === Role.STATE_PASTOR
          ? this.reportsService.getStateSummary(user, weekOf)
          : Promise.resolve(null),
        this.summariesService.getBranchMonthSnapshot(user, month, year),
        user.role === Role.ZONAL_PASTOR
          ? this.reportsService.getZonePastorInsights(user, weekOf, weeks)
          : Promise.resolve(null),
        user.role === Role.ZONAL_PASTOR
          ? this.summariesService.getZoneMonthSnapshot(user, month, year)
          : Promise.resolve(null),
        user.role === Role.STATE_PASTOR
          ? this.reportsService.getStatePastorInsights(user, weekOf, weeks)
          : Promise.resolve(null),
        user.role === Role.STATE_PASTOR
          ? this.summariesService.getStateMonthSnapshot(user, month, year)
          : Promise.resolve(null),
      ]);

    const thisWeek: PastorHomeWeekSnapshot =
      (branchInsights?.thisWeek as PastorHomeWeekSnapshot | undefined) ?? {
        weekOf,
        weekLabel: formatWeekEndingLabel(weekOf),
        report: null,
        submissionState: getBranchSubmissionState(weekOf, false),
      };

    return {
      generatedAt: new Date().toISOString(),
      role: user.role as
        | Role.BRANCH_PASTOR
        | Role.ZONAL_PASTOR
        | Role.STATE_PASTOR,
      branch: branchInsights?.branch ?? null,
      thisWeek,
      attendanceTrend: branchInsights?.attendanceTrend ?? [],
      month: monthSnapshot,
      zone: zone as ZoneSummaryResponse | null,
      zoneAttendanceTrend: zoneInsights?.attendanceTrend ?? [],
      zoneMonth,
      state: state as StateSummaryResponse | null,
      stateAttendanceTrend: stateInsights?.attendanceTrend ?? [],
      stateMonth,
      recentActivity: {
        unreadCount: notifications.unreadCount,
        items: notifications.items.map((item) => ({
          ...item,
          type: item.type as NotificationType,
        })),
      },
    };
  }

  async getHqDashboard(
    user: AuthUser,
    weekOf: string,
    weeks = 6,
  ): Promise<HqDashboardResponse> {
    const isAdmin = user.role === Role.ADMIN;
    const isLeadPastor = user.role === Role.LEAD_PASTOR;

    const [tree, national, analytics, notifications, pastors, approvals] =
      await Promise.all([
        this.orgService.getTree(),
        this.reportsService.getNationalSummary(user, weekOf),
        this.reportsService.getNationalAnalytics(user, weekOf, weeks),
        this.notificationsService.listForUser(user.id, 4),
        isAdmin ? this.usersService.listPastors({ perPage: 1 }) : Promise.resolve(null),
        isLeadPastor
          ? this.summariesService.listPendingApprovals(user)
          : Promise.resolve({ items: [] }),
      ]);

    const zones = tree.reduce((count, state) => count + state.zones.length, 0);
    const branches = tree.reduce(
      (count, state) =>
        count +
        state.zones.reduce(
          (zoneCount, zone) => zoneCount + zone.branches.length,
          0,
        ),
      0,
    );

    const attendance = national.totals.attendance;
    const finance = national.totals.finance;
    const pendingSummaryApprovals = approvals.items.length;
    const tasks: HqHomeTask[] = [];

    if (isAdmin && pastors && pastors.summary.pending > 0) {
      tasks.push({
        kind: "PENDING_ONBOARDING",
        title: "Complete pastor onboarding",
        description: "Invited pastors are still waiting to activate their accounts.",
        count: pastors.summary.pending,
        severity: "INFO",
      });
    }

    if (national.summary.missed > 0) {
      tasks.push({
        kind: "MISSED_REPORTS",
        title: "Review missed reports",
        description: "Branches missed the current HQ-visible reporting window.",
        count: national.summary.missed,
        severity: "URGENT",
      });
    }

    if (isLeadPastor && pendingSummaryApprovals > 0) {
      tasks.push({
        kind: "PENDING_SUMMARY_APPROVALS",
        title: "Approve monthly summaries",
        description: "National summaries are ready for your sign-off.",
        count: pendingSummaryApprovals,
        severity: "WARNING",
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      role: user.role as Role.ADMIN | Role.LEAD_PASTOR,
      weekOf,
      weekLabel: formatWeekEndingLabel(weekOf),
      org: {
        states: tree.length,
        zones,
        branches,
      },
      ...(pastors
        ? {
            pastors: {
              active: pastors.summary.active,
              pending: pastors.summary.pending,
              deactivated: pastors.summary.deactivated,
            },
          }
        : {}),
      weeklyReporting: {
        ...national.summary,
        attendance: {
          ...attendance,
          total:
            attendance.adultCount +
            attendance.teenageCount +
            attendance.childrenCount,
        },
        finance: {
          ...finance,
          total: finance.tithe + finance.offering + finance.other,
        },
      },
      pendingSummaryApprovals,
      attendanceTrend: analytics.attendanceTrend.map((point) => ({
        weekOf: point.weekOf,
        weekLabel: point.weekLabel,
        total: point.byState.reduce((sum, state) => sum + state.total, 0),
      })),
      tasks,
      recentActivity: {
        unreadCount: notifications.unreadCount,
        items: notifications.items.map((item) => ({
          ...item,
          type: item.type as NotificationType,
        })),
      },
    };
  }
}
