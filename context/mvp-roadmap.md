# JNLOP MVP Roadmap

Phased delivery plan for the JNLOP MVP. Derived from confirmed user stories (Epics 1–4)
and architecture design.

**Active phase: Phase 0.** Do not start later phases until the current phase completion
criteria are met and `context/progress-tracker.md` is updated.

## Development Methodology

Each phase follows:

```
Requirements (user stories + feature spec)
    ↓
API design (NestJS module + Prisma)
    ↓
Backend implementation + guards
    ↓
Web UI (Next.js pages + forms)
    ↓
Integration test (end-to-end)
    ↓
Update progress-tracker.md
```

## Dependency Map

```
Phase 0 — Context & Scaffold
├── Context files (AGENTS.md, context/*)
├── Turborepo monorepo
├── Docker (Postgres + Redis)
└── Prisma base schema
        ↓
Phase 1 — Auth + Onboarding (Epic 1)
├── JWT auth
├── Admin onboarding + email
└── Password setup via token
        ↓
Phase 2 — Org + Lead Pastor Approvals
├── State / Zone / Branch CRUD
└── OrgChangeRequest workflow
        ↓
Phase 3 — Profiles (Epic 2)
├── R2 profile pictures
└── Pastor directory
        ↓
Phase 4 — Weekly Reports (Epics 3.1, 4)
├── Attendance + finance submission
├── Edit lock after zone review
└── Missed submission flags
        ↓
Phase 5 — Hierarchy + Feedback (Epics 3.2–3.5)
├── Zone / State / National views
├── Feedback threads
└── Notifications
        ↓
Phase 6 — Monthly Aggregation (Epic 3.6)
├── BullMQ aggregation job
└── Lead Pastor national summary approval
        ↓
Phase 7 — Hardening & Deploy
├── Validation, rate limiting
├── Smoke / e2e tests
└── Vercel + Railway/Render deploy
```

---

## Phase 0 — Context & Scaffold

**Goal:** Monorepo foundation and agent context.

| Item | Scope |
| ---- | ----- |
| Context files | `AGENTS.md`, `context/*`, `.cursor/rules/` |
| Monorepo | Turborepo, pnpm workspaces, `apps/web`, `apps/api`, packages |
| Infrastructure | `docker-compose.yml` — Postgres 16, Redis 7 |
| Database | Prisma init, User/State/Zone/Branch enums, first migration |
| Tooling | ESLint, TypeScript configs, `.env.example` |

### Completion Criteria

- [x] Context files complete
- [x] `pnpm dev` starts web + API
- [x] Prisma schema + initial migration committed
- [x] `progress-tracker.md` updated
- [ ] `pnpm db:migrate` applied against running Postgres (requires Docker)

---

## Phase 1 — Auth + Onboarding (Epic 1)

**Goal:** Admin can onboard pastors; pastors set password and reach dashboard.

| Item | User story |
| ---- | ---------- |
| JWT login + refresh | — |
| Admin creates pending user + onboarding email | US-1.1 |
| Token password setup + auto-login | US-1.1 |
| Admin-only guards (API + UI) | US-1.2 |
| Deactivate / reassign users | US-1.3 |
| Resend expired onboarding link | US-1.1 |

### Completion Criteria

- Admin onboards pastor end-to-end with real email (or dev mail catcher)
- Non-Admin roles receive 403 on onboarding endpoints
- Deactivated user cannot log in; history preserved

---

## Phase 2 — Org + Lead Pastor Approvals

**Goal:** Org hierarchy manageable; major changes need Lead Pastor sign-off.

| Item | Scope |
| ---- | ----- |
| State / Zone / Branch CRUD | Admin |
| OrgChangeRequest for new State/Zone | Admin proposes → LP approves |
| Seed data | Sample hierarchy for dev |
| Org assignment on user onboard | Tie pastors to org nodes |

### Completion Criteria

- Admin proposes new zone; Lead Pastor approves; zone appears in hierarchy
- Rejected requests do not create entities

---

## Phase 3 — Profiles (Epic 2)

**Goal:** Pastors have profile photos; Admin has searchable directory.

| Item | User story |
| ---- | ---------- |
| R2 presigned upload (JPG/PNG, size limit) | US-2.1 |
| Default avatar | US-2.1 |
| Pastor directory with filters | US-2.2 |

### Completion Criteria

- Pastor uploads photo; visible on profile and directory
- Admin filters directory by state/zone/branch/role

---

## Phase 4 — Weekly Reports (Epics 3.1, 4)

**Goal:** Branch-level data entry with attendance and finance.

| Item | User story |
| ---- | ---------- |
| Unified weekly report form | US-3.1, US-4.1, US-4.2 |
| Service date + week binding | US-3.1 |
| Edit lock after zone review | US-3.1 |
| Branch Pastor + Admin Staff guards | US-4.1, US-4.2 |
| Missed submission flag | US-4.3 |

### Completion Criteria

- Branch submits report; data persists with attendance + finance
- Report locked after zonal visibility begins
- Overdue branches flagged on dashboards

---

## Phase 5 — Hierarchy + Feedback (Epics 3.2–3.5)

**Goal:** Reports flow up the hierarchy with optional feedback.

| Item | User story |
| ---- | ---------- |
| Zone report queue + drill-down | US-3.2 |
| State aggregated view | US-3.3 |
| National dashboard | US-3.4 |
| Feedback threads (non-blocking) | US-3.5 |
| In-app + email notifications | US-3.5 |
| Auto status progression | US-3.2–3.4 |

### Completion Criteria

- Full Branch → Zone → State → HQ visibility with drill-down
- Feedback visible on report; submitter notified
- Feedback does not block status progression

---

## Phase 6 — Monthly Aggregation (Epic 3.6)

**Goal:** Auto-computed monthly totals with Lead Pastor national approval.

| Item | User story |
| ---- | ---------- |
| BullMQ monthly aggregation job | US-3.6 |
| Scoped summaries (branch/zone/state/HQ) | US-3.6 |
| Weekly breakdown alongside totals | US-3.6 |
| Lead Pastor national summary approval | Confirmed scope |

### Completion Criteria

- Summaries auto-generate from weekly reports
- Each role sees appropriately scoped summary
- Lead Pastor approves national summary before final

---

## Phase 7 — Hardening & Deploy

**Goal:** Production-ready MVP.

| Item | Scope |
| ---- | ----- |
| Rate limiting on auth | Security |
| Input validation audit | API + web |
| Smoke / e2e tests | Onboarding, report submit, hierarchy read |
| Deploy | Vercel (web), Railway/Render (API + DB + Redis) |
| `.env.example` + deploy docs | README |

### Completion Criteria

- All success criteria in `project-overview.md` met
- `go-live-checklist.md` Phase 7 items checked
- Staging environment accessible

---

## Implementation Order (current)

### Phase 0 (active)

1. ~~Context files~~
2. ~~Turborepo scaffold~~
3. ~~Docker Compose~~
4. ~~Prisma base schema + migration~~
5. ~~Stub health endpoints~~

### Phase 1 (next)

## User Story Traceability

| Epic | Stories | Phase |
| ---- | ------- | ----- |
| 1 — Onboarding | US-1.1, US-1.2, US-1.3 | 1 |
| 2 — Profile | US-2.1, US-2.2 | 3 |
| 3 — Reporting hierarchy | US-3.1–US-3.6 | 4, 5, 6 |
| 4 — Attendance & finance | US-4.1–US-4.3 | 4, 5 |
