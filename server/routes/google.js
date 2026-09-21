const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  updateSettings,
} = require('../controllers/googleController');

// Public OAuth callback from Google consent screen
router.get('/callback', handleCallback);

// Protected routes
router.get('/auth-url', protect, getAuthUrl);
router.get('/status', protect, getStatus);
router.post('/disconnect', protect, disconnect);
router.patch('/settings', protect, updateSettings);

module.exports = router;
