"use client";

import { MoreHorizontal, UserX, Mail } from "lucide-react";
import { PastorRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PastorRowActionsProps {
  pastor: PastorRecord;
  busy: boolean;
  onResend: (id: string) => void;
  onDeactivate: (id: string) => void;
}

export function PastorRowActions({
  pastor,
  busy,
  onResend,
  onDeactivate,
}: PastorRowActionsProps) {
  const canResend = pastor.status === "PENDING";
  const canDeactivate = pastor.status !== "DEACTIVATED";

  if (!canResend && !canDeactivate) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={busy} aria-label="Pastor actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canResend && (
          <DropdownMenuItem onClick={() => onResend(pastor.id)} disabled={busy}>
            <Mail className="h-4 w-4" />
            Resend onboarding
          </DropdownMenuItem>
        )}
        {canDeactivate && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDeactivate(pastor.id)}
            disabled={busy}
          >
            <UserX className="h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
