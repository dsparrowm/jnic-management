import { PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULT_SEED_PASSWORD = "ChangeMe123!";

function resolveSeedPassword(envName: string, requiredInProduction = false): string | null {
  const value = process.env[envName];
  if (process.env.NODE_ENV === "production") {
    if (!value || value === DEFAULT_SEED_PASSWORD) {
      if (requiredInProduction) {
        throw new Error(
          `Refusing to seed in production without ${envName}. Do not use the default password.`,
        );
      }
      return null;
    }
    return value;
  }
  return value ?? DEFAULT_SEED_PASSWORD;
}

async function ensureUser(
  email: string,
  password: string,
  name: string,
  role: Role,
  org?: { stateId?: string; zoneId?: string; branchId?: string },
) {
  const existingForRole = await prisma.user.findFirst({
    where: { role, status: { not: UserStatus.DEACTIVATED } },
  });
  if (existingForRole && !org) {
    console.log(`${role} account already exists (${existingForRole.email}), skipping`);
    return existingForRole;
  }

  const existingForEmail = await prisma.user.findUnique({ where: { email } });
  if (existingForEmail) {
    if (org) {
      const updated = await prisma.user.update({
        where: { id: existingForEmail.id },
        data: org,
      });
      console.log(`Updated org assignment for ${email}`);
      return updated;
    }
    console.log(`Email already in use (${email}), skipping ${role} creation`);
    return existingForEmail;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: {
      email,
      name,
      role,
      status: UserStatus.ACTIVE,
      passwordHash,
      ...org,
    },
  });
  console.log(`Created ${role} account: ${email}`);
  return created;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@jnic.org";
  const adminPassword = resolveSeedPassword("SEED_ADMIN_PASSWORD", true);
  const adminName = process.env.SEED_ADMIN_NAME ?? "Platform Admin";

  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD is required.");
  }

  await ensureUser(adminEmail, adminPassword, adminName, Role.ADMIN);

  const seedDemoUsers =
    process.env.NODE_ENV !== "production" || process.env.SEED_DEMO_USERS === "true";
  if (!seedDemoUsers) {
    console.log(
      `Production admin ready: ${adminEmail}. Skipping demo pastors (set SEED_DEMO_USERS=true to create them).`,
    );
    return;
  }

  const lpEmail = process.env.SEED_LP_EMAIL ?? "lead@jnic.org";
  const lpPassword = resolveSeedPassword("SEED_LP_PASSWORD");
  const lpName = process.env.SEED_LP_NAME ?? "Lead Pastor";

  if (!lpPassword) {
    throw new Error("SEED_LP_PASSWORD is required when SEED_DEMO_USERS=true.");
  }
  await ensureUser(lpEmail, lpPassword, lpName, Role.LEAD_PASTOR);

  const state = await prisma.state.upsert({
    where: { name: "Lagos State" },
    update: {},
    create: { name: "Lagos State" },
  });

  const zone = await prisma.zone.upsert({
    where: { stateId_name: { stateId: state.id, name: "Victoria Island" } },
    update: {},
    create: { name: "Victoria Island", stateId: state.id },
  });

  const branch = await prisma.branch.upsert({
    where: { zoneId_name: { zoneId: zone.id, name: "VI Main Campus" } },
    update: {},
    create: {
      name: "VI Main Campus",
      zoneId: zone.id,
      address: "12 Adeola Odeku Street, Victoria Island",
    },
  });

  const zonalEmail = process.env.SEED_ZONAL_EMAIL ?? "zonal@jnic.org";
  const zonalPassword = resolveSeedPassword("SEED_ZONAL_PASSWORD");
  const zonalName = process.env.SEED_ZONAL_NAME ?? "Zonal Pastor";
  if (!zonalPassword) {
    throw new Error("SEED_ZONAL_PASSWORD is required when SEED_DEMO_USERS=true.");
  }

  const zonalPastor = await ensureUser(zonalEmail, zonalPassword, zonalName, Role.ZONAL_PASTOR, {
    stateId: state.id,
    zoneId: zone.id,
    branchId: branch.id,
  });

  await prisma.zone.update({
    where: { id: zone.id },
    data: { zonalPastorId: zonalPastor.id },
  });

  const branchEmail = process.env.SEED_BRANCH_EMAIL ?? "branch@jnic.org";
  const branchPassword = resolveSeedPassword("SEED_BRANCH_PASSWORD");
  const branchName = process.env.SEED_BRANCH_NAME ?? "Branch Pastor";
  if (!branchPassword) {
    throw new Error("SEED_BRANCH_PASSWORD is required when SEED_DEMO_USERS=true.");
  }

  const branchPastor = await ensureUser(branchEmail, branchPassword, branchName, Role.BRANCH_PASTOR, {
    stateId: state.id,
    zoneId: zone.id,
    branchId: branch.id,
  });

  await prisma.branch.update({
    where: { id: branch.id },
    data: { branchPastorId: branchPastor.id },
  });

  const stateEmail = process.env.SEED_STATE_EMAIL ?? "state@jnic.org";
  const statePassword = resolveSeedPassword("SEED_STATE_PASSWORD");
  const stateName = process.env.SEED_STATE_NAME ?? "State Pastor";
  if (!statePassword) {
    throw new Error("SEED_STATE_PASSWORD is required when SEED_DEMO_USERS=true.");
  }

  const statePastor = await ensureUser(stateEmail, statePassword, stateName, Role.STATE_PASTOR, {
    stateId: state.id,
  });

  await prisma.state.update({
    where: { id: state.id },
    data: { statePastorId: statePastor.id },
  });

  console.log("Seeded org hierarchy: Lagos State → Victoria Island → VI Main Campus");
  console.log(
    `Zonal pastor (dual-scope): ${zonalEmail} | Branch pastor: ${branchEmail} | State pastor: ${stateEmail}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
