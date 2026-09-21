/**
 * Create or refresh ACTIVE zonal + state pastor test accounts.
 *
 * Usage (production — copy External Database URL from Render):
 *   DATABASE_URL="postgresql://..." pnpm exec tsx apps/api/scripts/provision-test-pastors.ts
 *
 * Local:
 *   pnpm db:provision-test-pastors
 */
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "ChangeMe123!";

const ZONAL_EMAIL = process.env.PROVISION_ZONAL_EMAIL ?? "zonal@jnic.org";
const ZONAL_NAME = process.env.PROVISION_ZONAL_NAME ?? "VI Zonal Pastor";
const ZONAL_PASSWORD = process.env.PROVISION_ZONAL_PASSWORD ?? DEFAULT_PASSWORD;

const STATE_EMAIL = process.env.PROVISION_STATE_EMAIL ?? "state@jnic.org";
const STATE_NAME = process.env.PROVISION_STATE_NAME ?? "Lagos State Pastor";
const STATE_PASSWORD = process.env.PROVISION_STATE_PASSWORD ?? DEFAULT_PASSWORD;

const BRANCH_NAME = process.env.PROVISION_BRANCH_NAME ?? "VI Main Campus";

async function ensureActivePastor(
  email: string,
  password: string,
  name: string,
  role: Role,
  org: { stateId: string; zoneId?: string | null; branchId?: string | null },
) {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        role,
        status: UserStatus.ACTIVE,
        passwordHash,
        stateId: org.stateId,
        zoneId: org.zoneId ?? null,
        branchId: org.branchId ?? null,
        onboardingToken: null,
        onboardingTokenExpiry: null,
      },
    });
    console.log(`Updated ${role}: ${email}`);
    return updated;
  }

  const created = await prisma.user.create({
    data: {
      email,
      name,
      role,
      status: UserStatus.ACTIVE,
      passwordHash,
      stateId: org.stateId,
      zoneId: org.zoneId ?? null,
      branchId: org.branchId ?? null,
    },
  });
  console.log(`Created ${role}: ${email}`);
  return created;
}

async function main() {
  const branch = await prisma.branch.findFirst({
    where: { name: { equals: BRANCH_NAME, mode: "insensitive" } },
    include: { zone: { include: { state: true } } },
  });

  if (!branch) {
    throw new Error(
      `Branch "${BRANCH_NAME}" not found. Create org hierarchy first or set PROVISION_BRANCH_NAME.`,
    );
  }

  const { zone } = branch;
  const state = zone.state;

  const zonalPastor = await ensureActivePastor(
    ZONAL_EMAIL,
    ZONAL_PASSWORD,
    ZONAL_NAME,
    Role.ZONAL_PASTOR,
    {
      stateId: state.id,
      zoneId: zone.id,
      branchId: branch.id,
    },
  );

  await prisma.zone.update({
    where: { id: zone.id },
    data: { zonalPastorId: zonalPastor.id },
  });

  const statePastor = await ensureActivePastor(
    STATE_EMAIL,
    STATE_PASSWORD,
    STATE_NAME,
    Role.STATE_PASTOR,
    { stateId: state.id },
  );

  await prisma.state.update({
    where: { id: state.id },
    data: { statePastorId: statePastor.id },
  });

  console.log("");
  console.log("Test pastors ready:");
  console.log(`  Org: ${state.name} → ${zone.name} → ${branch.name}`);
  console.log("");
  console.log(`  Zonal pastor  ${ZONAL_EMAIL}  /  ${ZONAL_PASSWORD}`);
  console.log(`    Assignment: ${zone.name} (home branch: ${branch.name})`);
  console.log("");
  console.log(`  State pastor  ${STATE_EMAIL}  /  ${STATE_PASSWORD}`);
  console.log(`    Assignment: ${state.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
