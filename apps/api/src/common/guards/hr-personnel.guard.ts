import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@repo/types";
import { DirectorateOffice } from "@repo/database";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthUser } from "../auth.types";
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

/**
 * Allows a request when the user's role matches @Roles metadata OR the user
 * holds personnel authority in the HR directorate: director / deputy director /
 * secretary, or the desk head of Recruitment and Deployment (which owns
 * recruitment, deployment, assignments and transfers per the governing docs).
 */
@Injectable()
export class RolesOrHrPersonnelGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();
    if (!user) {
      throw new ForbiddenException("Insufficient permissions");
    }

    if (requiredRoles?.length && requiredRoles.includes(user.role)) {
      return true;
    }

    if (!(await isHrPersonnel(this.prisma, user.id))) {
      throw new ForbiddenException("Insufficient permissions");
    }
    return true;
  }
}
