-- Branches belong to a state. Zone is optional.
ALTER TABLE "Branch" ADD COLUMN "stateId" TEXT;

UPDATE "Branch" AS b
SET "stateId" = z."stateId"
FROM "Zone" AS z
WHERE b."zoneId" = z."id";

ALTER TABLE "Branch" ALTER COLUMN "stateId" SET NOT NULL;

ALTER TABLE "Branch" DROP CONSTRAINT "Branch_zoneId_fkey";
DROP INDEX "Branch_zoneId_name_key";

ALTER TABLE "Branch" ALTER COLUMN "zoneId" DROP NOT NULL;

CREATE UNIQUE INDEX "Branch_stateId_name_key" ON "Branch"("stateId", "name");

ALTER TABLE "Branch"
ADD CONSTRAINT "Branch_stateId_fkey"
FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Branch"
ADD CONSTRAINT "Branch_zoneId_fkey"
FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
