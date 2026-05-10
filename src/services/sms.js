/**
 * SMS Notification Service — Text.lk API integration
 * LexAid proposal §4.5 & §8
 * Auth: Bearer token (Laravel Sanctum format: "id|token")
 * Fallback: in-app notifications only if SMS fails (§10 risk mitigation)
 */

const https = require('https');

const SMS_ENABLED   = process.env.SMS_ENABLED === 'true';
const API_TOKEN     = process.env.SMS_API_TOKEN;
const SENDER_ID     = process.env.SMS_SENDER_ID || 'LexAid';

/**
 * Send a single SMS via Text.lk
 * @param {string} to   - Sri Lankan mobile number (e.g. 0771234567 or +94771234567)
 * @param {string} text - Message body (max 160 chars per segment)
 * @returns {Promise<{success:boolean, response?:any, reason?:string}>}
 */
async function sendSMS(to, text) {
  if (!SMS_ENABLED) {
    console.info('[SMS] SMS_ENABLED=false — skipped');
    return { success: false, reason: 'sms_disabled' };
  }
  if (!API_TOKEN) {
    console.warn('[SMS] SMS_API_TOKEN not configured — SMS skipped (in-app only)');
    return { success: false, reason: 'token_not_configured' };
  }

  // Normalise to international format (+94XXXXXXXXX)
  let normalised = to.replace(/\s+/g, '');
  if (normalised.startsWith('0'))       normalised = '+94' + normalised.slice(1);
  else if (!normalised.startsWith('+')) normalised = '+94' + normalised;

  const payload = JSON.stringify({
    recipient: normalised,
    sender_id: SENDER_ID,
    message:   text,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'app.text.lk',
      path:     '/api/v3/sms/send',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Accept':         'application/json',
        'Authorization':  `Bearer ${API_TOKEN}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200 && json.status === 'success') {
            console.log(`[SMS] ✅ Sent to ${normalised}`);
            resolve({ success: true, response: json });
          } else {
            console.error(`[SMS] ❌ API error (HTTP ${res.statusCode}):`, json);
            resolve({ success: false, response: json });
          }
        } catch {
          console.error('[SMS] Failed to parse response:', data);
          resolve({ success: false, response: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SMS] Request error:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * LexAid notification message templates (§4.5)
 */
const SMS_TEMPLATES = {
  case_submitted:  (ref) => `LexAid: Your case ${ref} has been submitted and is under review. You will be notified when a lawyer is assigned.`,
  case_assigned:   (ref) => `LexAid: A verified volunteer lawyer has been assigned to your case ${ref}. Check your dashboard for details.`,
  case_resolved:   (ref) => `LexAid: Your case ${ref} has been marked as resolved. Please log in to rate your experience and close the case.`,
  case_closed:     (ref) => `LexAid: Case ${ref} is now closed. Thank you for using LexAid.`,
  new_message:     (ref) => `LexAid: You have a new message on case ${ref}. Log in to view and respond.`,
  lawyer_approved:  ()   => `LexAid: Your volunteer lawyer account has been verified and is now active. Welcome to the platform!`,
  lawyer_rejected:  ()   => `LexAid: Your LexAid lawyer registration was not approved. Please contact support for more information.`,
};

/**
 * Send a templated SMS notification
 * @param {string} phone - Recipient phone number
 * @param {string} type  - One of the SMS_TEMPLATES keys
 * @param {string} ref   - Case reference number (optional)
 */
async function notifyBySMS(phone, type, ref = '') {
  const templateFn = SMS_TEMPLATES[type];
  if (!templateFn || !phone) return { success: false, reason: 'no_template_or_phone' };
  return sendSMS(phone, templateFn(ref));
}

module.exports = { sendSMS, notifyBySMS };
