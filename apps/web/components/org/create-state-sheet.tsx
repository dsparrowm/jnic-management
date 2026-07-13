"use client";

import { useEffect, useState } from "react";
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
import { getAccessToken } from "@/lib/auth";

interface CreateStateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (name: string) => void;
}

export function CreateStateSheet({ open, onOpenChange, onSuccess }: CreateStateSheetProps) {
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
      await api.createState(token, { name: name.trim() });
      onSuccess?.(name.trim());
      onOpenChange(false);
    } catch (err) {
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
            Create a new state in the organisation hierarchy. Zones and branches can be added
            underneath it.
          </SheetDescription>
        </SheetHeader>

        <form id="create-state-form" onSubmit={onSubmit} className="flex-1 space-y-4 p-6">
          <ErrorText message={error} />
          <div className="space-y-2">
            <Label htmlFor="state-name">State name</Label>
            <Input
              id="state-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lagos State"
            />
          </div>
        </form>

        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-state-form" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create state
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
