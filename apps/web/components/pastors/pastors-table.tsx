"use client";

import { PastorRecord } from "@/lib/api";
import { formatRole, getUserInitials } from "@/lib/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PastorStatusBadge } from "@/components/pastors/pastor-status-badge";
import { PastorRowActions } from "@/components/pastors/pastor-row-actions";

interface PastorsTableProps {
  pastors: PastorRecord[];
  actionId: string | null;
  onResend: (id: string) => void;
  onDeactivate: (id: string) => void;
}

function LocationBadges({ pastor }: { pastor: PastorRecord }) {
  const items = [pastor.state, pastor.zone, pastor.branch].filter(Boolean);
  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge key={item!.id} variant="outline" className="font-normal">
          {item!.name}
        </Badge>
      ))}
    </div>
  );
}

function PastorAvatar({ pastor }: { pastor: PastorRecord }) {
  return (
    <Avatar className="h-9 w-9">
      {pastor.profilePicUrl ? (
        <AvatarImage src={pastor.profilePicUrl} alt={pastor.name} />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {getUserInitials(pastor.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function PastorsTable({
  pastors,
  actionId,
  onResend,
  onDeactivate,
}: PastorsTableProps) {
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
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Pastor</span>
        <span>Role</span>
        <span>Status</span>
        <span>Location</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y divide-border">
        {pastors.map((pastor) => (
          <div
            key={pastor.id}
            className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] md:items-center md:gap-4"
          >
            <div className="flex items-center gap-3">
              <PastorAvatar pastor={pastor} />
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{pastor.name}</p>
                <p className="truncate text-sm text-muted-foreground">{pastor.email}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground md:hidden">Role</p>
              <Badge variant="secondary">{formatRole(pastor.role)}</Badge>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground md:hidden">Status</p>
              <PastorStatusBadge status={pastor.status} />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground md:hidden">Location</p>
              <LocationBadges pastor={pastor} />
            </div>
            <div className="flex justify-end">
              <PastorRowActions
                pastor={pastor}
                busy={actionId === pastor.id}
                onResend={onResend}
                onDeactivate={onDeactivate}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
