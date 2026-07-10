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
"${PNPM[@]}" turbo build --filter=@repo/api
