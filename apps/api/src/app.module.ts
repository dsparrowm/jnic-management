import { join } from "path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppraisalsModule } from "./appraisals/appraisals.module";
import { AuthModule } from "./auth/auth.module";
import { CasesModule } from "./cases/cases.module";
import { ChatModule } from "./chat/chat.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DirectoratesModule } from "./directorates/directorates.module";
import { FilesModule } from "./files/files.module";
import { HealthModule } from "./health/health.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { OrgModule } from "./org/org.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RemindersModule } from "./reminders/reminders.module";
import { ReportsModule } from "./reports/reports.module";
import { ReportTemplatesModule } from "./report-templates/report-templates.module";
import { SummariesModule } from "./summaries/summaries.module";
import { UsersModule } from "./users/users.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, "..", "..", "..", ".env"), ".env"],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ttl: 60_000, limit: 60 }],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    CasesModule,
    AppraisalsModule,
    ChatModule,
    DashboardModule,
    DirectoratesModule,
    OnboardingModule,
    OrgModule,
    FilesModule,
    ReportsModule,
    ReportTemplatesModule,
    NotificationsModule,
    SummariesModule,
    RemindersModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
