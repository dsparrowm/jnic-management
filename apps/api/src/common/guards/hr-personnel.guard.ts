import { DirectorateOffice } from "@repo/database";
import { PrismaService } from "../../prisma/prisma.service";

const HR_DIRECTORATE_KEY = "hr-development";
const HR_RECRUITMENT_DESK = "Recruitment and Deployment";
const HR_LEADERSHIP_OFFICES: DirectorateOffice[] = [
  DirectorateOffice.DIRECTOR,
  DirectorateOffice.DEPUTY_DIRECTOR,
  DirectorateOffice.SECRETARY,
];

/** True when the user holds a personnel seat in the HR directorate. */
export async function isHrPersonnel(
  prisma: PrismaService,
  userId: string,
): Promise<boolean> {
  const seat = await prisma.directorateAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      directorate: { key: HR_DIRECTORATE_KEY },
      OR: [
        { office: { in: HR_LEADERSHIP_OFFICES } },
        {
          office: DirectorateOffice.DESK_HEAD,
          desk: { name: HR_RECRUITMENT_DESK },
        },
      ],
    },
    select: { id: true },
  });
  return seat !== null;
}

const HR_WELFARE_DESK = "Pastoral Welfare and Care";
const HR_DISCIPLINE_DESK = "Ethics, Conduct and Discipline";

const CASE_DESK: Record<string, string> = {
  WELFARE: HR_WELFARE_DESK,
  DISCIPLINE: HR_DISCIPLINE_DESK,
};

/** True for HR leadership or a head/deputy of the desk owning this case kind. */
export async function isHrCaseOfficer(
  prisma: PrismaService,
  userId: string,
  kind: string,
): Promise<boolean> {
  if (await isHrPersonnel(prisma, userId)) return true;
  const deskName = CASE_DESK[kind];
  if (!deskName) return false;
  const seat = await prisma.directorateAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      directorate: { key: HR_DIRECTORATE_KEY },
      office: {
        in: [DirectorateOffice.DESK_HEAD, DirectorateOffice.DEPUTY_DESK_HEAD],
      },
      desk: { name: deskName },
    },
    select: { id: true },
  });
  return seat !== null;
}
