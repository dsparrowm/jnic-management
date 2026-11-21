-- B4 territory report filing: scope pastor's narrative on the consolidated monthly summary.
ALTER TABLE "MonthlySummary"
  ADD COLUMN "newChurches" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "welfareNote" TEXT,
  ADD COLUMN "plansNote" TEXT,
  ADD COLUMN "filedById" TEXT,
  ADD COLUMN "filedAt" TIMESTAMP(3);

ALTER TABLE "MonthlySummary"
  ADD CONSTRAINT "MonthlySummary_filedById_fkey"
  FOREIGN KEY ("filedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
