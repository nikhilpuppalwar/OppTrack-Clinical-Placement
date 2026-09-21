const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const calendarSyncService = require('../services/calendarSync.service');

router.use(protect);

// @POST /api/calendar/sync-all
router.post('/sync-all', async (req, res) => {
  try {
    const result = await calendarSyncService.syncAllUserOpportunities(req.user._id);
    res.json({
      message: `Calendar sync completed: ${result.syncedCount} of ${result.total} opportunities synchronized.`,
      ...result,
    });
  } catch (err) {
    if (err.isGoogleAuthMissing) {
      return res.status(400).json({
        isGoogleAuthMissing: true,
        message: err.message,
      });
    }
    res.status(500).json({ message: err.message || 'Failed to sync calendar events.' });
  }
});

module.exports = router;
