# JNLOP — Jubilee Nation Leadership & Operations Platform

MVP for JNIC pastor onboarding, weekly reporting, and org hierarchy management.

## Status

**Phase 0 complete** — monorepo scaffolded. Next: Phase 1 (Auth + Onboarding).

See [`context/progress-tracker.md`](context/progress-tracker.md) for current state.

## For AI agents

Read [`AGENTS.md`](AGENTS.md) first, then `context/` files in the order listed there.

## Quick start

```bash
# 1. Infrastructure (requires Docker)
docker compose up -d

# 2. Environment
cp .env.example .env

# 3. Install & database
pnpm install
pnpm db:migrate    # applies packages/database/prisma/migrations

# 4. Development
pnpm dev           # web :3000, api :4000
```

## Monorepo structure

```
apps/
  web/          Next.js 15 dashboard
  api/          NestJS REST API
packages/
  database/     Prisma schema + client
  types/        Shared enums and API types
  typescript-config/
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start web + API in parallel |
| `pnpm build` | Build all packages |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Run Prisma migrations (dev) |
| `pnpm db:studio` | Open Prisma Studio |

## Endpoints (Phase 0)

| Service | URL |
| ------- | --- |
| Web | http://localhost:3000 |
| API health | http://localhost:4000/health |

## Product docs

| File | Purpose |
| ---- | ------- |
| [`context/project-overview.md`](context/project-overview.md) | Scope, roles, routes |
| [`context/architecture.md`](context/architecture.md) | Stack, modules, data model |
| [`context/mvp-roadmap.md`](context/mvp-roadmap.md) | Phased build plan |
| [`context/feature-specs/`](context/feature-specs/) | Per-epic implementation specs |

## Deploy API to Render

**Do not use `corepack enable`** — Render's build filesystem is read-only under `/usr/bin`.

| Setting | Value |
| ------- | ----- |
| Root Directory | `.` (repo root — leave blank) |
| Build Command | `bash scripts/render-build.sh` |
| Start Command | `node apps/api/dist/main.js` |
| Health Check Path | `/health` |

Or deploy via [`render.yaml`](render.yaml) Blueprint.

## UX reference

`/home/davies/jubilee-nation` — mock demo for layout patterns only (not imported).
