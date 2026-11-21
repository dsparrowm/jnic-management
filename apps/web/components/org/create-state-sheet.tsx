"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NIGERIAN_STATES } from "@repo/types";
import { Loader2 } from "lucide-react";
import { ErrorText } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { allOrgStates, api, ApiError, OrgTreeResponse } from "@/lib/api";
import { getAccessToken, redirectToLoginIfUnauthorized } from "@/lib/auth";

const NO_REGION = "__none__";

interface CreateStateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgTree: OrgTreeResponse;
  onSuccess?: (name: string) => void;
}

export function CreateStateSheet({
  open,
  onOpenChange,
  orgTree,
  onSuccess,
}: CreateStateSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const existingNames = useMemo(
    () => new Set(allOrgStates(orgTree).map((state) => state.name)),
    [orgTree],
  );

  const availableStates = useMemo(
    () => NIGERIAN_STATES.filter((state) => !existingNames.has(state)),
    [existingNames],
  );

  useEffect(() => {
    if (!open) {
      setName("");
      setRegionId("");
      setError(undefined);
      setLoading(false);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !name) return;

    setLoading(true);
    setError(undefined);
    try {
      await api.createState(token, {
        name,
        regionId: regionId && regionId !== NO_REGION ? regionId : undefined,
      });
      onSuccess?.(name);
      onOpenChange(false);
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setError(err instanceof ApiError ? err.message : "Failed to create state");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">New state</p>
          <SheetTitle>Add state</SheetTitle>
          <SheetDescription>
            Select a Nigerian state to add to the organisation hierarchy. Zones, districts and
            branches can be added underneath it.
          </SheetDescription>
        </SheetHeader>

        <form id="create-state-form" onSubmit={onSubmit} className="flex-1 space-y-4 p-6">
          <ErrorText message={error} />
          <div className="space-y-2">
            <Label>State</Label>
            {availableStates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All Nigerian states have already been added to the organisation.
              </p>
            ) : (
              <Select value={name || undefined} onValueChange={setName} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72 w-[var(--radix-select-trigger-width)]">
                  {availableStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Region (optional)</Label>
            <Select value={regionId || NO_REGION} onValueChange={setRegionId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No region" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value={NO_REGION}>No region</SelectItem>
                {orgTree.regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-state-form"
            disabled={loading || !name || availableStates.length === 0}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create state
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
