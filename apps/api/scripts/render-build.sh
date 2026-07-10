#!/usr/bin/env bash
# Deprecated: use repo-root scripts/render-build.sh (Render Root Directory must be ".")
exec bash "$(cd "$(dirname "$0")/../../.." && pwd)/scripts/render-build.sh"
