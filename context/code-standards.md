# Code Standards

## General

- Keep components and modules small and single-purpose
- Fix root causes; do not layer conditional hacks
- Separate data access from presentation on the web; separate controllers from services on the API
- Prefer explicit over implicit naming
- Delete dead code rather than commenting it out
- Minimize scope — only change what the current feature unit requires

## TypeScript

- Strict mode in all packages (`"strict": true`)
- Avoid `any` — use explicit types, discriminated unions, or `unknown` with narrowing
- Shared enums and DTOs live in `packages/types` — never duplicate across apps
- Prefer `type` over `interface` unless declaration merging is needed
- Export Prisma types via `packages/database` client; do not re-export raw generated files in web

## Monorepo

- Package manager: **pnpm** with workspaces
- Run tasks via **Turborepo** (`pnpm dev`, `pnpm build`, `pnpm lint`)
- Internal packages referenced as `@repo/database`, `@repo/types`, etc.
- Cross-package imports use workspace protocol in `package.json`

## Next.js (`apps/web`)

- App Router only — routes under `apps/web/app/`
- Default to Server Components; add `"use client"` only for interactivity, hooks, or browser APIs
- Use `next/image` for images, `next/link` for internal navigation
- API calls go through `lib/api/*` wrappers — no raw `fetch` in presentational components
- TanStack Query hooks in `lib/hooks/` for server state
- Zod schemas colocated with forms; validate on submit with inline field errors

## NestJS (`apps/api`)

- One module per domain (`auth`, `users`, `reports`, etc.)
- Controllers handle HTTP; services own business logic; guards own RBAC
- Use `class-validator` + `class-transformer` on DTOs
- Never expose `passwordHash` or `onboardingToken` in API responses
- Throw appropriate HTTP exceptions (`ForbiddenException`, `NotFoundException`, etc.)
- All RBAC checks in guards or service layer — not in controllers as inline if-chains

## Prisma (`packages/database`)

- Schema is source of truth for data model
- Migrations via `prisma migrate dev` — never hand-edit applied migrations
- Seed script for dev data (`prisma/seed.ts`)
- Use transactions for multi-entity writes (e.g. report + attendance + finance)

## Styling

- CSS custom property tokens from `context/ui-context.md` — no hardcoded hex in components
- Tailwind utility classes; no inline `style={{}}` except dynamic values from data
- No global overrides to shadcn/ui — customise via `className` and CSS variables
- Responsive: mobile-first (`sm`, `md`, `lg`, `xl`)

## File Organisation

```
apps/web/
  app/                    # Routes (App Router)
  components/
    ui/                   # shadcn primitives — do not modify
    layout/               # Shell, sidebar, header
    [feature]/            # reports/, admin/, profile/, etc.
  lib/
    api/                  # REST client wrappers
    hooks/                # TanStack Query hooks
    auth/                 # Token storage, session helpers

apps/api/
  src/
    [module]/
      [module].module.ts
      [module].controller.ts
      [module].service.ts
      dto/
      guards/

packages/
  database/prisma/schema.prisma
  types/src/index.ts
```

## Naming Conventions

| Kind | Convention | Example |
| ---- | ---------- | ------- |
| React components | PascalCase | `WeeklyReportForm` |
| Hooks | camelCase + `use` | `useWeeklyReports` |
| API services | PascalCase + `Service` | `ReportsService` |
| DTOs | PascalCase + `Dto` | `CreateReportDto` |
| Files (components) | PascalCase | `ReportTable.tsx` |
| Files (utilities) | kebab-case | `format-currency.ts` |
| Prisma models | PascalCase singular | `WeeklyReport` |
| DB columns | camelCase in Prisma | `branchId` |
| CSS tokens | kebab-case | `--accent-primary` |
| API routes | kebab-case plural | `/weekly-reports` |

## Forms

- Web: React Hook Form + Zod
- API: class-validator DTOs
- Currency amounts stored as integers (kobo) or Decimal — pick one in Phase 0 and document here

## Testing

- API: unit tests for services and guards; e2e for critical flows (onboarding, report submit)
- Web: component tests for complex forms; smoke e2e for auth + submit flow
- Add tests when implementing Phase 7; do not block Phases 1–6 on full coverage

## Git

- One feature unit per commit when possible
- Do not commit `.env`, secrets, or `node_modules`
- Update `context/progress-tracker.md` in the same session as meaningful feature work

## Figma / Design

No Figma file for MVP. UX reference is `jubilee-nation` mock + `context/ui-context.md`.
When layout is ambiguous, note it in `progress-tracker.md` before implementing.
