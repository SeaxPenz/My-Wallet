import { sql } from "../config/db.js";

export async function upsertUserMetadata(req, res) {
  try {
    const { userId } = req.params;
    const { name, imageUri, contact, address } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    // Store minimal metadata in a simple users table (create if not exists)
    await sql`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      image_uri TEXT,
      contact VARCHAR(50),
      address TEXT
    )`;

    await sql`
      INSERT INTO users (id, name, image_uri, contact, address)
      VALUES (${userId}, ${name}, ${imageUri}, ${contact}, ${address})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        image_uri = EXCLUDED.image_uri,
        contact = EXCLUDED.contact,
        address = EXCLUDED.address
    `;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to upsert user metadata", error);
    return res.status(500).json({ error: "Failed to save user metadata" });
  }
}
