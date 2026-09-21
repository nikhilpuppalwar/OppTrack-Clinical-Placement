/**
 * gmailSync.service.js
 * Automatically fetches placement and internship notification emails strictly from trusted senders,
 * decodes and cleans the email text, passes it through the AI extraction pipeline,
 * and saves into the GmailSyncLog review queue.
 */
const { google } = require('googleapis');
const User = require('../models/User');
const Profile = require('../models/Profile');
const TrustedSender = require('../models/TrustedSender');
const GmailSyncLog = require('../models/GmailSyncLog');
const Opportunity = require('../models/Opportunity');
const ActivityLog = require('../models/ActivityLog');
const Reminder = require('../models/Reminder');
const googleAuthService = require('./googleAuth.service');
const aiService = require('./aiExtraction.service');
const duplicateService = require('./duplicate.service');
const eligibilityService = require('./eligibility.service');
const calendarSyncService = require('./calendarSync.service');
const reminderService = require('./reminder.service');

/**
 * Strips HTML tags and normalizes entities to plain text
 */
function cleanHtml(html = '') {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Recursively extracts plain text or HTML body from a Gmail payload
 */
function extractBodyFromPayload(payload) {
  let plainText = '';
  let htmlText = '';

  function walk(part) {
    if (!part) return;

    if (part.mimeType === 'text/plain' && part.body?.data) {
      const decoded = Buffer.from(part.body.data, 'base64url').toString('utf8');
      if (decoded.trim()) plainText += '\n' + decoded;
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      const decoded = Buffer.from(part.body.data, 'base64url').toString('utf8');
      if (decoded.trim()) htmlText += '\n' + decoded;
    }

    if (Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        walk(subPart);
      }
    }
  }

  walk(payload);

  if (plainText.trim()) return plainText.trim();
  if (htmlText.trim()) return cleanHtml(htmlText);
  return '';
}

/**
 * Syncs Gmail messages for a single user
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {object} options - { forceAll: boolean, days: number }
 */
async function syncUserGmail(userId, options = {}) {
  const user = await User.findById(userId);
  if (!user || !user.googleAuth?.refreshToken) {
    const err = new Error('Google Account not connected.');
    err.isGoogleAuthMissing = true;
    throw err;
  }

  // Verify trusted senders exist
  const trustedSenders = await TrustedSender.find({ userId });
  if (!trustedSenders || trustedSenders.length === 0) {
    return {
      syncedCount: 0,
      newCount: 0,
      message: 'No trusted senders configured. Add college TPO or placement cell email in Settings.',
    };
  }

  // Get authorized Gmail client
  const auth = await googleAuthService.getAuthorizedGoogleClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  // Build sender query strictly from trusted senders
  const senderQuery = trustedSenders.map(s => s.email.trim()).filter(Boolean).join(' OR ');
  if (!senderQuery) {
    return { syncedCount: 0, newCount: 0, message: 'Invalid trusted senders.' };
  }

  // Calculate time window: after last sync or within past 30 days
  let timeFilter = 'newer_than:30d';
  if (!options.forceAll && user.googleAuth.lastGmailSyncAt) {
    const epochSec = Math.floor(new Date(user.googleAuth.lastGmailSyncAt).getTime() / 1000);
    // Overlap by 1 hour to ensure no boundary misses
    timeFilter = `after:${Math.max(0, epochSec - 3600)}`;
  } else if (options.days) {
    timeFilter = `newer_than:${options.days}d`;
  }

  const query = `from:(${senderQuery}) ${timeFilter}`;

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 50,
  });

  const messages = listRes.data?.messages || [];
  if (messages.length === 0) {
    user.googleAuth.lastGmailSyncAt = new Date();
    await user.save();
    return { syncedCount: 0, newCount: 0, message: 'No new emails found from trusted senders.' };
  }

  const profile = await Profile.findOne({ userId });
  const existingOpps = await Opportunity.find({ userId });
  let newCount = 0;
  let autoUpdatedCount = 0;
  let skippedCount = 0;

  for (const msgRef of messages) {
    // Check if already in log
    const exists = await GmailSyncLog.findOne({ userId, gmailMessageId: msgRef.id });
    if (exists) {
      skippedCount++;
      continue;
    }

    // Fetch full email
    const msgDetail = await gmail.users.messages.get({
      userId: 'me',
      id: msgRef.id,
      format: 'full',
    });

    const headers = msgDetail.data?.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('subject') || '(No Subject)';
    const from = getHeader('from') || '';
    const dateStr = getHeader('date');
    const receivedAt = dateStr ? new Date(dateStr) : new Date();

    const bodyText = extractBodyFromPayload(msgDetail.data?.payload);
    if (!bodyText || bodyText.length < 20) {
      // Body empty or too short
      continue;
    }

    // Check if this email is a follow-up or update for an existing opportunity
    const isUpdateKeywords = /shortlist|shortlisted|drive date|campus drive|recruitment drive|round 2|second round|round 1|oa date|test date|assessment date|interview date|venue|schedule|rescheduled|result|selected|exam link|hall ticket|slot/i.test(subject + ' ' + bodyText.substring(0, 1200));

    // Try finding matching existing opportunity
    let matchedOpp = null;
    const cleanSubj = subject.toLowerCase();

    for (const opp of existingOpps) {
      const compName = (opp.company || '').toLowerCase().trim();
      if (!compName) continue;
      
      const compInSubject = compName.length >= 3 && cleanSubj.includes(compName);
      const sim = duplicateService.similarity(compName, cleanSubj);

      if (compInSubject || sim > 0.75) {
        matchedOpp = opp;
        break;
      }
    }

    // If update email matching existing opportunity
    if (matchedOpp && (isUpdateKeywords || user.settings?.llmApiKey)) {
      try {
        let updateResult = { changesSummary: [] };
        if (user.settings?.llmApiKey) {
          updateResult = await aiService.updateExtraction(
            bodyText,
            matchedOpp.customFields || [],
            matchedOpp.deadline,
            user.settings
          );
        }

        let deadlineChanged = false;
        if (updateResult.updatedDeadline) {
          matchedOpp.deadline = new Date(updateResult.updatedDeadline);
          deadlineChanged = true;
        }
        if (updateResult.updatedTestDate) {
          matchedOpp.testDate = new Date(updateResult.updatedTestDate);
        }
        if (updateResult.updatedDriveDate) {
          matchedOpp.driveDate = new Date(updateResult.updatedDriveDate);
        }
        if (updateResult.updatedInterviewDate) {
          matchedOpp.interviewDate = new Date(updateResult.updatedInterviewDate);
        }
        if (updateResult.shortlistInfo) {
          matchedOpp.shortlistInfo = updateResult.shortlistInfo;
        }
        if (updateResult.newStatus) {
          const validStatuses = ['not_applied', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];
          if (validStatuses.includes(updateResult.newStatus)) {
            matchedOpp.status = updateResult.newStatus;
          }
        }
        if (updateResult.updatedCustomFields?.length > 0) {
          matchedOpp.customFields = updateResult.updatedCustomFields;
        }

        if (matchedOpp.source) {
          matchedOpp.source.rawEmailText = (matchedOpp.source.rawEmailText || '') + '\n\n--- AUTO GMAIL UPDATE ---\n\n' + bodyText;
        } else {
          matchedOpp.source = { rawEmailText: bodyText, extractedViaAI: true };
        }

        await matchedOpp.save();

        // Sync all updated dates (deadline, test date, drive date, interview date) to Google Calendar
        await calendarSyncService.createOrUpdateEvent(userId, matchedOpp).catch(err => {
          console.warn('Google Calendar mirror warning in auto-update:', err.message);
        });

        // Reschedule reminder if deadline changed
        if (deadlineChanged && matchedOpp.deadline) {
          await Reminder.deleteMany({ opportunityId: matchedOpp._id, sent: false });
          await reminderService.scheduleReminder(matchedOpp, user);
        }

        // Log to ActivityLog
        await ActivityLog.create({
          userId,
          opportunityId: matchedOpp._id,
          eventType: 'edited',
          description: `Auto-updated ${matchedOpp.company} from Gmail: ${updateResult.changesSummary?.join('; ') || 'Updated drive/test details'}`,
          metadata: { changesSummary: updateResult.changesSummary, gmailMessageId: msgRef.id },
        });

        // Record in GmailSyncLog with status auto_updated
        await GmailSyncLog.create({
          userId,
          gmailMessageId: msgRef.id,
          subject,
          from,
          receivedAt,
          rawText: bodyText,
          opportunityId: matchedOpp._id,
          status: 'auto_updated',
          autoUpdateDetails: {
            existingCompany: matchedOpp.company,
            existingRole: matchedOpp.role,
            changesSummary: updateResult.changesSummary || ['Opportunity updated with new details from email'],
          },
          extractionResult: {
            updateResult,
          },
        });

        autoUpdatedCount++;
        continue;
      } catch (err) {
        console.warn(`Auto-update failed for email ${msgRef.id}, falling back to review queue:`, err.message);
      }
    }

    // Otherwise, treat as new opportunity for review
    let extractedFields = {};
    let duplicateWarning = null;
    let eligibilityCheckResult = null;

    if (user.settings?.llmApiKey) {
      try {
        extractedFields = await aiService.extract(bodyText, user.settings);

        if (extractedFields.company && extractedFields.role) {
          duplicateWarning = await duplicateService.check(
            userId,
            extractedFields.company,
            extractedFields.role,
            extractedFields.deadline
          );
        }

        if (profile && extractedFields.eligibility) {
          eligibilityCheckResult = eligibilityService.check(extractedFields.eligibility, profile.academics);
        }
      } catch (err) {
        console.warn(`AI extraction warning for email ${msgRef.id}:`, err.message);
        extractedFields = { rawError: err.message, errorType: 'ai_extraction_failed' };
      }
    } else {
      extractedFields = { note: 'AI API Key was not set during sync. Configure in Settings to extract.' };
    }

    const status = duplicateWarning?.isDuplicate ? 'duplicate' : 'pending_review';

    await GmailSyncLog.create({
      userId,
      gmailMessageId: msgRef.id,
      subject,
      from,
      receivedAt,
      rawText: bodyText,
      extractionResult: {
        extractedFields,
        duplicateWarning,
        eligibilityCheckResult,
      },
      status,
    });

    newCount++;
  }

  user.googleAuth.lastGmailSyncAt = new Date();
  await user.save();

  return {
    totalChecked: messages.length,
    newCount,
    autoUpdatedCount,
    skippedCount,
    message: `Gmail sync complete: ${newCount} new email(s) queued for review, ${autoUpdatedCount} job(s) auto-updated with drive/shortlist info.`,
  };
}

module.exports = {
  cleanHtml,
  extractBodyFromPayload,
  syncUserGmail,
};
