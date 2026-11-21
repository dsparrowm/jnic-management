CREATE TYPE "TemplateLevel" AS ENUM ('UNIT', 'DESK', 'DIRECTORATE', 'COUNCIL');
CREATE TYPE "TemplateCadence" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL');
CREATE TYPE "TemplateReportStatus" AS ENUM ('SUBMITTED', 'DESK_REVIEWED', 'DIRECTOR_REVIEWED', 'RESIDENT_REVIEWED', 'SENIOR_REVIEWED');

CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "directorateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "TemplateLevel" NOT NULL,
    "cadence" "TemplateCadence" NOT NULL,
    "dueDay" INTEGER,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReportTemplate_directorateId_code_key" ON "ReportTemplate"("directorateId", "code");

CREATE TABLE "TemplateReport" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "directorateId" TEXT NOT NULL,
    "deskId" TEXT,
    "serviceUnitId" TEXT,
    "branchId" TEXT,
    "periodKey" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" "TemplateReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TemplateReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TemplateReport_directorateId_status_idx" ON "TemplateReport"("directorateId", "status");
CREATE INDEX "TemplateReport_templateId_periodKey_idx" ON "TemplateReport"("templateId", "periodKey");

ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "Directorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateReport" ADD CONSTRAINT "TemplateReport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateReport" ADD CONSTRAINT "TemplateReport_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "Directorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateReport" ADD CONSTRAINT "TemplateReport_deskId_fkey" FOREIGN KEY ("deskId") REFERENCES "Desk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TemplateReport" ADD CONSTRAINT "TemplateReport_serviceUnitId_fkey" FOREIGN KEY ("serviceUnitId") REFERENCES "ServiceUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TemplateReport" ADD CONSTRAINT "TemplateReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
