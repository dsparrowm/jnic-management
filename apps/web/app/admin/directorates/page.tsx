"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Network, Plus, Trash2, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorText } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  api,
  ApiError,
  DirectorateDetail,
  DirectorateRecord,
  PastorRecord,
} from "@/lib/api";
import {
  getAccessToken,
  getStoredUser,
  isAdmin,
  isHqViewer,
  redirectToLoginIfUnauthorized,
} from "@/lib/auth";
import { formatRole } from "@/lib/navigation";

const OFFICES = [
  "DIRECTOR",
  "DEPUTY_DIRECTOR",
  "SECRETARY",
  "DESK_HEAD",
  "DEPUTY_DESK_HEAD",
  "REGIONAL_COORDINATOR",
  "BRANCH_COORDINATOR",
  "MEMBER",
] as const;

function officeLabel(office: string) {
  return office
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export default function AdminDirectoratesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [list, setList] = useState<DirectorateRecord[]>([]);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<DirectorateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [pastors, setPastors] = useState<PastorRecord[]>([]);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignOffice, setAssignOffice] = useState<string>("MEMBER");
  const [assignDeskId, setAssignDeskId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState<string>();

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setList(await api.listDirectorates(token));
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!getAccessToken() || !(isAdmin(user) || isHqViewer(user))) {
      router.replace("/dashboard");
      return;
    }
    setCanEdit(isAdmin(user));
    setReady(true);
    load().catch((err) => {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setError(err instanceof ApiError ? err.message : "Failed to load directorates");
    });
    const token = getAccessToken();
    if (token && isAdmin(user)) {
      api
        .listPastors(token, { perPage: 200 })
        .then((res) => setPastors(res.items))
        .catch(() => undefined);
    }
  }, [router, load]);

  async function openDetail(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setDetailLoading(true);
    setAssignError(undefined);
    setAssignUserId("");
    setAssignOffice("MEMBER");
    setAssignDeskId("");
    try {
      setSelected(await api.getDirectorate(token, id));
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setError(err instanceof ApiError ? err.message : "Failed to load directorate");
    } finally {
      setDetailLoading(false);
    }
  }

  async function submitAssignment(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !selected || !assignUserId) return;
    setAssignBusy(true);
    setAssignError(undefined);
    try {
      await api.createDirectorateAssignment(token, selected.id, {
        userId: assignUserId,
        office: assignOffice,
        deskId: assignDeskId || undefined,
      });
      setAssignUserId("");
      setAssignOffice("MEMBER");
      setAssignDeskId("");
      setSelected(await api.getDirectorate(token, selected.id));
      await load();
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setAssignError(err instanceof ApiError ? err.message : "Failed to assign member");
    } finally {
      setAssignBusy(false);
    }
  }

  async function removeMember(assignmentId: string) {
    const token = getAccessToken();
    if (!token || !selected) return;
    try {
      await api.removeDirectorateAssignment(token, assignmentId);
      setSelected(await api.getDirectorate(token, selected.id));
      await load();
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, router)) return;
      setAssignError(err instanceof ApiError ? err.message : "Failed to remove member");
    }
  }

  const deskNameById = useMemo(
    () => new Map((selected?.desks ?? []).map((d) => [d.id, d.name])),
    [selected],
  );

  if (!ready) return null;
  const user = getStoredUser();
  if (!user) return null;

  return (
    <DashboardShell user={user}>
      <div className="border-b border-border px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Administration
        </p>
        <h2 className="text-2xl font-semibold text-foreground">Directorates</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The ten directorates and their desks, branch unit types and assigned members.
          {canEdit ? " Assignments are managed from each directorate." : ""}
        </p>
      </div>

      <div className="space-y-4 p-6">
        <ErrorText message={error} />
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No directorates found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => openDetail(d.id)}
                className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{d.name}</h3>
                  <Network className="h-4 w-4 shrink-0 text-primary" />
                </div>
                {d.mandate && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.mandate}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{d.deskCount} desks</span>
                  <span>{d.unitTypeCount} unit types</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {d.memberCount} members
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Director: {d.leadership.director?.name ?? "—"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!selected || detailLoading} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {detailLoading || !selected ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <SheetHeader>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Directorate
                </p>
                <SheetTitle>{selected.name}</SheetTitle>
                {selected.mandate && <SheetDescription>{selected.mandate}</SheetDescription>}
              </SheetHeader>

              <div className="space-y-6 p-6">
                <section>
                  <h4 className="text-sm font-semibold text-foreground">Desks</h4>
                  <ul className="mt-2 space-y-3">
                    {selected.desks.map((desk) => (
                      <li key={desk.id} className="rounded-md border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{desk.name}</p>
                        {desk.duties.length > 0 && (
                          <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                            {desk.duties.slice(0, 4).map((duty) => (
                              <li key={duty}>{duty}</li>
                            ))}
                            {desk.duties.length > 4 && <li>…</li>}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-foreground">Branch unit types</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.branchUnits.map((u) => (
                      <span
                        key={u.id}
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        {u.name}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-foreground">
                    Members ({selected.members.length})
                  </h4>
                  <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                    {selected.members.length === 0 && (
                      <li className="px-3 py-4 text-sm text-muted-foreground">
                        No members assigned yet.
                      </li>
                    )}
                    {selected.members.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {m.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {officeLabel(m.office)}
                            {m.deskId ? ` · ${deskNameById.get(m.deskId) ?? "Desk"}` : ""}
                            {" · "}
                            {formatRole(m.user.role)}
                          </p>
                        </div>
                        {canEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(m.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                {canEdit && (
                  <section>
                    <h4 className="text-sm font-semibold text-foreground">Assign member</h4>
                    <form onSubmit={submitAssignment} className="mt-3 space-y-3">
                      <ErrorText message={assignError} />
                      <div className="space-y-1.5">
                        <Label>Person</Label>
                        <Select value={assignUserId || undefined} onValueChange={setAssignUserId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a person" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-64 w-[var(--radix-select-trigger-width)]">
                            {pastors.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — {formatRole(p.role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Office</Label>
                          <Select value={assignOffice} onValueChange={setAssignOffice}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              {OFFICES.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {officeLabel(o)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Desk (optional)</Label>
                          <Select
                            value={assignDeskId || "__none__"}
                            onValueChange={(v) => setAssignDeskId(v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="No desk" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="__none__">No desk</SelectItem>
                              {selected.desks.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="submit" disabled={assignBusy || !assignUserId}>
                        {assignBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Assign
                      </Button>
                    </form>
                  </section>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}
