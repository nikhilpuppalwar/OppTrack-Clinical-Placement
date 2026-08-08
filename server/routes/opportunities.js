const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getOpportunities,
  createOpportunity,
  getOpportunity,
  updateOpportunity,
  deleteOpportunity,
  updateStatus,
  extractFromEmail,
  aiUpdateOpportunity,
  getDashboardStats,
} = require('../controllers/opportunityController');
const { protect } = require('../middleware/auth');

// Rate limit AI extraction endpoint
const extractLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: 'Too many extract requests, slow down.' });

router.get('/stats', protect, getDashboardStats);
router.post('/extract', protect, extractLimiter, extractFromEmail);
router.post('/:id/ai-update', protect, extractLimiter, aiUpdateOpportunity);

router.route('/').get(protect, getOpportunities).post(protect, createOpportunity);
router.route('/:id').get(protect, getOpportunity).put(protect, updateOpportunity).delete(protect, deleteOpportunity);
router.patch('/:id/status', protect, updateStatus);

module.exports = router;
