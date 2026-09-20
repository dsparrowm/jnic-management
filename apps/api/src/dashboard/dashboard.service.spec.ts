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

const user = (role: Role): AuthUser => ({
  id: `${role}-id`,
  email: `${role.toLowerCase()}@jnic.org`,
  name: role === Role.ADMIN ? "Platform Admin" : "Lead Pastor",
  role,
  status: "ACTIVE",
  stateId: null,
  zoneId: null,
  branchId: null,
  profilePicUrl: null,
});

function createService(options?: {
  missed?: number;
  pendingPastors?: number;
  pendingApprovals?: number;
}) {
  const reports = {
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
