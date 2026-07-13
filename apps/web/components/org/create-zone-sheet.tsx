"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ErrorText } from "@/components/auth/auth-card";
import { OrgCascadeSelectors } from "@/components/org/org-cascade-selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api, ApiError, OrgState } from "@/lib/api";
import { getAccessToken, redirectToLoginIfUnauthorized } from "@/lib/auth";

interface CreateZoneSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgTree: OrgState[];
  onSuccess?: (name: string) => void;
}

export function CreateZoneSheet({
  open,
  onOpenChange,
  orgTree,
  onSuccess,
}: CreateZoneSheetProps) {
  const router = useRouter();
  const [stateId, setStateId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setStateId("");
      setName("");
      setError(undefined);
      setLoading(false);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(undefined);
    try {
      await api.createZone(token, { name: name.trim(), stateId });
      onSuccess?.(name.trim());
      onOpenChange(false);
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setError(err instanceof ApiError ? err.message : "Failed to create zone");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">New zone</p>
          <SheetTitle>Add zone</SheetTitle>
          <SheetDescription>
            Create a new zone and assign it to an existing state. Branches can be added under the
            zone afterwards.
          </SheetDescription>
        </SheetHeader>

        <form id="create-zone-form" onSubmit={onSubmit} className="flex-1 space-y-4 p-6">
          <ErrorText message={error} />
          <OrgCascadeSelectors
            orgTree={orgTree}
            values={{ stateId, zoneId: "" }}
            onChange={(v) => setStateId(v.stateId)}
            stateRequired
            showZone={false}
            stateLabel="Assign to state"
          />
          <div className="space-y-2">
            <Label htmlFor="zone-name">Zone name</Label>
            <Input
              id="zone-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Victoria Island"
            />
          </div>
        </form>

        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-zone-form" disabled={loading || !stateId}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create zone
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
