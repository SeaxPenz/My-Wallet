import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

async function ensureMigrationsTable() {
  await sql`CREATE TABLE IF NOT EXISTS migrations (id VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT NOW())`;
}

async function alreadyApplied(id) {
  const rows = await sql`SELECT id FROM migrations WHERE id = ${id}`;
  return rows.length > 0;
}

async function markApplied(id) {
  await sql`INSERT INTO migrations (id) VALUES (${id})`;
}

async function run() {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  await ensureMigrationsTable();
  for (const file of files) {
    const id = file;
    if (await alreadyApplied(id)) {
      console.log("Skipping already applied migration", id);
      continue;
    }
    const sqlText = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log("Applying migration", id);
    try {
      await sql.unsafe(sqlText);
      await markApplied(id);
      console.log("Applied", id);
    } catch (err) {
      console.error("Failed to apply", id, err);
      process.exit(1);
    }
  }
  console.log("Migrations complete");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
