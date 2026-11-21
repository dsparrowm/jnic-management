import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReportTemplatesController } from "./report-templates.controller";
import { ReportTemplatesService } from "./report-templates.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ReportTemplatesController],
  providers: [ReportTemplatesService],
})
export class ReportTemplatesModule {}
