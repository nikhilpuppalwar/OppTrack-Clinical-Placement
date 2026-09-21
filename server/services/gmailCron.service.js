/**
 * gmailCron.service.js
 * Background job that runs periodically (e.g. every 2 hours) to auto-fetch
 * placement emails from trusted senders for all opted-in users.
 */
const cron = require('node-cron');
const User = require('../models/User');
const gmailSyncService = require('./gmailSync.service');

let cronTask = null;

function startCronJob() {
  const schedule = process.env.CRON_INTERVAL_GMAIL || '0 */2 * * *'; // Every 2 hours by default

  cronTask = cron.schedule(schedule, async () => {
    console.log(`[Gmail Cron] Starting background Gmail sync at ${new Date().toISOString()}`);
    try {
      const users = await User.find({
        'googleAuth.gmailSyncEnabled': true,
        'googleAuth.refreshToken': { $exists: true, $ne: null },
      });

      console.log(`[Gmail Cron] Found ${users.length} user(s) with Gmail sync enabled.`);

      for (const user of users) {
        try {
          const result = await gmailSyncService.syncUserGmail(user._id);
          console.log(`[Gmail Cron] Synced for user ${user.email}:`, result.message);
        } catch (err) {
          console.error(`[Gmail Cron] Sync failed for user ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Gmail Cron] Fatal error in Gmail sync cron:', err);
    }
  });

  console.log(`Gmail sync cron job scheduled (${schedule})`);
}

function stopCronJob() {
  if (cronTask) {
    cronTask.stop();
    console.log('Gmail sync cron job stopped');
  }
}

module.exports = {
  startCronJob,
  stopCronJob,
};
