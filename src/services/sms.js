/**
 * SMS Notification Service — Text.lk API integration
 * As specified in LexAid proposal §4.5 & §8
 * Fallback: in-app notifications only if SMS fails (§10 risk mitigation)
 */

const https = require('https');
const querystring = require('querystring');

const TEXTLK_BASE  = 'https://app.text.lk';
const SENDER_ID    = process.env.TEXTLK_SENDER_ID || 'LexAid';
const API_KEY      = process.env.TEXTLK_API_KEY;

/**
 * Send a single SMS via Text.lk
 * @param {string} to   - Sri Lankan mobile number (e.g. 0771234567 or +94771234567)
 * @param {string} text - Message body (max 160 chars per segment)
 * @returns {Promise<{success:boolean, response:any}>}
 */
async function sendSMS(to, text) {
  if (!API_KEY || API_KEY === 'your_textlk_api_key') {
    console.warn('[SMS] TEXTLK_API_KEY not configured — SMS skipped (in-app only)');
    return { success: false, reason: 'api_key_not_configured' };
  }

  // Normalise to international format
  const normalised = to.startsWith('+94') ? to : to.startsWith('0') ? '+94' + to.slice(1) : to;

  const payload = querystring.stringify({
    api_key:   API_KEY,
    sender_id: SENDER_ID,
    to:        normalised,
    message:   text,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'app.text.lk',
      path:     '/api/v3/sms/send',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        'Accept':         'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'success') {
            console.log(`[SMS] Sent to ${normalised}`);
            resolve({ success: true, response: json });
          } else {
            console.error('[SMS] API error:', json);
            resolve({ success: false, response: json });
          }
        } catch {
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
 * Convenience wrappers for LexAid notification triggers (§4.5)
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

async function notifyBySMS(phone, type, ref = '') {
  const templateFn = SMS_TEMPLATES[type];
  if (!templateFn || !phone) return { success: false, reason: 'no_template_or_phone' };
  return sendSMS(phone, templateFn(ref));
}

module.exports = { sendSMS, notifyBySMS };
