import dotenv from "dotenv";
dotenv.config();

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export { sql };

export async function initDb() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      category VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;
    console.log("Database connected and table created successfully.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
}
