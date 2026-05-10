const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const pool    = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET /api/library — published articles
router.get('/', async (req, res) => {
  const { category, search, lang = 'en' } = req.query;
  let q = `SELECT id, slug, category, read_time_mins, published_at,
                  COALESCE(title_${['en','si','ta'].includes(lang) ? lang : 'en'}, title_en) AS title,
                  COALESCE(summary_en) AS summary,
                  u.full_name AS author
           FROM library_articles la
           JOIN users u ON u.id = la.author_id
           WHERE la.status = 'published'`;
  const params = [];
  if (category) { params.push(category); q += ` AND la.category = $${params.length}`; }
  if (search)   { params.push(`%${search}%`); q += ` AND (la.title_en ILIKE $${params.length} OR la.summary_en ILIKE $${params.length})`; }
  q += ' ORDER BY la.published_at DESC';
  try {
    const result = await pool.query(q, params);
    res.json({ articles: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch articles' });
  }
});

// GET /api/library/:slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT la.*, u.full_name AS author
       FROM library_articles la
       JOIN users u ON u.id = la.author_id
       WHERE la.slug = $1 AND la.status = 'published'`,
      [req.params.slug]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Article not found' });
    res.json({ article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch article' });
  }
});

// POST /api/library — lawyer submits article
router.post('/',
  authenticate,
  authorize('lawyer'),
  [
    body('title_en').trim().notEmpty(),
    body('body_en').trim().notEmpty().isLength({ min: 200 }),
    body('category').isIn(['land','labour','consumer','family','criminal','other']),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { slug, category, title_en, title_si, title_ta, body_en, body_si, body_ta, summary_en, read_time_mins } = req.body;
    try {
      const exists = await pool.query('SELECT id FROM library_articles WHERE slug = $1', [slug]);
      if (exists.rows[0]) return res.status(409).json({ message: 'Slug already exists' });

      const result = await pool.query(
        `INSERT INTO library_articles (slug, author_id, category, title_en, title_si, title_ta, body_en, body_si, body_ta, summary_en, read_time_mins, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending_review')
         RETURNING id, slug, title_en, status`,
        [slug, req.user.id, category, title_en, title_si, title_ta, body_en, body_si, body_ta, summary_en, read_time_mins]
      );
      res.status(201).json({ article: result.rows[0] });
    } catch (err) {
      res.status(500).json({ message: 'Failed to submit article' });
    }
  }
);

// PATCH /api/library/:id/publish (admin)
router.patch('/:id/publish', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query(
      `UPDATE library_articles SET status = 'published', published_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Article published' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish article' });
  }
});

module.exports = router;
