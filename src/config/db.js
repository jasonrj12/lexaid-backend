const { Pool } = require('pg');
const dns = require('dns').promises;
const url = require('url');

let pool;

/**
 * Force IPv4 resolution for Supabase hostnames.
 * This is the most reliable way to avoid ENETUNREACH on Render.
 */
async function initializePool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set');
    return;
  }

  const parsedUrl = url.parse(dbUrl);
  const hostname = parsedUrl.hostname;

  console.log(`[DB] Forcing IPv4 resolution for: ${hostname}`);
  
  try {
    // Manually resolve to IPv4 address
    const addresses = await dns.resolve4(hostname);
    const ipv4 = addresses[0];
    
    // Construct new connection string using the IP address
    const newDbUrl = dbUrl.replace(hostname, ipv4);

    pool = new Pool({
      connectionString: newDbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Verify connection
    const client = await pool.connect();
    console.log(`✅ Database connected successfully via IPv4 (${ipv4})`);
    client.release();
  } catch (err) {
    console.error(`❌ Database connection failed: ${err.message}`);
    console.log('[DB] Falling back to standard resolution...');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
  }
}

// Start initialization
initializePool();

// Export as an object with the same methods as a Pool instance
module.exports = {
  query: (...args) => pool.query(...args),
  connect: (...args) => pool.connect(...args),
  end: (...args) => pool.end(...args),
  on: (...args) => pool.on(...args),
};
