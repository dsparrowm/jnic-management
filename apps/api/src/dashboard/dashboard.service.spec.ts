import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@repo/types";
import type { AuthUser } from "../common/auth.types";
import type { NotificationsService } from "../notifications/notifications.service";
import type { OrgService } from "../org/org.service";
import type { ReportsService } from "../reports/reports.service";
import type { SummariesService } from "../summaries/summaries.service";
import type { UsersService } from "../users/users.service";
import { DashboardService } from "./dashboard.service";

const user = (
  role: Role,
  overrides: Partial<AuthUser> = {},
): AuthUser => ({
  id: `${role}-id`,
  email: `${role.toLowerCase()}@jnic.org`,
  name: role === Role.ADMIN ? "Platform Admin" : "Lead Pastor",
  role,
  status: "ACTIVE",
  stateId: null,
  zoneId: null,
  branchId: null,
  profilePicUrl: null,
  ...overrides,
});

function createService(options?: {
  missed?: number;
  pendingPastors?: number;
  pendingApprovals?: number;
  branchInsights?: Awaited<
    ReturnType<ReportsService["getBranchPastorInsights"]>
  >;
  monthSnapshot?: {
    month: number;
    year: number;
    label: string;
    weeksReported: number;
    weeksExpected: number;
    totals: {
      adult: number;
      teenage: number;
      children: number;
      tithe: number;
      offering: number;
      other: number;
      currency: string;
    };
  } | null;
}) {
  const reports = {
    getBranchPastorInsights: async () => options?.branchInsights ?? null,
    getZoneSummary: async () => ({
      weekOf: "2026-09-20",
      zone: { id: "zone-1", name: "VI Zone" },
      rollup: null,
      totals: {
        attendance: { adultCount: 0, teenageCount: 0, childrenCount: 0 },
        finance: { tithe: 0, offering: 0, other: 0, currency: "NGN" },
      },
      branches: [],
      summary: { total: 1, submitted: 1, missed: 0, pending: 0 },
    }),
    getZonePastorInsights: async () => ({
      attendanceTrend: [
        {
          weekOf: "2026-09-20",
          weekLabel: "20 Sep",
          adultCount: 100,
          teenageCount: 20,
          childrenCount: 30,
          total: 150,
        },
      ],
    }),
    getStateSummary: async () => ({
      weekOf: "2026-09-20",
      state: { id: "state-1", name: "Lagos State" },
      rollup: null,
      totals: {
        attendance: { adultCount: 0, teenageCount: 0, childrenCount: 0 },
        finance: { tithe: 0, offering: 0, other: 0, currency: "NGN" },
      },
      zones: [],
      summary: { total: 1, submitted: 1, missed: 0, pending: 0 },
    }),
    getNationalSummary: async () => ({
      totals: {
        attendance: { adultCount: 10, teenageCount: 5, childrenCount: 3 },
        finance: { tithe: 100, offering: 50, other: 25, currency: "NGN" },
      },
      summary: {
        total: 4,
        submitted: 3,
        missed: options?.missed ?? 0,
        pending: 1,
      },
    }),
    getNationalAnalytics: async () => ({
      attendanceTrend: [
        {
          weekOf: "2026-09-20",
          weekLabel: "20 Sep",
          byState: [{ total: 18 }, { total: 7 }],
        },
      ],
    }),
  };

  return new DashboardService(
    {
      getTree: async () => [
        {
          zones: [{ branches: [{ id: "branch-1" }, { id: "branch-2" }] }],
        },
      ],
    } as unknown as OrgService,
    {
      listPastors: async () => ({
        summary: {
          active: 5,
          pending: options?.pendingPastors ?? 0,
          deactivated: 1,
        },
      }),
    } as unknown as UsersService,
    reports as unknown as ReportsService,
    {
      listPendingApprovals: async () => ({
        items: Array.from({ length: options?.pendingApprovals ?? 0 }, (_, index) => ({
          id: String(index),
        })),
      }),
      getBranchMonthSnapshot: async () => options?.monthSnapshot ?? null,
      getZoneMonthSnapshot: async () => options?.monthSnapshot ?? null,
    } as unknown as SummariesService,
    {
      listForUser: async () => ({ items: [], unreadCount: 0 }),
    } as unknown as NotificationsService,
  );
}

test("builds the Admin dashboard and Admin tasks", async () => {
  const result = await createService({ pendingPastors: 2, missed: 1 }).getHqDashboard(
    user(Role.ADMIN),
    "2026-09-20",
    6,
  );

  assert.equal(result.org.branches, 2);
  assert.equal(result.pastors?.active, 5);
  assert.equal(result.weeklyReporting.attendance.total, 18);
  assert.equal(result.weeklyReporting.finance.total, 175);
  assert.deepEqual(
    result.tasks.map((task) => task.kind),
    ["PENDING_ONBOARDING", "MISSED_REPORTS"],
  );
});

test("builds the Lead Pastor dashboard without Admin pastor data", async () => {
  const result = await createService({ pendingApprovals: 2 }).getHqDashboard(
    user(Role.LEAD_PASTOR),
    "2026-09-20",
    6,
  );

  assert.equal(result.pastors, undefined);
  assert.equal(result.pendingSummaryApprovals, 2);
  assert.equal(result.attendanceTrend[0]?.total, 25);
  assert.deepEqual(result.tasks.map((task) => task.kind), [
    "PENDING_SUMMARY_APPROVALS",
  ]);
});

test("returns a stable empty attention queue", async () => {
  const result = await createService().getHqDashboard(
    user(Role.ADMIN),
    "2026-09-20",
  );

  assert.deepEqual(result.tasks, []);
});

test("builds the branch pastor dashboard from branch insights", async () => {
  const result = await createService({
    branchInsights: {
      branch: {
        id: "branch-1",
        name: "VI Main Campus",
        zoneName: "Victoria Island",
        stateName: "Lagos State",
      },
      thisWeek: {
        weekOf: "2026-09-20",
        weekLabel: "Sunday, 20 September 2026",
        report: {
          id: "report-1",
          status: "SUBMITTED",
          editable: true,
          attendance: { adultCount: 120, teenageCount: 30, childrenCount: 45 },
          finance: { tithe: 120000, offering: 45000, other: 0, currency: "NGN" },
        },
        submissionState: "SUBMITTED",
      },
      attendanceTrend: [
        {
          weekOf: "2026-09-20",
          weekLabel: "20 Sep",
          adultCount: 120,
          teenageCount: 30,
          childrenCount: 45,
          total: 195,
        },
      ],
    },
    monthSnapshot: {
      month: 9,
      year: 2026,
      label: "September 2026",
      weeksReported: 3,
      weeksExpected: 4,
      totals: {
        adult: 360,
        teenage: 90,
        children: 135,
        tithe: 360000,
        offering: 135000,
        other: 0,
        currency: "NGN",
      },
    },
  }).getPastorDashboard(
    user(Role.BRANCH_PASTOR, { branchId: "branch-1" }),
    "2026-09-20",
    6,
  );

  assert.equal(result.role, Role.BRANCH_PASTOR);
  assert.equal(result.branch?.name, "VI Main Campus");
  assert.equal(result.thisWeek.report?.id, "report-1");
  assert.equal(result.attendanceTrend[0]?.total, 195);
  assert.equal(result.month?.weeksReported, 3);
  assert.equal(result.zone, null);
  assert.equal(result.state, null);
});

test("includes zone summary for zonal pastors", async () => {
  const result = await createService({
    monthSnapshot: {
      month: 9,
      year: 2026,
      label: "September 2026",
      weeksReported: 3,
      weeksExpected: 12,
      totals: {
        adult: 360,
        teenage: 90,
        children: 135,
        tithe: 360000,
        offering: 135000,
        other: 0,
        currency: "NGN",
      },
    },
  }).getPastorDashboard(
    user(Role.ZONAL_PASTOR, { zoneId: "zone-1" }),
    "2026-09-20",
    6,
  );

  assert.equal(result.zone?.zone.name, "VI Zone");
  assert.equal(result.branch, null);
  assert.equal(result.zoneAttendanceTrend[0]?.total, 150);
  assert.equal(result.zoneMonth?.weeksReported, 3);
});
