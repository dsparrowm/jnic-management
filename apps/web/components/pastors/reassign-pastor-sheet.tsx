"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Role, ONBOARDABLE_ROLES, validateOrgAssignmentStructure } from "@repo/types";
import { ErrorText } from "@/components/auth/auth-card";
import {
  OnboardOrgSelectors,
  adaptOrgFieldsForRole,
} from "@/components/onboarding/onboard-org-selectors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api, ApiError, OrgState, PastorRecord } from "@/lib/api";
import { formatRole } from "@/lib/navigation";
import { getAccessToken } from "@/lib/auth";

interface ReassignPastorSheetProps {
  pastor: PastorRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgTree: OrgState[];
  onSuccess?: () => void;
}

export function ReassignPastorSheet({
  pastor,
  open,
  onOpenChange,
  orgTree,
  onSuccess,
}: ReassignPastorSheetProps) {
  const [role, setRole] = useState<Role>(Role.BRANCH_PASTOR);
  const [stateId, setStateId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !pastor) return;
    setRole(pastor.role as Role);
    setStateId(pastor.state?.id ?? "");
    setZoneId(pastor.zone?.id ?? "");
    setBranchId(pastor.branch?.id ?? "");
    setError(undefined);
    setLoading(false);
  }, [open, pastor]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !pastor) return;

    const structuralError = validateOrgAssignmentStructure(role, {
      stateId: stateId || null,
      zoneId: zoneId || null,
      branchId: branchId || null,
    });
    if (structuralError) {
      setError(structuralError);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      await api.reassignUser(token, pastor.id, {
        role,
        stateId: stateId || null,
        zoneId: zoneId || null,
        branchId: branchId || null,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reassign pastor");
    } finally {
      setLoading(false);
    }
  }

  if (!pastor) return null;

  const orgValues = { role, stateId, zoneId, branchId };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reassign</p>
          <SheetTitle>{pastor.name}</SheetTitle>
          <SheetDescription>
            Update role and organisation assignment. Past weekly reports stay on their original
            branch.
          </SheetDescription>
        </SheetHeader>

        <form id="reassign-pastor-form" onSubmit={onSubmit} className="flex-1 space-y-5 p-6">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium text-foreground">{pastor.email}</p>
            <p className="mt-1 text-muted-foreground">
              Current: {formatRole(pastor.role)}
              {pastor.branch?.name ? ` · ${pastor.branch.name}` : ""}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reassign-role">Role</Label>
            <NativeSelect
              id="reassign-role"
              value={role}
              onChange={(e) => {
                const nextRole = e.target.value as Role;
                const orgFields = adaptOrgFieldsForRole(orgValues, nextRole, orgTree);
                setRole(nextRole);
                setStateId(orgFields.stateId);
                setZoneId(orgFields.zoneId);
                setBranchId(orgFields.branchId);
              }}
            >
              {ONBOARDABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {formatRole(r)}
                </option>
              ))}
            </NativeSelect>
          </div>

          <OnboardOrgSelectors
            orgTree={orgTree}
            values={orgValues}
            onChange={(patch) => {
              if (patch.role !== undefined) setRole(patch.role);
              if (patch.stateId !== undefined) setStateId(patch.stateId);
              if (patch.zoneId !== undefined) setZoneId(patch.zoneId);
              if (patch.branchId !== undefined) setBranchId(patch.branchId);
            }}
          />

          <ErrorText message={error} />
        </form>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="reassign-pastor-form" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save assignment"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
