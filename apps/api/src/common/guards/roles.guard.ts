import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@repo/types";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { HR_PERSONNEL_ALLOWED_KEY } from "../decorators/allow-hr-personnel.decorator";
import { AuthUser } from "../auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import { isHrPersonnel } from "./hr-personnel.guard";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();
    if (user && requiredRoles.includes(user.role)) {
      return true;
    }

    const hrAllowed = this.reflector.getAllAndOverride<boolean>(
      HR_PERSONNEL_ALLOWED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (hrAllowed && user && (await isHrPersonnel(this.prisma, user.id))) {
      return true;
    }

    throw new ForbiddenException("Insufficient permissions");
  }
}
