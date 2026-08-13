#!/usr/bin/env bash
set -euo pipefail

# Render's build environment has a read-only /usr/bin — never run `corepack enable` here.
# packageManager in package.json usually makes `pnpm` available on Render Node images.
if command -v pnpm >/dev/null 2>&1; then
  PNPM=(pnpm)
else
  PNPM=(npx --yes "pnpm@10.33.2")
fi

"${PNPM[@]}" install --frozen-lockfile

echo "Building native dependencies (bcrypt, Prisma)..."
"${PNPM[@]}" rebuild bcrypt @prisma/client

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set to run migrations on deploy."
  exit 1
fi

echo "Baselining Prisma history if this database already has schema objects..."
"${PNPM[@]}" --filter @repo/database exec node scripts/baseline-existing-schema.cjs

echo "Applying database migrations..."
if ! "${PNPM[@]}" --filter @repo/database exec prisma migrate deploy; then
  echo "migrate deploy failed — retrying after another baseline pass..."
  "${PNPM[@]}" --filter @repo/database exec node scripts/baseline-existing-schema.cjs
  "${PNPM[@]}" --filter @repo/database exec prisma migrate deploy
fi

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "Seeding database..."
  "${PNPM[@]}" --filter @repo/database seed
fi

echo "Building API..."
"${PNPM[@]}" turbo build --filter=@repo/api
