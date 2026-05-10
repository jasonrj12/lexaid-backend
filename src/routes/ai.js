/**
 * AI-Assisted Features — OpenAI Chat Completions API
 * §4.8.1  AI Case Category Suggestion
 * §4.8.2  Plain Language Simplifier
 *
 * Both features use a single lightweight prompt-and-response with no
 * persistent state, integrated via the OpenAI Chat Completions REST API.
 */

const express = require('express');
const router  = express.Router();
const https   = require('https');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL   = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/** Thin wrapper around the OpenAI Chat Completions REST API */
function callOpenAI(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key') {
      return reject(new Error('OPENAI_API_KEY not configured'));
    }

    const payload = JSON.stringify({
      model:      OPENAI_MODEL,
      max_tokens: 512,
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: userMessage  },
      ],
    });

    const options = {
      hostname: 'api.openai.com',
      path:     '/v1/chat/completions',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || 'OpenAI API error'));
          const text = json.choices?.[0]?.message?.content || '';
          resolve(text.trim());
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── §4.8.1 POST /api/ai/suggest-category ─────────────────────────────────────
// Given a free-text description, return the most appropriate legal category.
// Called during case submission (citizen portal).
router.post(
  '/suggest-category',
  authenticate,
  [body('description').trim().notEmpty().isLength({ min: 20, max: 2000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { description } = req.body;

    const system = `You are a legal categorisation assistant for LexAid, a Sri Lankan legal aid platform.
Given a citizen's description of their legal issue, classify it into EXACTLY ONE of these categories:
- land       (Land & Property disputes, boundary issues, deed problems, eviction, tenancy)
- labour     (Employment, wrongful termination, unpaid wages, workplace rights)
- consumer   (Consumer rights, product defects, online fraud, refund disputes)
- family     (Divorce, custody, inheritance, maintenance, domestic issues)
- criminal   (Criminal guidance, bail information, FIR, police-related non-representation matters)
- other      (Any civil matter not fitting the above)

Respond with ONLY the category key (one of: land, labour, consumer, family, criminal, other).
Do NOT include any explanation, punctuation, or extra text.`;

    try {
      const category = await callOpenAI(system, description);
      const valid = ['land', 'labour', 'consumer', 'family', 'criminal', 'other'];
      const suggested = valid.includes(category.toLowerCase()) ? category.toLowerCase() : 'other';
      res.json({ suggested_category: suggested });
    } catch (err) {
      console.error('[AI:suggest-category]', err.message);
      // Graceful fallback — citizen selects manually
      res.json({ suggested_category: null, fallback: true });
    }
  }
);

// ── §4.8.2 POST /api/ai/simplify ─────────────────────────────────────────────
// Given a lawyer's response text (and an optional language), return a
// plain-language paraphrase for the citizen.
router.post(
  '/simplify',
  authenticate,
  [
    body('text').trim().notEmpty().isLength({ min: 1, max: 10000 }),
    body('lang').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    let { text, lang = 'en' } = req.body;
    // Normalize lang (e.g. 'en-US' -> 'en')
    lang = String(lang).slice(0, 2).toLowerCase();
    if (!['en', 'si', 'ta'].includes(lang)) lang = 'en';

    const langName = { en: 'English', si: 'Sinhala', ta: 'Tamil' }[lang];

    const system = `You are a plain-language simplification assistant for LexAid, a Sri Lankan legal aid platform.
Your task is to rewrite the following legal guidance in simple, clear, everyday ${langName} that a person with no legal background can understand.

Rules:
- Use short sentences and common words. Avoid legal jargon unless absolutely necessary — if you must use a legal term, explain it in plain language immediately after.
- Do NOT change the meaning, omit any important legal point, or add new information.
- Preserve the key advice and any action steps the person should take.
- Write in ${langName} only.
- Do NOT include a preamble like "Here is the simplified version:" — just output the simplified text directly.

IMPORTANT DISCLAIMER: Include at the end, on a new line: "[AI-simplified paraphrase. The original lawyer response remains the authoritative guidance.]"`;

    try {
      const simplified = await callOpenAI(system, text);
      res.json({ simplified });
    } catch (err) {
      console.error('[AI:simplify]', err.message);
      res.status(503).json({ message: 'AI simplification service is temporarily unavailable. Please read the original response.' });
    }
  }
);

module.exports = router;
