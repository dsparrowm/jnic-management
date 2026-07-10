# Feature Specs

Per-epic implementation specs for JNLOP MVP. Each spec maps to confirmed user stories
and defines what to build before code is written.

## Workflow

1. Check epic inventory → `00-epic-inventory.md`
2. Read the epic spec for the current phase
3. Implement API module first, then web UI
4. Update `context/progress-tracker.md` when the unit is done
5. Keep `context/project-overview.md` routes table in sync

## Naming Convention

```
NN-short-kebab-name.md
```

Examples:

- `00-epic-inventory.md` — all epics, stories, and build order
- `01-auth-onboarding.md` — Epic 1
- `02-profiles.md` — Epic 2

## Spec Template

Each feature spec should include:

```markdown
# [Epic name]

Read `AGENTS.md` before starting.

## User stories

US-X.X — ...

## Scope

What to build (and what is explicitly out of scope).

## API endpoints

List NestJS routes.

## Web routes

Next.js paths.

## Data model

Prisma entities touched.

## RBAC

Who can access what (API guards).

## Acceptance

- [ ] Criteria from user story AC
- [ ] API guard tested
- [ ] progress-tracker updated
```

## Context Files

| File | Purpose |
| ---- | ------- |
| `project-overview.md` | Product scope, roles, routes |
| `mvp-roadmap.md` | Phased delivery plan |
| `go-live-checklist.md` | Production readiness |
| `architecture.md` | Stack, modules, invariants |
| `ui-context.md` | JNIC design tokens |
| `code-standards.md` | Implementation conventions |
| `progress-tracker.md` | Current phase and status |

## Current Coverage

| Spec | Description | Phase | Status |
| ---- | ----------- | ----- | ------ |
| `00-epic-inventory.md` | Epic → story → phase mapping | — | Done |
| `01-auth-onboarding.md` | Epic 1 — pastor onboarding | 1 | Ready |
| `02-profiles.md` | Epic 2 — profile pictures + directory | 3 | Draft |
| `03-reporting-hierarchy.md` | Epic 3 — hierarchy + feedback + summaries | 4–6 | Draft |
| `04-attendance-finance.md` | Epic 4 — attendance + finance fields | 4 | Draft |

_Add rows as specs are refined during implementation._
