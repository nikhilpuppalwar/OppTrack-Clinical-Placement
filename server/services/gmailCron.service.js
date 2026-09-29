/**
 * gmailCron.service.js
 * Background job that runs periodically (every 2 hours by default) to auto-fetch
 * placement emails from trusted senders for all opted-in users.
 * Runs concurrently in batches of 5 to avoid blocking on slow Gmail API calls.
 */
const cron = require('node-cron');
const User = require('../models/User');
const gmailSyncService = require('./gmailSync.service');

let cronTask = null;

/**
 * Processes a batch of users concurrently using Promise.allSettled
 * @param {Array} users
 */
async function syncBatch(users) {
  const results = await Promise.allSettled(
    users.map(async (user) => {
      const result = await gmailSyncService.syncUserGmail(user._id);
      console.log(`[Gmail Cron] Synced for user ${user.email}:`, result.message);
      return result;
    })
  );

  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.error(`[Gmail Cron] Sync failed for user ${users[idx].email}:`, result.reason?.message || result.reason);
    }
  });
}

function startCronJob() {
  const schedule = process.env.CRON_INTERVAL_GMAIL || '0 */2 * * *'; // Every 2 hours by default
  const BATCH_SIZE = 5; // Max concurrent Gmail syncs

  cronTask = cron.schedule(schedule, async () => {
    console.log(`[Gmail Cron] Starting background Gmail sync at ${new Date().toISOString()}`);
    try {
      const users = await User.find({
        'googleAuth.gmailSyncEnabled': true,
        'googleAuth.refreshToken': { $exists: true, $ne: null },
        'googleAuth.tokenExpired': { $ne: true }, // Skip users with expired tokens
      }).select('_id email googleAuth');

      console.log(`[Gmail Cron] Found ${users.length} user(s) with Gmail sync enabled.`);

      // Process in batches of BATCH_SIZE to avoid hammering Gmail API
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        await syncBatch(batch);
      }

      console.log(`[Gmail Cron] All batches complete.`);
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

