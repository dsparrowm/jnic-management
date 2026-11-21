"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ErrorText } from "@/components/auth/auth-card";
import {
  emptyCascadeValues,
  OrgCascadeSelectors,
} from "@/components/org/org-cascade-selectors";
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
import { api, ApiError, OrgTreeResponse } from "@/lib/api";
import { getAccessToken, redirectToLoginIfUnauthorized } from "@/lib/auth";

interface CreateDistrictSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgTree: OrgTreeResponse;
  onSuccess?: (name: string) => void;
}

export function CreateDistrictSheet({
  open,
  onOpenChange,
  orgTree,
  onSuccess,
}: CreateDistrictSheetProps) {
  const router = useRouter();
  const [cascade, setCascade] = useState(emptyCascadeValues);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setCascade(emptyCascadeValues);
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
      await api.createDistrict(token, { name: name.trim(), zoneId: cascade.zoneId });
      onSuccess?.(name.trim());
      onOpenChange(false);
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setError(err instanceof ApiError ? err.message : "Failed to create district");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">New district</p>
          <SheetTitle>Add district</SheetTitle>
          <SheetDescription>
            A district groups branches inside a zone, overseen by a district pastor.
          </SheetDescription>
        </SheetHeader>

        <form id="create-district-form" onSubmit={onSubmit} className="flex-1 space-y-4 p-6">
          <ErrorText message={error} />
          <OrgCascadeSelectors
            orgTree={orgTree}
            values={cascade}
            onChange={setCascade}
            stateRequired
            zoneRequired
            showDistrict={false}
          />
          <div className="space-y-2">
            <Label htmlFor="district-name">District name</Label>
            <Input
              id="district-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ugep District"
            />
          </div>
        </form>

        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-district-form"
            disabled={loading || !cascade.zoneId || name.trim().length < 2}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create district
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
