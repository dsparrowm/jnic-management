"use client";

import { RollupInfo } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export function RollupStatusBadge({ rollup }: { rollup: RollupInfo }) {
  if (rollup.status === "FORWARDED") {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
        Forwarded{rollup.version > 1 ? ` (v${rollup.version})` : ""}
      </Badge>
    );
  }

  if (rollup.status === "STALE") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
        Needs re-forward
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
      In review
    </Badge>
  );
}
