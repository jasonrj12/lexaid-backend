const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('Updating lawyer_profiles table...');
    await client.query(`
      ALTER TABLE lawyer_profiles 
      ADD COLUMN IF NOT EXISTS id_card_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS face_photo_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS is_face_verified BOOLEAN DEFAULT FALSE;
    `);
    console.log('Successfully updated lawyer_profiles table.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
