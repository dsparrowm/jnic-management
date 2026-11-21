import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  NotificationType,
  Prisma,
  Role,
  SummaryScopeType,
} from "@repo/database";
import { PrismaService } from "../prisma/prisma.service";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function mondayOf(date: Date) {
  const d = startOfDay(date);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return d;
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Mon 11:00 — B1 weekly reports are due at noon; nudge unfilled branch pastors. */
  @Cron("0 11 * * 1")
  async remindWeeklyReports() {
    const weekOf = mondayOf(new Date());
    const reported = await this.prisma.weeklyReport.findMany({
      where: { weekOf },
      select: { branchId: true },
    });
    const reportedIds = new Set(reported.map((r) => r.branchId));
    const pastors = await this.prisma.user.findMany({
      where: {
        role: Role.BRANCH_PASTOR,
        status: "ACTIVE",
        branchId: { not: null },
      },
      select: { id: true, branchId: true },
    });
    const due = pastors.filter((p) => p.branchId && !reportedIds.has(p.branchId));
    await this.notify(
      due.map((p) => p.id),
      "Weekly report due at noon",
      "Your branch's weekly report (B1) is due today at 12:00. Submit it from the Weekly tab.",
    );
    this.logger.log(`weekly reminder: ${due.length} branch pastors nudged`);
  }

  /** 3rd of month, 09:00 — monthly directorate reports (D-forms) are due. */
  @Cron("0 9 3 * *")
  async remindDirectorateReports() {
    const seated = await this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { directorateAssignment: { isActive: true } },
          { coordinatedUnits: { some: {} } },
        ],
      },
      select: { id: true },
    });
    await this.notify(
      seated.map((u) => u.id),
      "Monthly directorate reports due",
      "Your monthly directorate reports (D-forms) were due on the 3rd. File yours under Weekly → Directorate duties.",
    );
    this.logger.log(
      `directorate reminder: ${seated.length} seated users nudged`,
    );
  }

  /** 7th of month, 09:00 — B4 territory filings due from zonal/state/regional pastors. */
  @Cron("0 9 7 * *")
  async remindTerritoryFilings() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const scopes: {
      scopeType: SummaryScopeType;
      role: Role;
      scopeId: (u: { zoneId: string | null; stateId: string | null; regionId: string | null }) => string | null;
    }[] = [
      { scopeType: SummaryScopeType.ZONE, role: Role.ZONAL_PASTOR, scopeId: (u) => u.zoneId },
      { scopeType: SummaryScopeType.STATE, role: Role.STATE_PASTOR, scopeId: (u) => u.stateId },
      { scopeType: SummaryScopeType.REGION, role: Role.REGIONAL_PASTOR, scopeId: (u) => u.regionId },
    ];
    const userIds = new Set<string>();
    for (const { scopeType, role, scopeId } of scopes) {
      const filed = await this.prisma.monthlySummary.findMany({
        where: { scopeType, month, year, filedAt: { not: null } },
        select: { scopeId: true },
      });
      const filedIds = new Set(filed.map((f) => f.scopeId));
      const pastors = await this.prisma.user.findMany({
        where: { role, status: "ACTIVE" },
        select: { id: true, zoneId: true, stateId: true, regionId: true },
      });
      for (const p of pastors) {
        const id = scopeId(p);
        if (id && !filedIds.has(id)) userIds.add(p.id);
      }
    }
    await this.notify(
      [...userIds],
      "Territory report (B4) due today",
      "Your consolidated territory report (B4) is due today, the 7th. File it from the Summaries tab.",
    );
    this.logger.log(`territory reminder: ${userIds.size} pastors nudged`);
  }

  private async notify(userIds: string[], title: string, body: string) {
    if (userIds.length === 0) return;
    const today = startOfDay(new Date());
    const already = await this.prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        type: NotificationType.REPORT_MISSED,
        title,
        createdAt: { gte: today },
      },
      select: { userId: true },
    });
    const alreadyIds = new Set(already.map((n) => n.userId));
    const data: Prisma.NotificationCreateManyInput[] = userIds
      .filter((id) => !alreadyIds.has(id))
      .map((userId) => ({
        userId,
        type: NotificationType.REPORT_MISSED,
        title,
        body,
      }));
    if (data.length > 0) {
      await this.prisma.notification.createMany({ data });
    }
  }
}
