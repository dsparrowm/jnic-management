import { PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

type DirectorateSeed = {
  key: string;
  name: string;
  mandate: string;
  desks: { name: string; duties: string[] }[];
  branchUnits: string[];
  reportFields?: Record<string, string[]>;
};

type SharedTemplateSeed = Record<
  string,
  { name: string; due?: string; fields?: string[] }
>;

const LEVEL_CADENCE: Record<string, { level: "UNIT" | "DESK" | "DIRECTORATE" | "COUNCIL"; cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL"; dueDay: number | null }> = {
  D1: { level: "UNIT", cadence: "WEEKLY", dueDay: 1 },
  D2: { level: "UNIT", cadence: "MONTHLY", dueDay: 3 },
  D3: { level: "DESK", cadence: "MONTHLY", dueDay: 5 },
  D4: { level: "DIRECTORATE", cadence: "MONTHLY", dueDay: 7 },
  D5: { level: "COUNCIL", cadence: "QUARTERLY", dueDay: null },
  D6: { level: "COUNCIL", cadence: "ANNUAL", dueDay: null },
};

function toField(label: string) {
  const key = label
    .toLowerCase()
    .replace(/\(.*\)/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  const numeric = /\(%|count|rate|total|amount|number|attendance|budget|₦|naira)/i.test(label);
  const long = label.length > 42 || /summary|issues|challenges|plans|requests|recommendations|matters|prayer/i.test(label);
  return { key, label, type: numeric ? "number" : long ? "textarea" : "text" };
}

/** Upserts the ten directorates, their desks and branch unit types from the
 *  handbook seed (context/directorates-seed.json). Safe to re-run. */
async function seedDirectorates() {
  const seedPath = join(__dirname, "..", "..", "..", "context", "directorates-seed.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as {
    directorates: DirectorateSeed[];
  };

  let sortOrder = 0;
  for (const d of seed.directorates) {
    sortOrder += 1;
    const directorate = await prisma.directorate.upsert({
      where: { key: d.key },
      update: { name: d.name, mandate: d.mandate, sortOrder },
      create: { key: d.key, name: d.name, mandate: d.mandate, sortOrder },
    });

    let deskOrder = 0;
    for (const desk of d.desks) {
      deskOrder += 1;
      await prisma.desk.upsert({
        where: { directorateId_name: { directorateId: directorate.id, name: desk.name } },
        update: { duties: desk.duties, sortOrder: deskOrder },
        create: {
          directorateId: directorate.id,
          name: desk.name,
          duties: desk.duties,
          sortOrder: deskOrder,
        },
      });
    }

    let unitOrder = 0;
    for (const unitName of d.branchUnits) {
      unitOrder += 1;
      await prisma.branchUnitType.upsert({
        where: { directorateId_name: { directorateId: directorate.id, name: unitName } },
        update: { sortOrder: unitOrder },
        create: { directorateId: directorate.id, name: unitName, sortOrder: unitOrder },
      });
    }
  }
  console.log(`Seeded ${seed.directorates.length} directorates with desks and branch unit types`);
}

/** Upserts the D1-D6 report templates for every directorate. D1/D2 field lists
 *  come from each directorate's handbook; D3-D6 are shared. */
async function seedReportTemplates() {
  const seedPath = join(__dirname, "..", "..", "..", "context", "directorates-seed.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as {
    directorates: DirectorateSeed[];
    sharedTemplates: SharedTemplateSeed;
  };

  for (const d of seed.directorates) {
    const directorate = await prisma.directorate.findUnique({ where: { key: d.key } });
    if (!directorate) continue;
    for (const code of Object.keys(LEVEL_CADENCE)) {
      const meta = LEVEL_CADENCE[code];
      const shared = seed.sharedTemplates[code];
      const labels =
        code === "D1" || code === "D2"
          ? (d.reportFields?.[code] ?? [])
          : (shared?.fields ?? []);
      await prisma.reportTemplate.upsert({
        where: { directorateId_code: { directorateId: directorate.id, code } },
        update: {
          name: shared?.name ?? code,
          level: meta.level as never,
          cadence: meta.cadence as never,
          dueDay: meta.dueDay,
          fields: labels.map(toField),
        },
        create: {
          directorateId: directorate.id,
          code,
          name: shared?.name ?? code,
          level: meta.level as never,
          cadence: meta.cadence as never,
          dueDay: meta.dueDay,
          fields: labels.map(toField),
        },
      });
    }
  }
  console.log("Seeded report templates for all directorates");
}

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

  await seedDirectorates();
  await seedReportTemplates();

  // Catch-all region until real regions are announced; existing states fold into it.
  const nationalRegion = await prisma.region.upsert({
    where: { name: "National Region" },
    update: {},
    create: { name: "National Region" },
  });
  await prisma.state.updateMany({
    where: { regionId: null },
    data: { regionId: nationalRegion.id },
  });

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
  const lpName = process.env.SEED_LP_NAME ?? "Senior Pastor";

  if (!lpPassword) {
    throw new Error("SEED_LP_PASSWORD is required when SEED_DEMO_USERS=true.");
  }
  await ensureUser(lpEmail, lpPassword, lpName, Role.SENIOR_PASTOR);

  const state = await prisma.state.upsert({
    where: { name: "Lagos State" },
    update: {},
    create: { name: "Lagos State", regionId: nationalRegion.id },
  });

  const zone = await prisma.zone.upsert({
    where: { stateId_name: { stateId: state.id, name: "Victoria Island" } },
    update: {},
    create: { name: "Victoria Island", stateId: state.id },
  });

  const district = await prisma.district.upsert({
    where: { zoneId_name: { zoneId: zone.id, name: "VI District" } },
    update: {},
    create: { name: "VI District", zoneId: zone.id },
  });

  const branch = await prisma.branch.upsert({
    where: { stateId_name: { stateId: state.id, name: "VI Main Campus" } },
    update: { districtId: district.id },
    create: {
      name: "VI Main Campus",
      stateId: state.id,
      zoneId: zone.id,
      districtId: district.id,
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

  console.log(
    "Seeded org hierarchy: National Region → Lagos State → Victoria Island → VI District → VI Main Campus",
  );
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
