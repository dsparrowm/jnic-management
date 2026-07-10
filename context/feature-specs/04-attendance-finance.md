# Epic 4 — Attendance & Finance

Read `AGENTS.md` before starting.

**Phases:** 4, 5  
**User stories:** US-4.1, US-4.2, US-4.3

## Scope

Attendance and finance fields within the unified weekly report. Aggregate views and
missed submission indicators for Zonal and State pastors.

Implemented as part of the weekly report entity — not separate standalone forms.

## User Story Acceptance

### US-4.1 — Attendance

- [ ] Numeric fields: `adultCount`, `teenageCount`, `childrenCount`
- [ ] Tied to service date and branch via parent `WeeklyReport`

### US-4.2 — Finance

- [ ] Fields: `tithe`, `offering`, `other`
- [ ] `currency` defaults to `NGN`; stored on record for future configurability
- [ ] Submitted together with attendance in one weekly report

### US-4.3 — Aggregates + missed flags

- [ ] Summary totals for branches under Zonal/State pastor
- [ ] Detail drill-down to individual branch submissions
- [ ] Visual flag if branch has not submitted for the period

## Data Model

```prisma
model Attendance {
  reportId       String @unique
  adultCount     Int
  teenageCount   Int
  childrenCount  Int
}

model Finance {
  reportId   String @unique
  tithe      Decimal
  offering   Decimal
  other      Decimal
  currency   String @default("NGN")
}
```

Both 1:1 with `WeeklyReport`. Created in same transaction as report.

## Validation

- All counts >= 0
- Finance amounts >= 0
- Currency ISO 4217 string (default NGN)
- One report per branch per `weekOf` (unique constraint)

## Aggregate Queries

Roll up attendance and finance sums when building zone/state/national summary views:

- `SUM(adultCount)`, `SUM(teenageCount)`, `SUM(childrenCount)`
- `SUM(tithe)`, `SUM(offering)`, `SUM(other)` per currency

## Missed Submission Logic

- Service week ends Sunday
- If no `WeeklyReport` for `branchId + weekOf` by Monday 23:59 Africa/Lagos → flag
- BullMQ cron job sets `missedSubmission` flag or computes at query time

## UI Notes

- Single form with two sections: Attendance | Finance
- Borrow field layout from `jubilee-nation` weekly submit page
- Aggregate tables show totals row + per-branch rows with status badges

## Acceptance

- [ ] Submit creates report + attendance + finance atomically
- [ ] Aggregates match sum of branch submissions
- [ ] Missed branches flagged in zone/state views
- [ ] `progress-tracker.md` updated
