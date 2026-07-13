-- CreateEnum
CREATE TYPE "RollupStatus" AS ENUM ('IN_REVIEW', 'FORWARDED', 'STALE');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ROLLUP_FORWARDED';

-- CreateTable
CREATE TABLE "HierarchyWeeklyRollup" (
    "id" TEXT NOT NULL,
    "scopeType" "SummaryScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "status" "RollupStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "version" INTEGER NOT NULL DEFAULT 1,
    "forwardedAt" TIMESTAMP(3),
    "forwardedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HierarchyWeeklyRollup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HierarchyWeeklyRollup_weekOf_idx" ON "HierarchyWeeklyRollup"("weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "HierarchyWeeklyRollup_scopeType_scopeId_weekOf_key" ON "HierarchyWeeklyRollup"("scopeType", "scopeId", "weekOf");

-- AddForeignKey
ALTER TABLE "HierarchyWeeklyRollup" ADD CONSTRAINT "HierarchyWeeklyRollup_forwardedById_fkey" FOREIGN KEY ("forwardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
