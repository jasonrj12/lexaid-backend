const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getMyCases, getOpenCases, createCase, createValidation,
  getCaseById, acceptCase, resolveCase, getAllCases,
  closeCase, rateCase, rateValidation,
} = require('../controllers/caseController');

// ── Special Routes ──────────────────────────────────────────────────────────
// These MUST come before /:id otherwise 'open' or 'my' will be treated as an ID
router.get  ('/my',              authenticate, authorize('citizen', 'lawyer'),              getMyCases);
router.get  ('/open',            authenticate, authorize('lawyer'),                         getOpenCases);
router.get  ('/',                authenticate, authorize('admin'),                          getAllCases);

// ── Generic Routes ──────────────────────────────────────────────────────────
router.post ('/',                authenticate, authorize('citizen'), upload.array('documents', 5), createValidation, createCase);

// ── ID-Specific Routes ──────────────────────────────────────────────────────
router.get  ('/:id',             authenticate,                                              getCaseById);
router.patch('/:id/close',       authenticate, authorize('citizen'),                       closeCase);
router.patch('/:id/rate',        authenticate, authorize('citizen'), rateValidation,       rateCase);
router.patch('/:id/accept',      authenticate, authorize('lawyer'),                         acceptCase);
router.patch('/:id/resolve',     authenticate, authorize('lawyer'),                         resolveCase);

module.exports = router;
