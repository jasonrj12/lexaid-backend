/**
 * Quick test — sends a real SMS via Text.lk
 * Usage: node test_sms.js +94XXXXXXXXX
 */
require('dotenv').config();
const { sendSMS } = require('./src/services/sms');

const to = process.argv[2] || '+94771234567';
console.log(`\n📱 Sending test SMS to ${to}…\n`);

sendSMS(to, 'LexAid: SMS integration test. If you received this, the gateway is working correctly!')
  .then(result => {
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log('Response:', JSON.stringify(result.response, null, 2));
    } else {
      console.error('❌ SMS failed:', result.reason || result.response || result.error);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
