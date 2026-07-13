import { HierarchyWeeklyRollup } from "@repo/database";
import { RollupStatus } from "@repo/types";

export function toRollupView(rollup: HierarchyWeeklyRollup | null) {
  if (!rollup) {
    return {
      status: RollupStatus.IN_REVIEW as const,
      version: 0,
      forwardedAt: null as string | null,
    };
  }

  return {
    status: rollup.status as RollupStatus,
    version: rollup.version,
    forwardedAt: rollup.forwardedAt?.toISOString() ?? null,
  };
}

export function isRollupVisibleToUpstream(rollup: HierarchyWeeklyRollup | null): boolean {
  return rollup?.status === "FORWARDED";
}
