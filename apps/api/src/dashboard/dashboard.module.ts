import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { OrgModule } from "../org/org.module";
import { ReportsModule } from "../reports/reports.module";
import { SummariesModule } from "../summaries/summaries.module";
import { UsersModule } from "../users/users.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [
    OrgModule,
    UsersModule,
    ReportsModule,
    SummariesModule,
    NotificationsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
