/**
 * AI-Assisted Features — Dual Provider (Gemini & OpenAI)
 * §4.8.1  AI Case Category Suggestion
 * §4.8.2  Plain Language Simplifier
 *
 * Prefers Google Gemini (Free Tier compatible) with OpenAI as fallback.
 */

const express = require('express');
const router  = express.Router();
const https   = require('https');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const OPENAI_API_KEY   = process.env.OPENAI_API_KEY;
const OPENAI_MODEL     = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

/** Wrapper for Google Gemini REST API */
function callGemini(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_AI_API_KEY) return reject(new Error('GOOGLE_AI_API_KEY not configured'));

    const payload = JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          parts: [{ text: userMessage }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.1
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path:     `/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || 'Gemini API error'));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

/** Unified AI call: Gemini first, OpenAI second */
async function callAI(system, user) {
  if (GOOGLE_AI_API_KEY) {
    try {
      return await callGemini(system, user);
    } catch (err) {
      console.warn('[AI] Gemini failed, attempting OpenAI...', err.message);
    }
  }
  return await callOpenAI(system, user);
}

// ── §4.8.1 POST /api/ai/suggest-category ─────────────────────────────────────
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
      const category = await callAI(system, description);
      const valid = ['land', 'labour', 'consumer', 'family', 'criminal', 'other'];
      const suggested = valid.includes(category.toLowerCase()) ? category.toLowerCase() : 'other';
      res.json({ suggested_category: suggested });
    } catch (err) {
      console.error('[AI:suggest-category]', err.message);
      res.json({ suggested_category: null, fallback: true });
    }
  }
);

// ── §4.8.2 POST /api/ai/simplify ─────────────────────────────────────────────
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
      const simplified = await callAI(system, text);
      res.json({ simplified });
    } catch (err) {
      console.error('[AI:simplify]', err.message);
      
      const isQuota = err.message.toLowerCase().includes('quota') || err.message.includes('429');
      const status = isQuota ? 429 : 503;
      const message = isQuota 
        ? 'AI Quota exceeded. Please check your API billing or limits.' 
        : 'AI simplification service is temporarily unavailable.';
        
      res.status(status).json({ message });
    }
  }
);

module.exports = router;
