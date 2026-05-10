const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getMyCases, getOpenCases, createCase, createValidation,
  getCaseById, acceptCase, resolveCase, getAllCases,
  closeCase, rateCase, rateValidation,
} = require('../controllers/caseController');

// Citizen
router.get  ('/my',              authenticate, authorize('citizen'),                        getMyCases);
router.post ('/',                authenticate, authorize('citizen'), createValidation,      createCase);
router.get  ('/:id',             authenticate,                                              getCaseById);
router.patch('/:id/close',       authenticate, authorize('citizen'),                       closeCase);
router.patch('/:id/rate',        authenticate, authorize('citizen'), rateValidation,       rateCase);

// Lawyer
router.get  ('/open',            authenticate, authorize('lawyer'),                         getOpenCases);
router.patch('/:id/accept',      authenticate, authorize('lawyer'),                         acceptCase);
router.patch('/:id/resolve',     authenticate, authorize('lawyer'),                         resolveCase);

// Admin
router.get  ('/',                authenticate, authorize('admin'),                          getAllCases);

module.exports = router;
