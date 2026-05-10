/**
 * Notifications Route — §4.5 Notification and Communication Layer
 * Handles in-app notification retrieval and read-marking.
 * SMS delivery is triggered from case/message/admin routes via the SMS service.
 */

const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const pool    = require('../config/db');

// GET /api/notifications — fetch user's notifications (paginated, unread first)
router.get('/', authenticate, async (req, res) => {
  const { page = 1, limit = 30, unread_only } = req.query;
  const offset = (page - 1) * limit;

  let q = `SELECT id, type, title, body, is_read, ref_case_id, created_at
           FROM notifications
           WHERE user_id = $1`;
  const params = [req.user.id];

  if (unread_only === 'true') {
    q += ` AND is_read = FALSE`;
  }

  params.push(limit, offset);
  q += ` ORDER BY is_read ASC, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  try {
    const result = await pool.query(q, params);
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({
      notifications:  result.rows,
      unread_count:   parseInt(countRes.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update notification' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update notifications' });
  }
});

module.exports = router;
