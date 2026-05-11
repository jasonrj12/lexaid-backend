const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool      = require('../config/db');
const crypto    = require('crypto');
const { sendSMS } = require('../services/sms');

// ── In-memory OTP store ───────────────────────────────────────
// Map<normalizedPhone, { otp, expiresAt, attempts }>
const otpStore = new Map();
const OTP_TTL_MS     = 10 * 60 * 1000;  // 10 minutes
const OTP_MAX_TRIES  = 5;

// ── NIC format validation ─────────────────────────────────────
const NIC_REGEX = /^(\d{9}[VXvx]|\d{12})$/;

function encryptNIC(nic) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let enc = cipher.update(nic, 'utf8', 'hex');
  enc += cipher.final('hex');
  return iv.toString('hex') + ':' + enc;
}

function decryptNIC(encrypted) {
  try {
    const [ivHex, enc] = encrypted.split(':');
    const key  = Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32).slice(0, 32));
    const iv   = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let dec = decipher.update(enc, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch { return null; }
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── Normalize +94 phone ───────────────────────────────────────
function normalizePhone(raw) {
  let p = (raw || '').replace(/\s+/g, '');
  if (p.startsWith('0'))       p = '+94' + p.slice(1);
  else if (!p.startsWith('+')) p = '+94' + p;
  return p;
}

// ── REGISTER ──────────────────────────────────────────────────
const registerValidation = [
  body('full_name').trim().notEmpty().isLength({ min: 2, max: 200 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('nic').matches(NIC_REGEX).withMessage('Invalid NIC format'),
  body('role').isIn(['citizen', 'lawyer']),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .trim()
    .custom((val) => {
      // Accept 10-digit local number (07XXXXXXXX) or full +94 format
      const digits = val.replace(/[\s+]/g, '').replace(/^94/, '');
      if (!/^0?\d{9}$/.test(digits) && !/^\+94\d{9}$/.test(val.replace(/\s/g,''))) {
        throw new Error('Phone must be a valid Sri Lankan 10-digit number (07XXXXXXXX)');
      }
      return true;
    }),
  body('slba_number').if(body('role').equals('lawyer')).notEmpty().withMessage('SLBA number required for lawyers'),
];

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { full_name, email, password, nic, role, phone, slba_number, specialisations } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicate email
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const nic_encrypted = encryptNIC(nic.toUpperCase());

    // Lawyer accounts start as 'pending' until admin verifies SLBA
    const status = role === 'lawyer' ? 'pending' : 'active';

    const result = await client.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, status, nic_encrypted)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, role, status, created_at`,
      [full_name, email, password_hash, phone, role, status, nic_encrypted]
    );
    const user = result.rows[0];

    if (role === 'lawyer') {
      const { uploadToSupabase } = require('../services/supabase');
      
      let idCardUrl = req.files && req.files['id_card'] ? `/uploads/${req.files['id_card'][0].filename}` : null;
      let facePhotoUrl = req.files && req.files['face_photo'] ? `/uploads/${req.files['face_photo'][0].filename}` : null;

      // Try Supabase Upload
      if (req.files && req.files['id_card']) {
        const supUrl = await uploadToSupabase(req.files['id_card'][0], 'id_cards');
        if (supUrl) idCardUrl = supUrl;
      }
      if (req.files && req.files['face_photo']) {
        const supUrl = await uploadToSupabase(req.files['face_photo'][0], 'selfies');
        if (supUrl) facePhotoUrl = supUrl;
      }

      await client.query(
        `INSERT INTO lawyer_profiles (user_id, slba_number, specialisations, id_card_url, face_photo_url, is_face_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, slba_number, specialisations || [], idCardUrl, facePhotoUrl, false]
      );
    }

    // Audit log — non-fatal
    try {
      const ip = (req.ip || '').replace('::ffff:', '') || null;
      await client.query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id, ip_address)
         VALUES ($1, 'user.registered', 'user', $2, $3)`,
        [user.id, user.id, ip]
      );
    } catch (auditErr) {
      console.warn('Audit log skipped:', auditErr.message);
    }

    await client.query('COMMIT');

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, status: user.status } });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  } finally {
    client.release();
  }
}

// ── SEND OTP ──────────────────────────────────────────────────
const sendOtpValidation = [
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .trim()
    .custom((val) => {
      const clean = val.replace(/[\s+]/g, '');
      // Allow 07XXXXXXXX (10 digits) or already-normalised 94XXXXXXXXX (11 digits)
      if (!/^(0\d{9}|94\d{9})$/.test(clean)) {
        throw new Error('Enter a valid 10-digit Sri Lankan phone number (e.g. 0771234567)');
      }
      return true;
    }),
];

async function sendOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const phone = normalizePhone(req.body.phone);

  // Rate-limit: prevent spam — max 1 OTP every 60 s for same number
  const existing = otpStore.get(phone);
  if (existing && (Date.now() < existing.expiresAt - OTP_TTL_MS + 60_000)) {
    return res.status(429).json({ message: 'Please wait 60 seconds before requesting a new OTP.' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

  const smsResult = await sendSMS(phone, `LexAid: Your verification code is ${otp}. Valid for 10 minutes. Do not share this code.`);

  if (!smsResult.success) {
    // If SMS disabled/failed in dev, still return success but log otp for testing
    console.warn('[OTP] SMS not delivered — OTP for testing:', otp, '| reason:', smsResult.reason || smsResult.error);
  }

  res.json({
    success: true,
    message: 'OTP sent to your phone number.',
    // Only expose OTP in non-production when SMS is disabled (dev convenience)
    ...(process.env.NODE_ENV !== 'production' && !smsResult.success ? { dev_otp: otp } : {}),
  });
}

// ── VERIFY OTP ────────────────────────────────────────────────
const verifyOtpValidation = [
  body('phone').notEmpty().trim(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
];

async function verifyOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const phone = normalizePhone(req.body.phone);
  const { otp } = req.body;

  const record = otpStore.get(phone);
  if (!record) {
    return res.status(400).json({ message: 'No OTP found for this number. Please request a new one.' });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }
  if (record.attempts >= OTP_MAX_TRIES) {
    otpStore.delete(phone);
    return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
  }

  if (record.otp !== otp) {
    record.attempts += 1;
    return res.status(400).json({ message: `Incorrect OTP. ${OTP_MAX_TRIES - record.attempts} attempt(s) remaining.` });
  }

  // Mark as verified — keep in store briefly so registration can consume it
  record.verified = true;
  res.json({ success: true, message: 'Phone number verified successfully.' });
}

// ── LOGIN ─────────────────────────────────────────────────────
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input' });

  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, role, status FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const token = signToken(user);

    // Audit log — non-fatal: a malformed IP must not break login
    try {
      const ip = (req.ip || '').replace('::ffff:', '') || null;
      await pool.query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id, ip_address)
         VALUES ($1, 'user.login', 'user', $2, $3)`,
        [user.id, user.id, ip]
      );
    } catch (auditErr) {
      console.warn('Audit log skipped:', auditErr.message);
    }

    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, status: user.status } });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
}

// ── ME ────────────────────────────────────────────────────────
async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, status, phone, preferred_lang, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch profile' });
  }
}

module.exports = { register, registerValidation, login, loginValidation, me, sendOtp, sendOtpValidation, verifyOtp, verifyOtpValidation };
