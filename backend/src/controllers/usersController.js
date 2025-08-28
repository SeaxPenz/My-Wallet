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

// Accepts JSON { imageUrl } and updates local users table and Clerk (if configured)
export async function updateUserAvatar(req, res) {
  try {
    const { userId } = req.params;
    const { imageUrl } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' });

    await sql`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      image_uri TEXT,
      contact VARCHAR(50),
      address TEXT
    )`;

    await sql`
      INSERT INTO users (id, image_uri)
      VALUES (${userId}, ${imageUrl})
      ON CONFLICT (id) DO UPDATE SET image_uri = EXCLUDED.image_uri
    `;

    // If Clerk server API key present, attempt to fetch the remote image and update Clerk
    const clerkSecret = process.env.CLERK_API_KEY || process.env.CLERK_SECRET;
    if (clerkSecret && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      try {
        // Fetch the image bytes
        const resp = await fetch(imageUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');

          // Clerk REST API: update user public_metadata via PATCH
          const clerkEndpoint = `https://api.clerk.com/v1/users/${userId}`;
          const updateResp = await fetch(clerkEndpoint, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${clerkSecret}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ public_metadata: { image: `data:image/*;base64,${base64}` } })
          });
          if (!updateResp.ok) {
            console.warn('Clerk update responded with', updateResp.status);
          }
        }
      } catch (err) {
        console.warn('Failed to update Clerk avatar', err);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Failed to update user avatar', error);
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
}
