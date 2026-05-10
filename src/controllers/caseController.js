const pool   = require('../config/db');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { notifyBySMS } = require('../services/sms');

// Generate case reference: LX-YYYY-NNNN
async function generateRef() {
  const year = new Date().getFullYear();
  const res  = await pool.query("SELECT COUNT(*) FROM cases WHERE ref LIKE $1", [`LX-${year}-%`]);
  const seq  = String(parseInt(res.rows[0].count) + 1).padStart(4, '0');
  return `LX-${year}-${seq}`;
}

// ── GET /api/cases/my ──────────────────────────────────────────
async function getMyCases(req, res) {
  try {
    const isLawyer = req.user.role === 'lawyer';
    const query = isLawyer 
      ? `SELECT c.id, c.ref, c.title, c.category, c.status, c.created_at, c.updated_at,
                u.full_name AS citizen_name
         FROM cases c
         JOIN users u ON u.id = c.citizen_id
         WHERE c.lawyer_id = $1
         ORDER BY c.updated_at DESC`
      : `SELECT c.id, c.ref, c.title, c.category, c.status, c.created_at, c.updated_at,
                u.full_name AS lawyer_name
         FROM cases c
         LEFT JOIN users u ON u.id = c.lawyer_id
         WHERE c.citizen_id = $1
         ORDER BY c.created_at DESC`;

    const result = await pool.query(query, [req.user.id]);
    res.json({ cases: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch cases' });
  }
}

// ── GET /api/cases/open (lawyer) ───────────────────────────────
async function getOpenCases(req, res) {
  const { category, search } = req.query;
  let query = `SELECT c.id, c.ref, c.title, c.category, c.status, c.description, c.created_at
               FROM cases c
               WHERE c.status IN ('submitted', 'under_review') AND c.lawyer_id IS NULL`;
  const params = [];

  if (category) { params.push(category); query += ` AND c.category = $${params.length}`; }
  if (search)   { params.push(`%${search}%`); query += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`; }

  query += ' ORDER BY c.created_at ASC';

  try {
    const result = await pool.query(query, params);
    res.json({ cases: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch open cases' });
  }
}

// ── POST /api/cases ────────────────────────────────────────────
const createValidation = [
  body('title').trim().notEmpty().isLength({ min: 10, max: 300 }),
  body('description').trim().notEmpty().isLength({ min: 50 }),
  body('category').isIn(['land','labour','consumer','family','criminal','other']),
];

async function createCase(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { title, description, category } = req.body;
  const ref = await generateRef();
  // SLA = 72 hours from submission
  const sla_deadline = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO cases (ref, citizen_id, category, title, description, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, ref, title, category, status, created_at`,
      [ref, req.user.id, category, title, description, sla_deadline]
    );
    const newCase = result.rows[0];

    // Handle uploaded documents
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await client.query(
          `INSERT INTO case_documents (case_id, filename, storage_key, mime_type, size_bytes, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newCase.id, file.originalname, file.filename, file.mimetype, file.size, req.user.id]
        );
      }
    }

    // Create in-app notification for citizen
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, ref_case_id)
       VALUES ($1, 'case_submitted', $2, $3, $4)`,
      [req.user.id, `Case submitted: ${ref}`, `Your case "${title}" has been submitted and is under review.`, newCase.id]
    );

    await client.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, ip_address)
       VALUES ($1, 'case.created', 'case', $2, $3)`,
      [req.user.id, newCase.id, req.ip]
    );

    await client.query('COMMIT');

    // SMS notification (non-blocking)
    const userRow = await pool.query('SELECT phone FROM users WHERE id = $1', [req.user.id]);
    if (userRow.rows[0]?.phone) notifyBySMS(userRow.rows[0].phone, 'case_submitted', ref).catch(() => {});

    res.status(201).json({ case: newCase });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create case error:', err);
    res.status(500).json({ message: 'Failed to submit case' });
  } finally {
    client.release();
  }
}

// ── GET /api/cases/:id ─────────────────────────────────────────
async function getCaseById(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name AS citizen_name, l.full_name AS lawyer_name
       FROM cases c
       JOIN users u ON u.id = c.citizen_id
       LEFT JOIN users l ON l.id = c.lawyer_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    const c = result.rows[0];
    if (!c) return res.status(404).json({ message: 'Case not found' });

    // Access control: citizen can only see their own cases, lawyers only assigned
    if (req.user.role === 'citizen' && c.citizen_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'lawyer' && c.lawyer_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ case: c });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch case' });
  }
}

// ── PATCH /api/cases/:id/accept (lawyer) ──────────────────────
async function acceptCase(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const c = await client.query(
      `SELECT c.*, u.phone AS citizen_phone FROM cases c
       JOIN users u ON u.id = c.citizen_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!c.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Case not found' }); }
    if (c.rows[0].lawyer_id) { await client.query('ROLLBACK'); return res.status(409).json({ message: 'Case already accepted by another lawyer' }); }

    await client.query(
      `UPDATE cases SET lawyer_id = $1, status = 'assigned', assigned_at = NOW()
       WHERE id = $2`,
      [req.user.id, req.params.id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, ref_case_id)
       VALUES ($1, 'case_assigned', 'Case Assigned', $2, $3)`,
      [c.rows[0].citizen_id, `A lawyer has been assigned to your case ${c.rows[0].ref}.`, req.params.id]
    );

    await client.query('COMMIT');

    // SMS (non-blocking)
    if (c.rows[0].citizen_phone) notifyBySMS(c.rows[0].citizen_phone, 'case_assigned', c.rows[0].ref).catch(() => {});

    res.json({ message: 'Case accepted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to accept case' });
  } finally {
    client.release();
  }
}

// ── PATCH /api/cases/:id/resolve (lawyer) ─────────────────────
async function resolveCase(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE cases SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1 AND lawyer_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Case not found or not assigned to you' });
    }
    const caseRow = result.rows[0];

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, ref_case_id)
       VALUES ($1, 'case_resolved', 'Case Resolved', $2, $3)`,
      [caseRow.citizen_id, `Your case ${caseRow.ref} has been marked as resolved. Please log in to rate your experience.`, req.params.id]
    );

    await client.query('COMMIT');

    // SMS to citizen (non-blocking)
    const citizenRow = await pool.query('SELECT phone FROM users WHERE id = $1', [caseRow.citizen_id]);
    if (citizenRow.rows[0]?.phone) notifyBySMS(citizenRow.rows[0].phone, 'case_resolved', caseRow.ref).catch(() => {});

    res.json({ message: 'Case resolved' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to resolve case' });
  } finally {
    client.release();
  }
}

// ── GET /api/cases (admin) ─────────────────────────────────────
async function getAllCases(req, res) {
  const { status, category, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let query = `SELECT c.id, c.ref, c.title, c.category, c.status, c.created_at,
                      u.full_name AS citizen_name, l.full_name AS lawyer_name
               FROM cases c
               JOIN users u ON u.id = c.citizen_id
               LEFT JOIN users l ON l.id = c.lawyer_id
               WHERE 1=1`;
  const params = [];
  if (status)   { params.push(status);   query += ` AND c.status = $${params.length}`; }
  if (category) { params.push(category); query += ` AND c.category = $${params.length}`; }
  params.push(limit, offset);
  query += ` ORDER BY c.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  try {
    const result = await pool.query(query, params);
    res.json({ cases: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch cases' });
  }
}

// ── PATCH /api/cases/:id/close (citizen) ──────────────────────
// Citizen closes a resolved case, optionally providing a rating (1–5)
async function closeCase(req, res) {
  try {
    const c = await pool.query('SELECT * FROM cases WHERE id = $1 AND citizen_id = $2', [req.params.id, req.user.id]);
    if (!c.rows[0]) return res.status(404).json({ message: 'Case not found' });
    if (c.rows[0].status !== 'resolved') {
      return res.status(409).json({ message: 'Only resolved cases can be closed' });
    }

    const result = await pool.query(
      `UPDATE cases SET status = 'closed', closed_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id)
       VALUES ($1, 'case.closed', 'case', $2)`,
      [req.user.id, req.params.id]
    );

    res.json({ message: 'Case closed', case: result.rows[0] });
  } catch (err) {
    console.error('Close case error:', err);
    res.status(500).json({ message: 'Failed to close case' });
  }
}

// ── PATCH /api/cases/:id/rate (citizen) ───────────────────────
// Citizen rates the lawyer's assistance after case is resolved/closed
const rateValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('comment').optional().trim().isLength({ max: 1000 }),
];

async function rateCase(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { rating, comment } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const c = await client.query(
      `SELECT * FROM cases WHERE id = $1 AND citizen_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!c.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Case not found' }); }
    if (!['resolved', 'closed'].includes(c.rows[0].status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Can only rate resolved or closed cases' });
    }
    if (c.rows[0].rating) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Case already rated' });
    }

    await client.query(
      `UPDATE cases SET rating = $1, rating_comment = $2 WHERE id = $3`,
      [rating, comment || null, req.params.id]
    );

    // Update lawyer profile aggregate stats
    if (c.rows[0].lawyer_id) {
      await client.query(
        `UPDATE lawyer_profiles
         SET avg_rating = (
           SELECT AVG(rating) FROM cases
           WHERE lawyer_id = $1 AND rating IS NOT NULL
         )
         WHERE user_id = $1`,
        [c.rows[0].lawyer_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Rating submitted. Thank you.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rate case error:', err);
    res.status(500).json({ message: 'Failed to submit rating' });
  } finally {
    client.release();
  }
}

module.exports = { getMyCases, getOpenCases, createCase, createValidation, getCaseById, acceptCase, resolveCase, getAllCases, closeCase, rateCase, rateValidation };
