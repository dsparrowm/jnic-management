"use client";

import { PastorRecord } from "@/lib/api";
import { formatRole, getUserInitials } from "@/lib/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PastorStatusBadge } from "@/components/pastors/pastor-status-badge";
import { PastorRowActions } from "@/components/pastors/pastor-row-actions";

interface PastorsCardGridProps {
  pastors: PastorRecord[];
  actionId: string | null;
  onResend: (id: string) => void;
  onDeactivate: (id: string) => void;
}

export function PastorsCardGrid({
  pastors,
  actionId,
  onResend,
  onDeactivate,
}: PastorsCardGridProps) {
  if (pastors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-foreground">No pastors match your filters</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {pastors.map((pastor) => {
        const location = [pastor.branch?.name, pastor.zone?.name, pastor.state?.name]
          .filter(Boolean)
          .join(" · ");

        return (
          <article
            key={pastor.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {pastor.profilePicUrl ? (
                    <AvatarImage src={pastor.profilePicUrl} alt={pastor.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {getUserInitials(pastor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{pastor.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{pastor.email}</p>
                </div>
              </div>
              <PastorRowActions
                pastor={pastor}
                busy={actionId === pastor.id}
                onResend={onResend}
                onDeactivate={onDeactivate}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{formatRole(pastor.role)}</Badge>
              <PastorStatusBadge status={pastor.status} />
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {location || "No org assignment"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
