require('dotenv').config();

const dns = require('node:dns');

// Force IPv4 first to avoid ENETUNREACH errors on Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 LexAid API running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'Not set'}\n`);
});
