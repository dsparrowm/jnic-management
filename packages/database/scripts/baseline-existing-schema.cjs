const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const MIGRATIONS = [
  {
    name: "20260710120000_init",
    async isPresent(prisma) {
      return tableExists(prisma, "User");
    },
  },
  {
    name: "20260710150000_add_refresh_tokens",
    async isPresent(prisma) {
      return tableExists(prisma, "RefreshToken");
    },
  },
  {
    name: "20260713000000_remove_admin_staff_role",
    async isPresent(prisma) {
      const labels = await enumLabels(prisma, "Role");
      return labels.length > 0 && !labels.includes("ADMIN_STAFF");
    },
  },
  {
    name: "20260713120000_add_hierarchy_weekly_rollups",
    async isPresent(prisma) {
      return tableExists(prisma, "HierarchyWeeklyRollup");
    },
  },
];

const packageRoot = path.join(__dirname, "..");

async function tableExists(prisma, tableName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    ) AS present
  `;
  return Boolean(rows[0]?.present);
}

async function enumLabels(prisma, typeName) {
  const rows = await prisma.$queryRaw`
    SELECT e.enumlabel AS label
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = ${typeName}
  `;
  return rows.map((row) => row.label);
}

async function migrationStatus(prisma, name) {
  const tableReady = await tableExists(prisma, "_prisma_migrations");
  if (!tableReady) {
    return "missing";
  }

  const rows = await prisma.$queryRaw`
    SELECT finished_at, rolled_back_at
    FROM "_prisma_migrations"
    WHERE migration_name = ${name}
  `;
  const row = rows[0];
  if (!row) {
    return "missing";
  }
  if (row.finished_at && !row.rolled_back_at) {
    return "applied";
  }
  return "failed";
}

function markApplied(name) {
  console.log(`Marking ${name} as applied (objects already exist in the database).`);
  execFileSync("pnpm", ["exec", "prisma", "migrate", "resolve", "--applied", name], {
    cwd: packageRoot,
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to baseline migrations.");
  }

  const prisma = new PrismaClient();
  try {
    const hasUserTable = await tableExists(prisma, "User");
    if (!hasUserTable) {
      console.log("Empty database — skipping Prisma baseline.");
      return;
    }

    for (const migration of MIGRATIONS) {
      const status = await migrationStatus(prisma, migration.name);
      if (status === "applied") {
        continue;
      }

      if (await migration.isPresent(prisma)) {
        markApplied(migration.name);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
