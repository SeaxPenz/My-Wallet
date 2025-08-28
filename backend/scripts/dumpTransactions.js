import { sql } from '../src/config/db.js';

async function dump() {
  try {
    const rows = await sql`SELECT id, user_id, title, amount, created_at FROM transactions ORDER BY created_at DESC LIMIT 20`;
    console.log('Found', rows.length, 'transactions');
    for (const r of rows) {
      console.log(r);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

dump();
