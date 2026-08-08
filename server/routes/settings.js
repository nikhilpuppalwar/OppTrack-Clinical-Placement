const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, testEmail, testAiKey, exportData } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getSettings).put(protect, updateSettings);
router.post('/test-email', protect, testEmail);
router.post('/test-ai', protect, testAiKey);
router.get('/export', protect, exportData);

module.exports = router;
