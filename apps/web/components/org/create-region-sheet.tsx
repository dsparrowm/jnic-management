"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ErrorText } from "@/components/auth/auth-card";
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
import { api, ApiError } from "@/lib/api";
import { getAccessToken, redirectToLoginIfUnauthorized } from "@/lib/auth";

interface CreateRegionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (name: string) => void;
}

export function CreateRegionSheet({ open, onOpenChange, onSuccess }: CreateRegionSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
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
      await api.createRegion(token, { name: name.trim() });
      onSuccess?.(name.trim());
      onOpenChange(false);
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setError(err instanceof ApiError ? err.message : "Failed to create region");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">New region</p>
          <SheetTitle>Add region</SheetTitle>
          <SheetDescription>
            A region groups several states under a regional pastor. States can be assigned to it
            afterwards.
          </SheetDescription>
        </SheetHeader>

        <form id="create-region-form" onSubmit={onSubmit} className="flex-1 space-y-4 p-6">
          <ErrorText message={error} />
          <div className="space-y-2">
            <Label htmlFor="region-name">Region name</Label>
            <Input
              id="region-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South-South Region"
            />
          </div>
        </form>

        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-region-form"
            disabled={loading || name.trim().length < 2}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create region
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
