-- Personnel audit trail: who moved whom, between what, when, and why.
CREATE TYPE "PersonnelMoveKind" AS ENUM ('TERRITORY', 'SEAT', 'UNIT', 'STATUS');

CREATE TABLE "PersonnelMove" (
    "id" TEXT NOT NULL,
    "kind" "PersonnelMoveKind" NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonnelMove_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonnelMove_userId_idx" ON "PersonnelMove"("userId");
CREATE INDEX "PersonnelMove_actorId_idx" ON "PersonnelMove"("actorId");

ALTER TABLE "PersonnelMove" ADD CONSTRAINT "PersonnelMove_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonnelMove" ADD CONSTRAINT "PersonnelMove_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
