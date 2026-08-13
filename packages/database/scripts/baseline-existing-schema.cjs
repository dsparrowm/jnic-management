const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const INIT_MIGRATION = "20260710120000_init";

const INIT_ENUMS = [
  "RollupStatus",
  "NotificationType",
  "MonthlySummaryStatus",
  "SummaryScopeType",
  "ReportStatus",
  "OrgChangeStatus",
  "OrgChangeType",
  "UserStatus",
  "Role",
];

const MIGRATIONS = [
  {
    name: INIT_MIGRATION,
    async isPresent(prisma) {
      const tables = await listPublicTables(prisma);
      return ["User", "State", "Zone", "Branch"].some((name) => tables.includes(name));
    },
  },
  {
    name: "20260710150000_add_refresh_tokens",
    async isPresent(prisma) {
      const tables = await listPublicTables(prisma);
      return tables.includes("RefreshToken");
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
      const tables = await listPublicTables(prisma);
      return tables.includes("HierarchyWeeklyRollup");
    },
  },
];

const packageRoot = path.join(__dirname, "..");

async function listPublicTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT tablename AS name
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  return rows.map((row) => row.name);
}

async function listPublicEnums(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT t.typname AS name
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
    ORDER BY t.typname
  `);
  return rows.map((row) => row.name);
}

async function enumLabels(prisma, typeName) {
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT e.enumlabel AS label
      FROM pg_catalog.pg_enum e
      JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = $1
    `,
    typeName,
  );
  return rows.map((row) => row.label);
}

async function migrationStatus(prisma, name, tables) {
  if (!tables.includes("_prisma_migrations")) {
    return "missing";
  }

  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name = $1
    `,
    name,
  );
  const row = rows[0];
  if (!row) {
    return "missing";
  }
  if (row.finished_at && !row.rolled_back_at) {
    return "applied";
  }
  return "failed";
}

function runPrisma(args) {
  execFileSync("pnpm", ["exec", "prisma", ...args], {
    cwd: packageRoot,
    stdio: "inherit",
    env: process.env,
  });
}

function markApplied(name) {
  console.log(`Marking ${name} as applied (objects already exist).`);
  runPrisma(["migrate", "resolve", "--applied", name]);
}

function markRolledBack(name) {
  console.log(`Marking ${name} as rolled back so it can be applied cleanly.`);
  runPrisma(["migrate", "resolve", "--rolled-back", name]);
}

async function dropLeftoverInitEnums(prisma) {
  const existing = new Set(await listPublicEnums(prisma));
  const toDrop = INIT_ENUMS.filter((name) => existing.has(name));
  if (toDrop.length === 0) {
    return;
  }

  console.log(`Dropping leftover enum types: ${toDrop.join(", ")}`);
  for (const name of toDrop) {
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${name}" CASCADE`);
  }
}

const FOREIGN_TABLES = [
  "asset_positions",
  "investments",
  "kyc_documents",
  "mining_operations",
  "payouts",
  "transactions",
];

const JNLOP_TABLES = ["User", "State", "Zone", "Branch"];

function isForeignSchema(tables) {
  return FOREIGN_TABLES.some((name) => tables.includes(name)) &&
    !JNLOP_TABLES.some((name) => tables.includes(name));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to baseline migrations.");
  }

  const prisma = new PrismaClient();
  try {
    const tables = await listPublicTables(prisma);
    const enums = await listPublicEnums(prisma);
    const appTables = tables.filter((name) => name !== "_prisma_migrations");

    console.log(`Public tables: ${tables.join(", ") || "(none)"}`);
    console.log(`Public enums: ${enums.join(", ") || "(none)"}`);

    if (isForeignSchema(tables)) {
      throw new Error(
        [
          "DATABASE_URL points at a database that already belongs to another application",
          `(tables include ${FOREIGN_TABLES.filter((name) => tables.includes(name)).join(", ")}).`,
          "Do not run JNLOP migrations on it — that would collide with existing types such as NotificationType.",
          "In the Render dashboard: create a new empty Postgres instance for JNLOP, set this service's DATABASE_URL to that instance, then redeploy.",
          "After switching, you can delete the leftover `_prisma_migrations` row for 20260710120000_init from the old database if that app does not use Prisma.",
        ].join(" "),
      );
    }

    const initStatus = await migrationStatus(prisma, INIT_MIGRATION, tables);

    if (initStatus === "failed" && appTables.length === 0) {
      await dropLeftoverInitEnums(prisma);
      markRolledBack(INIT_MIGRATION);
      return;
    }

    if (appTables.length === 0 && initStatus !== "failed") {
      console.log("Empty database — nothing to baseline.");
      return;
    }

    for (const migration of MIGRATIONS) {
      const status = await migrationStatus(prisma, migration.name, tables);
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
