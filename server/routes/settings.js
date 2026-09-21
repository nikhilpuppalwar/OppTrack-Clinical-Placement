const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  testEmail,
  testAiKey,
  testNotification,
  getUpcomingReminders,
  exportData,
  exportCsv,
  importBackup,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getSettings).put(protect, updateSettings);
router.post('/test-email', protect, testEmail);
router.post('/test-ai', protect, testAiKey);
router.post('/test-notification', protect, testNotification);
router.get('/upcoming-reminders', protect, getUpcomingReminders);
router.get('/export', protect, exportData);
router.get('/export-csv', protect, exportCsv);
router.post('/import-backup', protect, importBackup);

module.exports = router;
