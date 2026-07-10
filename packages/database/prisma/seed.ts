import { PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function ensureUser(
  email: string,
  password: string,
  name: string,
  role: Role,
) {
  const existingForRole = await prisma.user.findFirst({
    where: { role, status: { not: UserStatus.DEACTIVATED } },
  });
  if (existingForRole) {
    console.log(`${role} account already exists (${existingForRole.email}), skipping`);
    return existingForRole;
  }

  const existingForEmail = await prisma.user.findUnique({ where: { email } });
  if (existingForEmail) {
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
    },
  });
  console.log(`Created ${role} account: ${email}`);
  return created;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@jnic.org";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Platform Admin";

  await ensureUser(adminEmail, adminPassword, adminName, Role.ADMIN);

  const lpEmail = process.env.SEED_LP_EMAIL ?? "lead@jnic.org";
  const lpPassword = process.env.SEED_LP_PASSWORD ?? "ChangeMe123!";
  const lpName = process.env.SEED_LP_NAME ?? "Lead Pastor";

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

  await prisma.branch.upsert({
    where: { zoneId_name: { zoneId: zone.id, name: "VI Main Campus" } },
    update: {},
    create: {
      name: "VI Main Campus",
      zoneId: zone.id,
      address: "12 Adeola Odeku Street, Victoria Island",
    },
  });

  console.log("Seeded org hierarchy: Lagos State → Victoria Island → VI Main Campus");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
