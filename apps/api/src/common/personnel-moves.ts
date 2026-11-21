import { Prisma } from "@repo/database";
import { PersonnelMoveKind } from "@repo/types";
import { PrismaService } from "../prisma/prisma.service";

type MoveClient = PrismaService | Prisma.TransactionClient;

/** Writes one audit entry for a personnel change. */
export function recordMove(
  prisma: MoveClient,
  args: {
    kind: PersonnelMoveKind;
    userId: string;
    actorId: string;
    summary: string;
    detail?: Prisma.InputJsonValue;
    note?: string | null;
  },
): Promise<Prisma.PersonnelMoveGetPayload<Record<string, never>>> {
  return prisma.personnelMove.create({
    data: {
      kind: args.kind,
      userId: args.userId,
      actorId: args.actorId,
      summary: args.summary,
      detail: args.detail,
      note: args.note ?? null,
    },
  });
}

/** "Branch Pastor — VI Main Campus" / "Zonal Pastor — Lagos Zone" */
export function territoryLabel(user: {
  role: string;
  branchName?: string | null;
  districtName?: string | null;
  zoneName?: string | null;
  stateName?: string | null;
  regionName?: string | null;
}): string {
  const role = user.role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const scope =
    user.branchName ??
    user.districtName ??
    user.zoneName ??
    user.stateName ??
    user.regionName;
  return scope ? `${role} — ${scope}` : role;
}

/** "Director — Human Resource Directorate" / "Desk Head — Records and Appraisal" */
export function seatFacetLabel(seat: {
  office: string;
  directorateName?: string | null;
  deskName?: string | null;
}): string {
  const office = seat.office
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const place = seat.deskName ?? seat.directorateName ?? null;
  return place ? `${office} — ${place}` : office;
}

/** "Choir — VI Main Campus" */
export function unitFacetLabel(unit: {
  unitTypeName: string;
  branchName: string;
}): string {
  return `${unit.unitTypeName} — ${unit.branchName}`;
}
