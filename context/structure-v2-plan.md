# JNIC Structure v2 — Replacement Plan

Source: `Jubilee_Nation_Management_System 3.pdf` (organogram, 10 directorate charters, B1–B5 reporting templates, HR policy). Replaces the current structure wholesale.

## 1. The new model

### Territorial line (people & places)

```
Senior Pastor
 └── Resident Pastor (HQ)
      └── Region (Regional Pastor)          ← NEW tier
           └── State (State Pastor)
                └── Zone (Zonal Pastor)
                     └── District (District Pastor)  ← NEW tier
                          └── Branch (Branch Pastor)
```

- Two new tiers: **Region** above State, **District** between Zone and Branch.
- Current hierarchy (State → Zone → Branch) keeps its names and slots in at the same positions — District inserts below Zone, Region above State.
- `LEAD_PASTOR` splits into two seats: **Senior Pastor** (top, chairs Executive Council) and **Resident Pastor** (HQ operations head, receives all directorate + consolidated reports, resolves line conflicts).

### Directorate line (functions) — NEW second axis

- **10 directorates** (final list): Finance & Accounts · Missions · Worship · Media & Communications · HR Development · Administration · Operations · Kingdom Business & Investment · Works & Infrastructure · Family & Ministries.
- Each directorate: **Director** → Deputy Director → Secretary → **Desk Heads** (each directorate charters 4–5 desks; each desk also has a Deputy). Optional Regional Coordinators.
- Each directorate charters **branch service units** — e.g. Administration has Branch Secretary & Records Officer, Branch ICT & Data Officer, Events & Calendar Coordinator. Unit Coordinators report to their Desk Head (copy Branch Pastor). This makes the directorate chain **four reporting tiers**: Unit Coordinator → Desk Head → Director → Resident Pastor (→ Senior Pastor).
- Members are **not pastors only** — rosters include lay workers (e.g. "Bro Godwin Ushingo"). `DirectorateAssignment` must accept non-pastor users.
- Every member holds **one** directorate membership (directorate + desk + office). Conflicts between lines escalate to Resident Pastor.

### Report flows — template engine (D-series per directorate; B-series territorial)

The Administration handbook defines D1–D6, and each directorate has its own variants — so reports must be **template-driven** (report type + field schema + route + due rule), not hardcoded forms:

| Template | From → To | Due |
|---|---|---|
| **D1** Weekly unit report | Unit Coordinator → Desk Head (cc Branch Pastor) | Mon 12:00 |
| **D2** Monthly unit report | Unit Coordinator → Desk Head (cc Branch Pastor) | 3rd |
| **D3** Monthly desk report | Desk Head → Director | 5th |
| **D4** Monthly directorate report | Director → Resident Pastor (cc Senior Pastor) | 7th |
| **D5** Quarterly review | Director → Executive Council | Pre-council |
| **D6** Annual report | Director → Senior Pastor / conference | ≤30d after year end |

Same engine serves the territorial B-series (B1 weekly branch → district; B4 consolidated up the line). One `ReportTemplate` + one `Report` submission table with JSON field payload beats bespoke tables per report.

### Report flows (B1–B5)

| Template | From → To | Due | Replaces |
|---|---|---|---|
| **B1** Weekly branch report | Branch Pastor → District Pastor (copy platform) | Mon 12:00 | Current weekly report |
| **B3** Monthly task report | Pastor → Desk Head → Director | 3rd | — (new) |
| **B2** Directorate report | Director → Resident Pastor (cc Senior Pastor) | 5th | — (new) |
| **B4** Consolidated territory report | Zonal/State/Regional Pastor → next level | 7th | Monthly summary rollup |
| **B5** Quarterly council review | Senior Pastor + Council | Quarterly | — (new; assembled view) |

## 2. Data-model changes (Prisma)

**New tables:** `Region`, `District`, `Directorate`, `Desk`, `DirectorateAssignment` (userId, directorateId, deskId, office, term, agreedHours), `TaskReport` (B3), `DirectorateReport` (B2), `TerritoryReport` (B4 payload), `ServiceUnit`/attendance fields.

**Changed tables:**
- `User` — role enum extends to `SENIOR_PASTOR`, `RESIDENT_PASTOR`, `REGIONAL_PASTOR`, `STATE_PASTOR`, `ZONAL_PASTOR`, `DISTRICT_PASTOR`, `BRANCH_PASTOR`, `ADMIN` (+ directorate offices resolved via assignment, not role). Adds `districtId`, `regionId` FKs.
- `WeeklyReport` (→ B1) — attendance re-split **men / women / youth / children** (replaces adult/teenage/children); adds midweek attendance, first-time visitors, new converts, follow-up visits, units active, outreach held, pastoral issues, prayer requests, next-week plans.
- `MonthlySummary` → generalized to `TerritoryReport` (B4) with scope REGION/STATE/ZONE and B4 fields (reporting rate, converts, new churches, welfare, plans); HQ approval flow moves to Resident Pastor.
- `ReportStatus` → `SUBMITTED → DISTRICT_REVIEWED → ZONE_REVIEWED → STATE_REVIEWED → REGIONAL_REVIEWED → HQ_REVIEWED` (flag: 6-step review may be too heavy — proposal: keep non-blocking review, only status per level as today).
- `Conversation`/`Notification` types extended per level + directorate channels.

**Migration:** existing Zones stay; each gets one default District holding its branches (admin splits later). LEAD_PASTOR users → SENIOR_PASTOR or RESIDENT_PASTOR (question below). Regions seeded per geography decision (question below). Old attendance columns kept for history; new fields additive where possible.

## 3. Surface changes

**Mobile (primary client):**
- Tabs re-scope per dual line: every pastor sees *territorial* duties + *directorate* duties.
- Reports screen splits: "My branch report" (B1, Branch Pastor), "Territory reports" (District→Region review queues), "My directorate" (B3 submit / desk inbox / B2 compose for Directors).
- Org tree → 5 levels + a parallel **Directorates** directory (directorate → desks → members).
- Pastors directory gains directorate/desk facet + dual-line badge on profiles.
- Approvals expands: B2 queue (Resident Pastor), B4 summaries, org changes.
- Notifications add deadline reminders (Mon 12:00 / 3rd / 5th / 7th).

**Web admin:** same hierarchy CRUD + two new levels, directorate & desk CRUD, assignment management (letter of assignment fields), council dashboard (B5 assembly), submission-rate KPIs.

**UX direction (impeccable):** Operate mode, committed Midnight Executive world stays. New surfaces designed to the same brief rules: role-scoped hero + one gold CTA, decision queues for reviewers, stacked single forms with live serif totals, receipt states, bottom-sheet confirms. B1's longer field set → grouped sections (Service / People & Growth / Money / Notes & Plans) with progressive disclosure, not a wall of inputs.

## 4. Proposed slices

| Slice | Contents | Why first/later |
|---|---|---|
| **A. Org & people model** | Region+District tiers, directorates/desks, dual assignment, role enum, admin CRUD, org tree, directory, seed | Everything hangs off this |
| **B. B1 weekly report v2** | New B1 fields, Branch→District routing, Mon-12:00 deadline, review chain down territorial line | Core weekly loop |
| **C. Directorate reporting** | B3 task reports (pastor→desk→director), B2 directorate reports (director→resident), desk surfaces | Needs A |
| **D. Consolidation & council** | B4 territory reports, Resident-Pastor approvals, B5 quarterly council view, KPI/calendar engine | Needs A+B(+C) |
| **E. HR layer** | Assignment letters, appraisals, leave, discipline/grievance | Large; likely separate planning |

Recommendation: **Slice A first** — it's pure foundation with no behavioral change for pastors yet, and it makes B–D straightforward.

## 5. Open decisions for Davies

1. **LEAD_PASTOR mapping** — do you hold both Senior + Resident seats for now (assert: yes, one account flagged SENIOR_PASTOR sees everything; Resident Pastor seat can stay unassigned), or two real people?
2. **Regions** — seed real regions now (which?), or one placeholder "National Region" until structure is announced? (assert: placeholder)
3. **Staff categories beyond pastors** (admin/media/school/works staff, volunteers) — in scope for this rebuild or deferred? (assert: deferred; model leaves room)
4. **Review chain depth** — PDF wants each level reviewing below; 6 status steps is heavy. Assert: keep non-blocking review per level (as today), status shows "seen by" per level rather than gating.
5. **Historical data** — old weekly reports keep old attendance fields as archive (assert), or migrate adult→men+women estimates (not recommended)?
