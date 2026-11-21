-- Structure v2, Slice A: dual-line org model.
-- Territorial: Region -> State -> Zone -> District -> Branch.
-- Directorate: Directorate -> Desk -> BranchUnitType/ServiceUnit; DirectorateAssignment links users.

-- Role enum: LEAD_PASTOR becomes SENIOR_PASTOR (rename keeps existing rows valid),
-- plus RESIDENT_PASTOR and the two new territorial seats.
ALTER TYPE "Role" RENAME VALUE 'LEAD_PASTOR' TO 'SENIOR_PASTOR';
ALTER TYPE "Role" ADD VALUE 'RESIDENT_PASTOR';
ALTER TYPE "Role" ADD VALUE 'REGIONAL_PASTOR';
ALTER TYPE "Role" ADD VALUE 'DISTRICT_PASTOR';

ALTER TYPE "SummaryScopeType" ADD VALUE 'DISTRICT';
ALTER TYPE "SummaryScopeType" ADD VALUE 'REGION';

CREATE TYPE "DirectorateOffice" AS ENUM ('DIRECTOR', 'DEPUTY_DIRECTOR', 'SECRETARY', 'DESK_HEAD', 'DEPUTY_DESK_HEAD', 'REGIONAL_COORDINATOR', 'MEMBER');

CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionalPastorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "districtPastorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Directorate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mandate" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Directorate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Desk" (
    "id" TEXT NOT NULL,
    "directorateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duties" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Desk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BranchUnitType" (
    "id" TEXT NOT NULL,
    "directorateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BranchUnitType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceUnit" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "unitTypeId" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectorateAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "directorateId" TEXT NOT NULL,
    "deskId" TEXT,
    "office" "DirectorateOffice" NOT NULL DEFAULT 'MEMBER',
    "agreedWeeklyHours" INTEGER,
    "termYears" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DirectorateAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "title" TEXT,
    ADD COLUMN "regionId" TEXT,
    ADD COLUMN "districtId" TEXT;

ALTER TABLE "State" ADD COLUMN "regionId" TEXT;
ALTER TABLE "Branch" ADD COLUMN "districtId" TEXT;

CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");
CREATE UNIQUE INDEX "Region_regionalPastorId_key" ON "Region"("regionalPastorId");
CREATE UNIQUE INDEX "District_zoneId_name_key" ON "District"("zoneId", "name");
CREATE UNIQUE INDEX "District_districtPastorId_key" ON "District"("districtPastorId");
CREATE UNIQUE INDEX "Directorate_key_key" ON "Directorate"("key");
CREATE UNIQUE INDEX "Directorate_name_key" ON "Directorate"("name");
CREATE UNIQUE INDEX "Desk_directorateId_name_key" ON "Desk"("directorateId", "name");
CREATE UNIQUE INDEX "BranchUnitType_directorateId_name_key" ON "BranchUnitType"("directorateId", "name");
CREATE UNIQUE INDEX "ServiceUnit_branchId_unitTypeId_key" ON "ServiceUnit"("branchId", "unitTypeId");
CREATE UNIQUE INDEX "DirectorateAssignment_userId_key" ON "DirectorateAssignment"("userId");
CREATE INDEX "DirectorateAssignment_directorateId_idx" ON "DirectorateAssignment"("directorateId");
CREATE INDEX "DirectorateAssignment_deskId_idx" ON "DirectorateAssignment"("deskId");
CREATE INDEX "User_regionId_idx" ON "User"("regionId");
CREATE INDEX "User_districtId_idx" ON "User"("districtId");

ALTER TABLE "Region" ADD CONSTRAINT "Region_regionalPastorId_fkey" FOREIGN KEY ("regionalPastorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "District" ADD CONSTRAINT "District_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "District" ADD CONSTRAINT "District_districtPastorId_fkey" FOREIGN KEY ("districtPastorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Desk" ADD CONSTRAINT "Desk_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "Directorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BranchUnitType" ADD CONSTRAINT "BranchUnitType_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "Directorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceUnit" ADD CONSTRAINT "ServiceUnit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceUnit" ADD CONSTRAINT "ServiceUnit_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES "BranchUnitType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceUnit" ADD CONSTRAINT "ServiceUnit_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectorateAssignment" ADD CONSTRAINT "DirectorateAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorateAssignment" ADD CONSTRAINT "DirectorateAssignment_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "Directorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectorateAssignment" ADD CONSTRAINT "DirectorateAssignment_deskId_fkey" FOREIGN KEY ("deskId") REFERENCES "Desk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "State" ADD CONSTRAINT "State_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
