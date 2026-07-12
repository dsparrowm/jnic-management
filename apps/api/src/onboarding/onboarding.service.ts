import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { User, UserStatus } from "@repo/database";
import { ONBOARDABLE_ROLES, Role } from "@repo/types";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { AuthService } from "../auth/auth.service";
import { sanitizeUser } from "../common/user.mapper";
import { EmailService } from "../email/email.service";
import { getWebAppUrl } from "../common/web-origin";
import { PrismaService } from "../prisma/prisma.service";
import { CompleteOnboardingDto, CreateOnboardingUserDto } from "./dto/onboarding.dto";

const ONBOARDING_HOURS = 48;

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {}

  async createUser(adminId: string, dto: CreateOnboardingUserDto) {
    if (!ONBOARDABLE_ROLES.includes(dto.role)) {
      throw new BadRequestException("Invalid role");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + ONBOARDING_HOURS * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        status: UserStatus.PENDING,
        stateId: dto.stateId,
        zoneId: dto.zoneId,
        branchId: dto.branchId,
        onboardingToken: token,
        onboardingTokenExpiry: expiry,
        createdById: adminId,
      },
    });

    await this.sendOnboardingEmail(user, token);
    return sanitizeUser(user);
  }

  async resend(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException("User is not pending onboarding");
    }

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + ONBOARDING_HOURS * 60 * 60 * 1000);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingToken: token, onboardingTokenExpiry: expiry },
    });

    await this.sendOnboardingEmail(updated, token);
    return sanitizeUser(updated);
  }

  async validateToken(token: string) {
    const user = await this.findByToken(token);
    return {
      valid: true,
      email: user.email,
      name: user.name,
      expiresAt: user.onboardingTokenExpiry,
    };
  }

  async complete(dto: CompleteOnboardingDto) {
    const user = await this.findByToken(dto.token);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const activated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: UserStatus.ACTIVE,
        onboardingToken: null,
        onboardingTokenExpiry: null,
      },
    });

    return this.authService.issueTokens(activated);
  }

  private async findByToken(token: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { onboardingToken: token } });
    if (!user || !user.onboardingTokenExpiry) {
      throw new NotFoundException("Invalid onboarding link");
    }
    if (user.onboardingTokenExpiry < new Date()) {
      throw new BadRequestException("Onboarding link has expired");
    }
    return user;
  }

  private async sendOnboardingEmail(user: User, token: string) {
    const webOrigin = getWebAppUrl();
    const link = `${webOrigin}/onboard/${token}`;
    await this.emailService.sendOnboardingEmail(user.email, user.name, link);
  }
}
