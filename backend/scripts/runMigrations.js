import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();
const migrationsDir = path.join(__dirname, "..", "migrations");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  const files = fs.existsSync(migrationsDir)
    ? fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort()
    : [];

  for (const file of files) {
    const { rows } = await client.query(
      "SELECT 1 FROM migrations WHERE name = $1",
      [file]
    );
    if (rows.length) {
      console.log("Skipping already applied migration:", file);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log("Applying migration:", file);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO migrations(name) VALUES($1)", [file]);
      await client.query("COMMIT");
      console.log("Applied:", file);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Migration failed:", file, err);
      process.exit(1);
    }
  }

  await client.end();
  console.log("Migrations complete.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
