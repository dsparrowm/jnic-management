"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GitBranch, MapPin, Plus } from "lucide-react";
import { OrgState } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrgHierarchyPanelProps {
  orgTree: OrgState[];
  onAddState: () => void;
}

export function OrgHierarchyPanel({ orgTree, onAddState }: OrgHierarchyPanelProps) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  function toggleState(id: string) {
    setExpandedStates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleZone(id: string) {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (orgTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">No organisation yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Start by adding a state, then create zones and branches beneath it.
        </p>
        <Button type="button" className="mt-6" onClick={onAddState}>
          <Plus className="h-4 w-4" />
          Add state
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Hierarchy</h3>
        <p className="text-xs text-muted-foreground">
          States, zones, and branches across JNIC
        </p>
      </div>
      <div className="divide-y divide-border">
        {orgTree.map((state) => {
          const stateOpen = expandedStates.has(state.id);
          return (
            <div key={state.id}>
              <button
                type="button"
                onClick={() => toggleState(state.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                {stateOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground">{state.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {state.zones.length} zone{state.zones.length === 1 ? "" : "s"}
                </span>
              </button>

              {stateOpen && (
                <div className="border-t border-border bg-muted/20">
                  {state.zones.length === 0 ? (
                    <p className="px-12 py-4 text-sm text-muted-foreground">No zones in this state</p>
                  ) : (
                    state.zones.map((zone) => {
                      const zoneOpen = expandedZones.has(zone.id);
                      return (
                        <div key={zone.id} className="border-b border-border last:border-b-0">
                          <button
                            type="button"
                            onClick={() => toggleZone(zone.id)}
                            className="flex w-full items-center gap-3 py-2.5 pl-10 pr-4 text-left transition-colors hover:bg-muted/50"
                          >
                            {zoneOpen ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium text-foreground">{zone.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {zone.branches.length} branch
                              {zone.branches.length === 1 ? "" : "es"}
                            </span>
                          </button>

                          {zoneOpen && (
                            <ul className="pb-2 pl-16 pr-4">
                              {zone.branches.length === 0 ? (
                                <li className="py-2 text-sm text-muted-foreground">
                                  No branches in this zone
                                </li>
                              ) : (
                                zone.branches.map((branch) => (
                                  <li
                                    key={branch.id}
                                    className={cn(
                                      "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
                                      "text-muted-foreground hover:bg-muted/50",
                                    )}
                                  >
                                    <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <div>
                                      <span className="font-medium text-foreground">
                                        {branch.name}
                                      </span>
                                      {branch.address && (
                                        <p className="text-xs text-muted-foreground">
                                          {branch.address}
                                        </p>
                                      )}
                                    </div>
                                  </li>
                                ))
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
