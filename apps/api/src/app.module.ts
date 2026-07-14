import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { FilesModule } from "./files/files.module";
import { HealthModule } from "./health/health.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { OrgModule } from "./org/org.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
import { SummariesModule } from "./summaries/summaries.module";
import { UsersModule } from "./users/users.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    OnboardingModule,
    OrgModule,
    FilesModule,
    ReportsModule,
    NotificationsModule,
    SummariesModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
