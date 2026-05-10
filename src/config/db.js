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
    console.error('   Code:', err.code);
    console.error('   Stack:', err.stack);
    console.error('\n💡 Troubleshooting Tip:');
    console.error('   - If error is ENETUNREACH, ensure src/server.js has ipv4first DNS setting.');
    console.error('   - Check if your IP is whitelisted in Supabase (0.0.0.0/0 for Render).');
    console.error('   - Verify DATABASE_URL is set correctly in Render Dashboard.');
  } else {
    console.log('✅ Database connected successfully to Supabase');
    release();
  }
});

module.exports = pool;
