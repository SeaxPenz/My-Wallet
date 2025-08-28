import dotenv from "dotenv";
dotenv.config();

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export { sql };

export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount NUMERIC NOT NULL,
  category TEXT,
  note TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log("Database connected and table created successfully.");
  } catch (error) {
    console.error("DB init error", error);
    throw error;
  }
}
