const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const pool    = require('../config/db');
const { notifyBySMS } = require('../services/sms');

// GET /api/admin/stats
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [users, cases, pending, overdue] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role != 'admin'"),
      pool.query("SELECT COUNT(*) FROM cases WHERE status NOT IN ('closed')"),
      pool.query("SELECT COUNT(*) FROM lawyer_profiles WHERE slba_verified = FALSE"),
      pool.query("SELECT COUNT(*) FROM cases WHERE sla_deadline < NOW() AND status NOT IN ('resolved','closed')"),
    ]);
    res.json({
      total_users:      parseInt(users.rows[0].count),
      active_cases:     parseInt(cases.rows[0].count),
      pending_lawyers:  parseInt(pending.rows[0].count),
      overdue_cases:    parseInt(overdue.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch stats' });
  }
});

// GET /api/admin/pending-lawyers
router.get('/pending-lawyers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.created_at,
              lp.slba_number, lp.specialisations, lp.id_card_url, lp.face_photo_url, lp.is_face_verified
       FROM users u
       JOIN lawyer_profiles lp ON lp.user_id = u.id
       WHERE u.role = 'lawyer' AND u.status = 'pending'
       ORDER BY u.created_at ASC`
    );
    res.json({ lawyers: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch pending lawyers' });
  }
});

// PATCH /api/admin/lawyers/:id/approve
router.patch('/lawyers/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query("UPDATE users SET status = 'active' WHERE id = $1 AND role = 'lawyer' RETURNING phone", [req.params.id]);
    await client.query("UPDATE lawyer_profiles SET slba_verified = TRUE, is_face_verified = TRUE WHERE user_id = $1", [req.params.id]);
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body)
       VALUES ($1, 'lawyer_approved', 'Account Approved', 'Your LexAid lawyer account has been verified and activated.')`,
      [req.params.id]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id) VALUES ($1, 'lawyer.approved', 'user', $2)`,
      [req.user.id, req.params.id]
    );
    await client.query('COMMIT');

    // SMS (non-blocking)
    if (u.rows[0]?.phone) notifyBySMS(u.rows[0].phone, 'lawyer_approved').catch(() => {});

    res.json({ message: 'Lawyer approved' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to approve lawyer' });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/lawyers/:id/reject
router.patch('/lawyers/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query("UPDATE users SET status = 'suspended' WHERE id = $1 AND role = 'lawyer' RETURNING phone", [req.params.id]);
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body)
       VALUES ($1, 'lawyer_rejected', 'Account Rejected', 'Your LexAid lawyer registration was not approved. Please contact support.')`,
      [req.params.id]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id) VALUES ($1, 'lawyer.rejected', 'user', $2)`,
      [req.user.id, req.params.id]
    );
    await client.query('COMMIT');

    // SMS (non-blocking)
    if (u.rows[0]?.phone) notifyBySMS(u.rows[0].phone, 'lawyer_rejected').catch(() => {});

    res.json({ message: 'Lawyer rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to reject lawyer' });
  } finally {
    client.release();
  }
});

// GET /api/admin/users
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  const { page = 1, limit = 20, role, status } = req.query;
  const offset = (page - 1) * limit;
  let q = 'SELECT id, full_name, email, role, status, created_at FROM users WHERE 1=1';
  const params = [];
  if (role)   { params.push(role);   q += ` AND role = $${params.length}`; }
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  params.push(limit, offset);
  q += ` ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`;
  try {
    const result = await pool.query(q, params);
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch users' });
  }
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = 'suspended' WHERE id = $1", [req.params.id]);
    await pool.query(`INSERT INTO audit_log (actor_id, action, target_type, target_id) VALUES ($1,'user.suspended','user',$2)`, [req.user.id, req.params.id]);
    res.json({ message: 'User suspended' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to suspend user' });
  }
});

// PATCH /api/admin/users/:id/reactivate
router.patch('/users/:id/reactivate', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = 'active' WHERE id = $1", [req.params.id]);
    await pool.query(`INSERT INTO audit_log (actor_id, action, target_type, target_id) VALUES ($1,'user.reactivated','user',$2)`, [req.user.id, req.params.id]);
    res.json({ message: 'User reactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reactivate user' });
  }
});

// GET /api/admin/overdue-cases
router.get('/overdue-cases', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ref, title, status, 
              EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS hours_since_creation
       FROM cases 
       WHERE sla_deadline < NOW() AND status NOT IN ('resolved','closed')
       ORDER BY sla_deadline ASC`
    );
    res.json({ cases: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch overdue cases' });
  }
});

// GET /api/admin/lang-stats
router.get('/lang-stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT preferred_lang, COUNT(*) FROM users GROUP BY preferred_lang`
    );
    res.json({ stats: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch language stats' });
  }
});

// GET /api/admin/active-lawyers (used by case assignment dropdown)
router.get('/active-lawyers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, lp.specialisations
       FROM users u
       JOIN lawyer_profiles lp ON lp.user_id = u.id
       WHERE u.role = 'lawyer' AND u.status = 'active' AND lp.slba_verified = TRUE
       ORDER BY u.full_name ASC`
    );
    res.json({ lawyers: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch active lawyers' });
  }
});

// GET /api/admin/all-lawyers (full lawyer directory with stats)
router.get('/all-lawyers', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
              lp.slba_number, lp.specialisations, lp.slba_verified, lp.is_face_verified,
              lp.avg_rating, lp.id_card_url, lp.face_photo_url,
              COUNT(c.id) FILTER (WHERE c.lawyer_id = u.id) AS total_cases,
              COUNT(c.id) FILTER (WHERE c.lawyer_id = u.id AND c.status IN ('resolved','closed')) AS resolved_cases
       FROM users u
       JOIN lawyer_profiles lp ON lp.user_id = u.id
       LEFT JOIN cases c ON c.lawyer_id = u.id
       WHERE u.role = 'lawyer'
       GROUP BY u.id, lp.id
       ORDER BY u.created_at DESC`
    );
    res.json({ lawyers: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch lawyers' });
  }
});

// PATCH /api/admin/cases/:id/assign
router.patch('/cases/:id/assign', authenticate, authorize('admin'), async (req, res) => {
  const { lawyer_id } = req.body;
  if (!lawyer_id) return res.status(400).json({ message: 'Lawyer ID is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if case exists
    const c = await client.query('SELECT ref, citizen_id FROM cases WHERE id = $1', [req.params.id]);
    if (!c.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Case not found' }); }

    // Update case
    await client.query(
      `UPDATE cases SET lawyer_id = $1, status = 'assigned', assigned_at = NOW()
       WHERE id = $2`,
      [lawyer_id, req.params.id]
    );

    // Notify lawyer
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, ref_case_id)
       VALUES ($1, 'case_assigned', 'New Case Assigned', $2, $3)`,
      [lawyer_id, `Administrator has assigned case ${c.rows[0].ref} to you.`, req.params.id]
    );

    // Notify citizen
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, ref_case_id)
       VALUES ($1, 'case_assigned', 'Lawyer Assigned', $2, $3)`,
      [c.rows[0].citizen_id, `A lawyer has been assigned to your case ${c.rows[0].ref} by an administrator.`, req.params.id]
    );

    await client.query('COMMIT');

    // SMS Notifications
    try {
      const [lawyer, citizen] = await Promise.all([
        pool.query('SELECT phone FROM users WHERE id = $1', [lawyer_id]),
        pool.query('SELECT phone FROM users WHERE id = $1', [c.rows[0].citizen_id]),
      ]);
      if (lawyer.rows[0]?.phone)  notifyBySMS(lawyer.rows[0].phone,  'case_assigned', c.rows[0].ref).catch(() => {});
      if (citizen.rows[0]?.phone) notifyBySMS(citizen.rows[0].phone, 'case_assigned', c.rows[0].ref).catch(() => {});
    } catch (e) {
      console.error('[Admin] SMS trigger failed:', e);
    }

    res.json({ message: 'Lawyer assigned successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to assign lawyer' });
  } finally {
    client.release();
  }
});

module.exports = router;
