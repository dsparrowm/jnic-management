import { OrgChangeStatus, OrgChangeType } from "@repo/database";

export type OrgTreeBranch = {
  id: string;
  name: string;
  address: string | null;
  zoneId: string;
};

export type OrgTreeZone = {
  id: string;
  name: string;
  stateId: string;
  branches: OrgTreeBranch[];
};

export type OrgTreeState = {
  id: string;
  name: string;
  zones: OrgTreeZone[];
};

export type OrgChangeRequestView = {
  id: string;
  type: OrgChangeType;
  payload: Record<string, unknown>;
  status: OrgChangeStatus;
  reviewNote: string | null;
  createdAt: Date;
  requestedBy: { id: string; name: string; email: string };
  reviewedBy: { id: string; name: string; email: string } | null;
};

export function toChangeRequestView(request: {
  id: string;
  type: OrgChangeType;
  payload: unknown;
  status: OrgChangeStatus;
  reviewNote: string | null;
  createdAt: Date;
  requestedBy: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string; email: string } | null;
}): OrgChangeRequestView {
  return {
    id: request.id,
    type: request.type,
    payload: request.payload as Record<string, unknown>,
    status: request.status,
    reviewNote: request.reviewNote,
    createdAt: request.createdAt,
    requestedBy: request.requestedBy,
    reviewedBy: request.reviewedBy ?? null,
  };
}
