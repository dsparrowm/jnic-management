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

interface CreateBranchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgTree: OrgState[];
  onSuccess?: (name: string) => void;
}

export function CreateBranchSheet({
  open,
  onOpenChange,
  orgTree,
  onSuccess,
}: CreateBranchSheetProps) {
  const router = useRouter();
  const [stateId, setStateId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setStateId("");
      setZoneId("");
      setName("");
      setAddress("");
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
      await api.createBranch(token, {
        name: name.trim(),
        zoneId,
        address: address.trim() || undefined,
      });
      onSuccess?.(name.trim());
      onOpenChange(false);
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setError(err instanceof ApiError ? err.message : "Failed to create branch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">New branch</p>
          <SheetTitle>Add branch</SheetTitle>
          <SheetDescription>
            Create a new branch under an existing zone. Optionally filter zones by state to narrow
            the list.
          </SheetDescription>
        </SheetHeader>

        <form id="create-branch-form" onSubmit={onSubmit} className="flex-1 space-y-4 p-6">
          <ErrorText message={error} />
          <OrgCascadeSelectors
            orgTree={orgTree}
            values={{ stateId, zoneId }}
            onChange={(v) => {
              setStateId(v.stateId);
              setZoneId(v.zoneId);
            }}
            stateOptional
            zoneRequired
          />
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch name</Label>
            <Input
              id="branch-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VI Main Campus"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-address">Address (optional)</Label>
            <Input
              id="branch-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address or landmark"
            />
          </div>
        </form>

        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-branch-form" disabled={loading || !zoneId}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create branch
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
