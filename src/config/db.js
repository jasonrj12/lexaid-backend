const { Pool } = require('pg');
const dns = require('dns').promises;
const url = require('url');

let pool;

async function initializePool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set');
    return;
  }

  const parsedUrl = url.parse(dbUrl);
  const hostname = parsedUrl.hostname;

  console.log(`[DB] Attempting to force IPv4 for: ${hostname}`);
  
  let targetUrl = dbUrl;
  try {
    // Try resolve4 first (best for direct A records)
    let ipv4;
    try {
      const addresses = await dns.resolve4(hostname);
      ipv4 = addresses[0];
    } catch (e) {
      // Fallback to dns.lookup (better for CNAMEs)
      const lookup = await dns.lookup(hostname, { family: 4 });
      ipv4 = lookup.address;
    }

    if (ipv4) {
      console.log(`[DB] Success! Forcing connection via IPv4: ${ipv4}`);
      targetUrl = dbUrl.replace(hostname, ipv4);
    }
  } catch (err) {
    console.warn(`[DB] Warning: Could not find an IPv4 address for ${hostname}.`);
    console.warn(`     If this is a Supabase IPv6-only project, you MUST use the Transaction Pooler string.`);
  }

  pool = new Pool({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Verification
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed after resolution.');
    console.error(`   Error: ${err.message}`);
    if (err.message.includes('ENETUNREACH')) {
      console.error('\n💡 CRITICAL: You are using an IPv6-only hostname.');
      console.error('   Please switch to the Supabase Transaction Pooler URL in your Render Dashboard.\n');
    }
  }
}

initializePool();

module.exports = {
  query: (...args) => pool.query(...args),
  connect: (...args) => pool.connect(...args),
  end: (...args) => pool.end(...args),
  on: (...args) => pool.on(...args),
};
