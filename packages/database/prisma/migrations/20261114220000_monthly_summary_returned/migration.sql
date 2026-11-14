-- AlterEnum
ALTER TYPE "MonthlySummaryStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "MonthlySummary"
ADD COLUMN "returnedById" TEXT,
ADD COLUMN "returnedAt" TIMESTAMP(3),
ADD COLUMN "returnNote" TEXT;
