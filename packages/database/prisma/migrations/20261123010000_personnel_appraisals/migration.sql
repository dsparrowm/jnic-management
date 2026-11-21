CREATE TYPE "AppraisalPeriod" AS ENUM ('MID_YEAR', 'YEAR_END');

CREATE TABLE "PersonnelAppraisal" (
    "id" TEXT NOT NULL,
    "period" "AppraisalPeriod" NOT NULL,
    "year" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "score" INTEGER,
    "strengths" TEXT,
    "development" TEXT,
    "recommendation" TEXT,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonnelAppraisal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonnelAppraisal_subjectId_period_year_key" ON "PersonnelAppraisal"("subjectId", "period", "year");
CREATE INDEX "PersonnelAppraisal_period_year_idx" ON "PersonnelAppraisal"("period", "year");

ALTER TABLE "PersonnelAppraisal" ADD CONSTRAINT "PersonnelAppraisal_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonnelAppraisal" ADD CONSTRAINT "PersonnelAppraisal_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
