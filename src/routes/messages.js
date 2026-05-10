const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const pool    = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET /api/messages/:caseId
router.get('/:caseId', authenticate, async (req, res) => {
  try {
    // Verify access
    const c = await pool.query('SELECT citizen_id, lawyer_id FROM cases WHERE id = $1', [req.params.caseId]);
    if (!c.rows[0]) return res.status(404).json({ message: 'Case not found' });
    const { citizen_id, lawyer_id } = c.rows[0];
    if (req.user.role === 'citizen' && citizen_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    if (req.user.role === 'lawyer'  && lawyer_id  !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    const msgs = await pool.query(
      `SELECT m.id, m.body, m.created_at, m.is_read,
              u.id AS sender_id, u.full_name AS sender_name, u.role AS sender_role
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.case_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.caseId]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE case_id = $1 AND sender_id != $2 AND is_read = FALSE`,
      [req.params.caseId, req.user.id]
    );

    res.json({ messages: msgs.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch messages' });
  }
});

// POST /api/messages/:caseId
router.post('/:caseId',
  authenticate,
  [body('body').trim().notEmpty().isLength({ max: 5000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Message body required' });

    try {
      const c = await pool.query('SELECT citizen_id, lawyer_id, status, ref FROM cases WHERE id = $1', [req.params.caseId]);
      if (!c.rows[0]) return res.status(404).json({ message: 'Case not found' });
      const { citizen_id, lawyer_id, status, ref } = c.rows[0];
      if (status === 'closed') return res.status(409).json({ message: 'Cannot message on a closed case' });
      if (req.user.role === 'citizen' && citizen_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });
      if (req.user.role === 'lawyer'  && lawyer_id  !== req.user.id) return res.status(403).json({ message: 'Access denied' });

      const result = await pool.query(
        `INSERT INTO messages (case_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, body, created_at`,
        [req.params.caseId, req.user.id, req.body.body]
      );

      // Update case status to in_progress if assigned
      if (status === 'assigned') {
        await pool.query(`UPDATE cases SET status = 'in_progress' WHERE id = $1`, [req.params.caseId]);
      }

      // Notify recipient
      const recipientId = req.user.role === 'citizen' ? lawyer_id : citizen_id;
      if (recipientId) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, body, ref_case_id)
           VALUES ($1, 'new_message', $2, $3, $4)`,
          [recipientId, `New message on case ${ref}`, `${req.user.full_name} sent a message on case ${ref}.`, req.params.caseId]
        );
      }

      res.status(201).json({ message: result.rows[0] });
    } catch (err) {
      res.status(500).json({ message: 'Failed to send message' });
    }
  }
);

module.exports = router;
