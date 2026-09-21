const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTrustedSenders,
  addTrustedSender,
  deleteTrustedSender,
  syncGmail,
  getPendingReview,
  getAutoUpdates,
  reExtractPending,
  confirmPending,
  ignorePending,
} = require('../controllers/gmailController');

// All Gmail endpoints require user authentication
router.use(protect);

// Trusted senders
router.get('/senders', getTrustedSenders);
router.post('/senders', addTrustedSender);
router.delete('/senders/:id', deleteTrustedSender);

// Gmail sync trigger
router.post('/sync', syncGmail);

// Pending review queue & Auto updates
router.get('/pending-review', getPendingReview);
router.get('/auto-updates', getAutoUpdates);
router.post('/pending-review/:id/re-extract', reExtractPending);
router.post('/pending-review/:id/confirm', confirmPending);
router.post('/pending-review/:id/ignore', ignorePending);

module.exports = router;
