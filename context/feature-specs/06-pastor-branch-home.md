# Pastor branch home (overview dashboard)

Read `AGENTS.md` before starting.

**Track:** post-MVP mobile UX refinement  
**Depends on:** Epic 3/4 weekly reports, monthly summaries, notifications (all shipped)  
**Supersedes (partially):** pastor Home section in `05-mobile-reporting.md`

## Problem

Branch pastors currently see the **weekly report card** as the hero on Home and again on
Reports. Home feels like a duplicate entry point to submit, not a branch overview.

**Goal:** Home answers “How is my branch doing?” Reports answers “What do I need to do
this week?”

## Scope

**In scope**

- `GET /dashboard/pastor` — composed branch/zonal/state pastor home payload
- Mobile `PastorHome` redesign for overview-first layout
- Demote weekly submit CTA from Home hero to a compact status banner
- Reuse HQ `AttendanceTrend` visual pattern for branch-scoped sparkline
- Zonal/state dual-scope pastors: keep zone/state oversight cards; demote personal
  branch report banner when `branchId` is set

**Out of scope**

- New reporting rules or status values
- Web `/dashboard` redesign (can follow later)
- Library catalog
- National analytics on pastor home

## Information architecture

| Surface | Branch pastor | Zonal / state pastor |
| ------- | ------------- | -------------------- |
| **Home** | Branch KPIs, trends, month snapshot, report nudge, activity | Zone/state oversight + optional branch nudge |
| **Reports** | Week picker, submit/edit, status, detail, feedback | Review lists, forward, drill-down |

## Mobile layout — branch pastor

```
┌─────────────────────────────────────┐
│ [Avatar]  Good afternoon, Davies    │
│           VI Main Campus            │
│           Victoria Island · Lagos   │
├─────────────────────────────────────┤
│ ┌─ Report nudge (compact) ────────┐ │
│ │ ● Sent · Week ending 27 Sep     │ │  ← tap → Reports tab (this week)
│ │   View in Reports            ›  │ │
│ └─────────────────────────────────┘ │
│   (or amber “Due · Submit report”)  │
├─────────────────────────────────────┤
│ THIS WEEK                           │
│ ┌──────────┬──────────┬──────────┐ │
│ │ Adults   │ Teens    │ Children │ │
│ │   120    │    30    │    45    │ │  ← from current-week report; “—” if none
│ └──────────┴──────────┴──────────┘ │
│ ┌──────────┬──────────┬──────────┐ │
│ │ Tithe    │ Offering │  Total   │ │
│ │ ₦120k    │  ₦45k    │  ₦165k   │ │
│ └──────────┴──────────┴──────────┘ │
├─────────────────────────────────────┤
│ ATTENDANCE TREND                    │
│ Last 6 weeks · VI Main Campus       │
│ [▁▃▅▆█▇ bar sparkline]      +8%   │  ← reuse `AttendanceTrend` component
├─────────────────────────────────────┤
│ SEPTEMBER SNAPSHOT                  │
│ 4 of 4 Sundays reported             │
│ Tithe ₦480k · Offering ₦180k        │  ← from `GET /summaries/monthly`
├─────────────────────────────────────┤
│ RECENT ACTIVITY                     │
│ [feedback / forwarding items…]        │
│ empty state if none                   │
└─────────────────────────────────────┘
│ Home · Reports · Library · Profile  │
```

### Report nudge states

| State | Banner copy | Tap action |
| ----- | ----------- | ---------- |
| No report, current week | “Due · Submit this week’s report” | `/weekly/submit?weekOf=` |
| Submitted, editable | “Sent · Week ending …” | `/weekly` (this week selected) |
| Submitted, locked | “With zonal pastor · Week ending …” | `/weekly/[id]` |
| Missed prior week | “Late · Last week not submitted” | `/weekly` (prior week) |

Do **not** show the large gold “Submit report” / “Open report” primary button on Home.

### Zonal pastor Home

Home answers **“How is my zone doing?”** Reports tab remains the action surface (review,
feedback, forward).

```
┌─────────────────────────────────────┐
│ [Avatar]  Good evening, Joyce       │
│           Victoria Island           │
│           Lagos State               │
├─────────────────────────────────────┤
│ Zone action nudge (rollup / misses) │  → Reports tab
├─────────────────────────────────────┤
│ THIS WEEK · VICTORIA ISLAND         │
│ attendance + finance KPI grid       │  ← zone.totals
├─────────────────────────────────────┤
│ NEEDS ATTENTION (if exceptions)     │  ← outstanding branches, max implicit via card
├─────────────────────────────────────┤
│ ATTENDANCE TREND (6 weeks, zone)    │
├─────────────────────────────────────┤
│ MONTH SNAPSHOT (branches reporting) │
├─────────────────────────────────────┤
│ RECENT ACTIVITY                     │
└─────────────────────────────────────┘
```

Dual-scope zonal pastors (`branchId` set): zone blocks **above** personal branch nudge +
branch KPIs / trend / month snapshot.

### State pastor (dual-scope)

Keep state summary card above branch blocks when `stateId` is set. Full state overview
parity (like zonal) is a follow-up.

## API

### `GET /dashboard/pastor`

**Auth:** `BRANCH_PASTOR`, `ZONAL_PASTOR`, `STATE_PASTOR` (active, scoped)

**Query**

| Param | Default | Notes |
| ----- | ------- | ----- |
| `weekOf` | current Lagos week | Anchor for “this week” |
| `weeks` | `6` | Trend window (2–12) |

**Response:** `PastorDashboardResponse` (see `packages/types`)

**Composition (server-side, single round-trip)**

1. Resolve user scope (`branchId`, optional `zoneId` / `stateId`)
2. Current-week branch report (if `branchId`)
3. Last N weekly reports for branch → `attendanceTrend`, `financeTrend` (optional v1)
4. Current calendar month branch summary via existing summaries logic
5. Zone summary + zone attendance trend + zone month snapshot (zonal pastor)
6. State summary for current week (state pastor)
7. Notifications (last 4, same as HQ home)

**RBAC**

- Branch data limited to `user.branchId`
- Zone summary only for `ZONAL_PASTOR` + matching `zoneId`
- State summary only for `STATE_PASTOR` + matching `stateId`
- No HQ national totals

### Types (`packages/types/src/mobile-home.ts`)

```ts
export type PastorHomeAttendancePoint = {
  weekOf: string;
  weekLabel: string;
  total: number;
  adultCount: number;
  teenageCount: number;
  childrenCount: number;
};

export type PastorHomeWeekSnapshot = {
  weekOf: string;
  weekLabel: string;
  report: {
    id: string;
    status: ReportStatus;
    editable: boolean;
    attendance: WeeklyReportAttendance | null;
    finance: WeeklyReportFinance | null;
  } | null;
  submissionState: BranchSubmissionState; // DUE | SUBMITTED | MISSED | ...
};

export type PastorHomeMonthSnapshot = {
  month: number;
  year: number;
  label: string; // "September 2026"
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
};

export type PastorDashboardResponse = {
  generatedAt: string;
  role: Role.BRANCH_PASTOR | Role.ZONAL_PASTOR | Role.STATE_PASTOR;
  branch: {
    id: string;
    name: string;
    zoneName: string | null;
    stateName: string | null;
  } | null;
  thisWeek: PastorHomeWeekSnapshot;
  attendanceTrend: PastorHomeAttendancePoint[];
  month: PastorHomeMonthSnapshot | null;
  zone: ZoneSummaryResponse | null;
  zoneAttendanceTrend: PastorHomeAttendancePoint[];
  zoneMonth: PastorHomeMonthSnapshot | null;
  state: StateSummaryResponse | null;
  recentActivity: {
    unreadCount: number;
    items: HqHomeNotification[];
  };
};
```

### NestJS module changes

| File | Change |
| ---- | ------ |
| `dashboard.controller.ts` | Add `@Get("pastor")` with pastor roles |
| `dashboard.service.ts` | Add `getPastorDashboard(user, weekOf, weeks)` |
| `dto/pastor-dashboard-query.dto.ts` | Mirror `HqDashboardQueryDto` |
| `packages/types` | Export `PastorDashboardResponse` |

Reuse `ReportsService` list/scoped queries and `SummariesService` month aggregation —
do not duplicate Prisma aggregation logic.

## Mobile changes

| File | Change |
| ---- | ------ |
| `use-pastor-home.ts` | Call `api.getPastorDashboard()` instead of 3–4 parallel calls |
| `pastor-home.tsx` | Overview layout; remove week-strip + featured report card |
| `branch-home-metrics.tsx` | New — this-week stat grid |
| `report-nudge-banner.tsx` | New — compact status strip |
| `api.ts` | `getPastorDashboard(weekOf?, weeks?)` |

Reports tab (`weekly/index.tsx`) **unchanged** as the canonical submit/review surface.

## Acceptance

- [x] Branch pastor Home shows branch name, this-week KPIs, 6-week attendance trend, and
      month snapshot without a primary submit button
- [x] Compact report nudge links to Reports (or submit when due)
- [x] Reports tab still supports submit, edit, week navigation, and detail
- [x] Zonal pastors see zone overview (nudge, KPIs, exceptions, trend, month snapshot)
- [x] Dual-scope zonal pastors see zone blocks above personal branch blocks
- [x] State pastors still see state summary card on Home (full state overview follow-up)
- [x] `GET /dashboard/pastor` enforces branch/zone/state scope in NestJS guards
- [x] `progress-tracker.md` updated

## Rollout

1. **API + types** — endpoint + unit tests on `DashboardService`
2. **Mobile consume** — swap hook, ship new layout behind same tab
3. **Spec sync** — update `05-mobile-reporting.md` Home row to “branch overview dashboard”
