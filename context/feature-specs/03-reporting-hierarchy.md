# Epic 3 — Reporting Hierarchy

Read `AGENTS.md` before starting.

**Phases:** 4, 5, 6  
**User stories:** US-3.1–US-3.6

## Scope

Weekly reports flow Branch → Zone → State → HQ with drill-down views, non-blocking
feedback, notifications, and monthly aggregation with Lead Pastor national approval.

**Depends on:** Phase 2 (org hierarchy), Phase 4 (weekly report entity), Epic 4 fields.

## User Story Acceptance

### US-3.1 — Branch submit

- [x] Unified form with attendance + finance (see `04-attendance-finance.md`)
- [x] Tied to service date and week
- [x] Status = SUBMITTED (pending zone review) on create
- [x] Editable only before `status >= ZONE_REVIEWED`

### US-3.2 — Zonal review

- [x] View all branch reports in zone with drill-down
- [x] Leave feedback on branch report
- [x] Zone aggregate auto-computed regardless of feedback

### US-3.3 — State view

- [x] All zones in state with drill-down to branch
- [x] State Pastor can leave feedback on zone or branch reports

### US-3.4 — National dashboard

- [x] Totals by state, zone, branch with drill-down
- [x] Lead Pastor and Admin can leave feedback at any level

### US-3.5 — Feedback

- [x] Feedback tied to report; visible as thread
- [x] Notification on new feedback (in-app + email)
- [x] Feedback does not block status progression

### US-3.6 — Monthly summary

- [ ] Auto-aggregate from weekly reports in calendar month
- [ ] Scoped to viewer's level (branch/zone/state/HQ)
- [ ] Totals + weekly breakdown side by side
- [ ] HQ/national summary requires Lead Pastor approval

## Report Status Flow

```
SUBMITTED → ZONE_REVIEWED → HQ_REVIEWED
```

Progression is triggered by **explicit forward actions** at zone and state level — not on passive view.

| Handoff | Action | Branch status after |
| ------- | ------ | ------------------- |
| Branch → Zone | Branch submits | `SUBMITTED` |
| Zone → State | Zonal Pastor forwards zone report | `ZONE_REVIEWED` |
| State → HQ | State Pastor forwards state report | `HQ_REVIEWED` |

## Visibility Gates

| Viewer | Sees branch reports when |
| ------ | ------------------------ |
| Zonal Pastor | Branch submits (always in their zone) |
| State Pastor | Zone has **forwarded** for that week |
| Lead Pastor / Admin | State has **forwarded** for that week |

Missed branches are flagged in bundles. Zone/State can forward anytime after reviewing.
Late branch submissions mark the parent rollup **STALE**; reviewer re-forwards to push updates upward.

## Rollup Entity

`HierarchyWeeklyRollup` — one per zone/state per `weekOf`:

- `IN_REVIEW` — not yet sent upstream
- `FORWARDED` — visible to next level
- `STALE` — child data changed after forward; needs re-forward

## API Endpoints

| Method | Path | Role | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/reports/weekly` | Pastor with `branchId` | Create report |
| PATCH | `/reports/weekly/:id` | Submitter (if unlocked) | Edit report |
| GET | `/reports/weekly` | Scoped by role | List reports |
| GET | `/reports/weekly/:id` | Scoped by role | Report detail |
| GET | `/reports/zone/summary` | Zonal Pastor+ | Zone aggregates |
| **POST** | **`/reports/zone/:weekOf/forward`** | **Zonal Pastor** | **Forward zone bundle to state** |
| GET | `/reports/state/summary` | State Pastor+ | State aggregates (gated by zone forward) |
| **POST** | **`/reports/state/:weekOf/forward`** | **State Pastor** | **Forward state bundle to HQ** |
| GET | `/reports/national/summary` | Lead Pastor, Admin | National aggregates (gated by state forward) |
| POST | `/reports/:id/feedback` | Zonal+, State+, LP, Admin | Add feedback |
| GET | `/reports/:id/feedback` | Scoped | List feedback thread |
| GET | `/summaries/monthly` | Scoped | Monthly summaries |
| POST | `/summaries/monthly/:id/approve` | Lead Pastor | Approve national summary |

## Web Routes

| Route | Audience |
| ----- | -------- |
| `/reports/submit` | Pastor with `branchId` |
| `/reports/zone` | Zonal Pastor |
| `/reports/state` | State Pastor |
| `/reports/national` | Lead Pastor, Admin |
| `/summaries` | All scoped roles |
| `/approvals/summaries` | Lead Pastor |

## Data Model

- `WeeklyReport`, `Attendance`, `Finance`, `Feedback`, `MonthlySummary`, `Notification`

## Background Jobs

- `compute-monthly-summaries` — cron 1st of month
- `flag-missed-submissions` — cron Monday EOD Africa/Lagos
- `send-feedback-notification` — on feedback create

## UI Notes

- Drill-down: breadcrumb State → Zone → Branch
- Missed submission: warning badge on branch row (US-4.3)
- Feedback thread below report detail; no "resolve" or "block" actions

## Acceptance

- [ ] Full hierarchy visibility per role
- [ ] Feedback non-blocking verified
- [ ] Monthly summaries compute correctly
- [ ] Lead Pastor approval required for national summary
- [ ] `progress-tracker.md` updated
