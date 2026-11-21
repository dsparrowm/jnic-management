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
