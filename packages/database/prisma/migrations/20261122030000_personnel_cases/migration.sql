CREATE TYPE "PersonnelCaseKind" AS ENUM ('WELFARE', 'DISCIPLINE');
CREATE TYPE "PersonnelCaseStatus" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');

CREATE TABLE "PersonnelCase" (
    "id" TEXT NOT NULL,
    "kind" "PersonnelCaseKind" NOT NULL,
    "status" "PersonnelCaseStatus" NOT NULL DEFAULT 'OPEN',
    "subjectId" TEXT,
    "openedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonnelCase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonnelCase_kind_status_idx" ON "PersonnelCase"("kind", "status");
CREATE INDEX "PersonnelCase_subjectId_idx" ON "PersonnelCase"("subjectId");

ALTER TABLE "PersonnelCase" ADD CONSTRAINT "PersonnelCase_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonnelCase" ADD CONSTRAINT "PersonnelCase_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
