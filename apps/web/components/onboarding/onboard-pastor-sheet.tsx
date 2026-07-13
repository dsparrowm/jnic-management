"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Role,
  ONBOARDABLE_ROLES,
  allowsOptionalBranch,
  allowsOptionalZone,
  requiresBranchId,
  requiresStateId,
  requiresZoneId,
  validateOrgAssignmentStructure,
} from "@repo/types";
import { ErrorText } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { api, ApiError, OrgState } from "@/lib/api";
import { formatRole } from "@/lib/navigation";
import { getAccessToken } from "@/lib/auth";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  role: Role.BRANCH_PASTOR,
  stateId: "",
  zoneId: "",
  branchId: "",
};

interface OnboardPastorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgTree: OrgState[];
  onSuccess?: () => void;
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function findBranchInTree(orgTree: OrgState[], branchId: string) {
  for (const state of orgTree) {
    for (const zone of state.zones) {
      const branch = zone.branches.find((b) => b.id === branchId);
      if (branch) {
        return { stateId: state.id, zoneId: zone.id, branchId: branch.id };
      }
    }
  }
  return null;
}

export function OnboardPastorSheet({
  open,
  onOpenChange,
  orgTree,
  onSuccess,
}: OnboardPastorSheetProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
      setError(undefined);
      setSuccessEmail(null);
      setLoading(false);
    }
  }, [open]);

  const showState = requiresStateId(form.role);
  const showZone = requiresZoneId(form.role) || allowsOptionalZone(form.role);
  const zoneRequired = requiresZoneId(form.role);
  const showBranchRequired = requiresBranchId(form.role);
  const showBranchOptional = allowsOptionalBranch(form.role);

  const zonesForState = orgTree.find((s) => s.id === form.stateId)?.zones ?? [];
  const branchesForZone = zonesForState.find((z) => z.id === form.zoneId)?.branches ?? [];
  const branchesForState = zonesForState.flatMap((z) => z.branches);
  const branchOptions =
    form.role === Role.STATE_PASTOR && !form.zoneId ? branchesForState : branchesForZone;

  function handleBranchChange(branchId: string) {
    if (!branchId) {
      setForm((f) => ({ ...f, branchId: "" }));
      return;
    }
    const resolved = findBranchInTree(orgTree, branchId);
    if (resolved) {
      setForm((f) => ({
        ...f,
        branchId: resolved.branchId,
        zoneId: resolved.zoneId,
        stateId: resolved.stateId,
      }));
    } else {
      setForm((f) => ({ ...f, branchId }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    const structuralError = validateOrgAssignmentStructure(form.role, {
      stateId: form.stateId || null,
      zoneId: form.zoneId || null,
      branchId: form.branchId || null,
    });
    if (structuralError) {
      setError(structuralError);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const created = await api.createOnboardingUser(token, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        stateId: form.stateId || undefined,
        zoneId: form.zoneId || undefined,
        branchId: form.branchId || undefined,
      });
      setSuccessEmail(created.email);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to onboard pastor");
    } finally {
      setLoading(false);
    }
  }

  function handleOnboardAnother() {
    setForm(INITIAL_FORM);
    setSuccessEmail(null);
    setError(undefined);
  }

  function handleDone() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">New pastor</p>
          <SheetTitle>Onboard pastor</SheetTitle>
          <SheetDescription>
            Creates a pending account and emails a secure onboarding link. The link expires after 48
            hours.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-6">
          {successEmail ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900">Invitation sent</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      An onboarding link was sent to <strong>{successEmail}</strong>. They will appear
                      as Pending in the pastors directory until they complete setup.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={handleOnboardAnother}>
                  Onboard another
                </Button>
                <Button type="button" onClick={handleDone}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form id="onboard-pastor-form" onSubmit={onSubmit} className="space-y-5">
              <FormSection title="Personal details">
                <div className="space-y-2">
                  <Label htmlFor="onboard-name">Full name</Label>
                  <Input
                    id="onboard-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Pastor full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboard-email">Email</Label>
                  <Input
                    id="onboard-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="pastor@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboard-phone">Phone (optional)</Label>
                  <Input
                    id="onboard-phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+234..."
                  />
                </div>
              </FormSection>

              <FormSection title="Role and assignment">
                <div className="space-y-2">
                  <Label htmlFor="onboard-role">Role</Label>
                  <NativeSelect
                    id="onboard-role"
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value as Role,
                        stateId: "",
                        zoneId: "",
                        branchId: "",
                      }))
                    }
                  >
                    {ONBOARDABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {formatRole(role)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                {showState && (
                  <div className="space-y-2">
                    <Label htmlFor="onboard-state">State</Label>
                    <NativeSelect
                      id="onboard-state"
                      required
                      value={form.stateId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          stateId: e.target.value,
                          zoneId: "",
                          branchId: "",
                        }))
                      }
                    >
                      <option value="">Select state</option>
                      {orgTree.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                )}

                {showZone && (
                  <div className="space-y-2">
                    <Label htmlFor="onboard-zone">
                      Zone{zoneRequired ? "" : " (optional)"}
                    </Label>
                    <NativeSelect
                      id="onboard-zone"
                      required={zoneRequired}
                      value={form.zoneId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, zoneId: e.target.value, branchId: "" }))
                      }
                      disabled={!form.stateId}
                    >
                      <option value="">{zoneRequired ? "Select zone" : "No zone"}</option>
                      {zonesForState.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                )}

                {showBranchRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="onboard-branch">Branch</Label>
                    <NativeSelect
                      id="onboard-branch"
                      required
                      value={form.branchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      disabled={!form.zoneId}
                    >
                      <option value="">Select branch</option>
                      {branchesForZone.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                )}

                {showBranchOptional && (
                  <div className="space-y-2">
                    <Label htmlFor="onboard-branch-optional">Home branch (optional)</Label>
                    <NativeSelect
                      id="onboard-branch-optional"
                      value={form.branchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      disabled={!form.stateId}
                    >
                      <option value="">No home branch</option>
                      {branchOptions.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <p className="text-xs text-muted-foreground">
                      Optional home branch — enables weekly report submission.
                    </p>
                  </div>
                )}
              </FormSection>

              <ErrorText message={error} />
            </form>
          )}
        </div>

        {!successEmail && (
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="onboard-pastor-form" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send onboarding link"
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
