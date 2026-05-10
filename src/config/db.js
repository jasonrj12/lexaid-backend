const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // required for Supabase
  // Connection pool settings optimised for Supabase pooler + Render free tier
  max: 10,               // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('   Tip: if using Render + Supabase, use the Supabase Pooler URL (IPv4)');
    console.error('   Project Settings → Database → Connection pooling → Session mode');
  } else {
    console.log('✅ Database connected');
    release();
  }
});

module.exports = pool;
