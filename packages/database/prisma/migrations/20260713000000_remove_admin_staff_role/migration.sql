-- Reassign any ADMIN_STAFF users before removing the enum value
UPDATE "User" SET role = 'BRANCH_PASTOR' WHERE role = 'ADMIN_STAFF';

CREATE TYPE "Role_new" AS ENUM ('LEAD_PASTOR', 'ADMIN', 'STATE_PASTOR', 'ZONAL_PASTOR', 'BRANCH_PASTOR');

ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");

DROP TYPE "Role";

ALTER TYPE "Role_new" RENAME TO "Role";
