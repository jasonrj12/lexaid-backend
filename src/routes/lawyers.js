const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const pool    = require('../config/db');

// GET /api/lawyers (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.status,
              lp.slba_number, lp.slba_verified, lp.specialisations,
              lp.cases_handled, lp.avg_rating, lp.avg_response_hrs
       FROM users u
       JOIN lawyer_profiles lp ON lp.user_id = u.id
       WHERE u.role = 'lawyer'
       ORDER BY u.created_at DESC`
    );
    res.json({ lawyers: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch lawyers' });
  }
});

// GET /api/lawyers/profile (own profile)
router.get('/profile', authenticate, authorize('lawyer'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status,
              lp.slba_number, lp.slba_verified, lp.specialisations,
              lp.bio, lp.cases_handled, lp.avg_rating, lp.avg_response_hrs
       FROM users u
       JOIN lawyer_profiles lp ON lp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Profile not found' });
    res.json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch profile' });
  }
});

module.exports = router;
