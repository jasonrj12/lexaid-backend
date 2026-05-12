require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to DB...');

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS nic_hash VARCHAR(64)`);
    console.log('✓ nic_hash column ready');

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nic_hash
      ON users(nic_hash) WHERE nic_hash IS NOT NULL
    `);
    console.log('✓ Unique index on nic_hash ready');

    // Phone uniqueness: only add index if no duplicates exist in current data
    const dupes = await client.query(`
      SELECT phone, COUNT(*) FROM users WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1
    `);
    if (dupes.rows.length === 0) {
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
        ON users(phone) WHERE phone IS NOT NULL
      `);
      console.log('✓ Unique index on phone ready');
    } else {
      console.log(`⚠ Skipped phone unique index — ${dupes.rows.length} duplicate phone(s) found in existing data.`);
      console.log('  Duplicate check will be enforced in application code only.');
    }

    console.log('\n✅ Migration complete.');
  } catch (err) {
    console.error('❌ Migration error:', err.message, err.detail || '');
  } finally {
    client.release();
    await pool.end();
  }
})();
