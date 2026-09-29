/**
 * gmailController.js
 * Controls trusted senders, manual Gmail sync, pending review queue, confirm and ignore actions.
 */
const TrustedSender = require('../models/TrustedSender');
const GmailSyncLog = require('../models/GmailSyncLog');
const Opportunity = require('../models/Opportunity');
const Profile = require('../models/Profile');
const ActivityLog = require('../models/ActivityLog');
const gmailSyncService = require('../services/gmailSync.service');
const calendarSyncService = require('../services/calendarSync.service');
const reminderService = require('../services/reminder.service');
const eligibilityService = require('../services/eligibility.service');

// @GET /api/gmail/senders
const getTrustedSenders = async (req, res) => {
  const senders = await TrustedSender.find({ userId: req.user._id }).sort({ addedAt: -1 });
  res.json(senders);
};

// @POST /api/gmail/senders
const addTrustedSender = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await TrustedSender.findOne({ userId: req.user._id, email: cleanEmail });
  if (existing) {
    return res.status(400).json({ message: 'This sender email is already in your trusted list.' });
  }

  const sender = await TrustedSender.create({
    userId: req.user._id,
    email: cleanEmail,
    name: name?.trim() || '',
  });

  res.status(201).json(sender);
};

// @DELETE /api/gmail/senders/:id
const deleteTrustedSender = async (req, res) => {
  const sender = await TrustedSender.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!sender) return res.status(404).json({ message: 'Sender not found.' });
  res.json({ message: 'Trusted sender removed.' });
};

// @POST /api/gmail/sync
const syncGmail = async (req, res) => {
  try {
    const result = await gmailSyncService.syncUserGmail(req.user._id, req.body || {});
    res.json(result);
  } catch (err) {
    if (err.isGoogleAuthMissing) {
      return res.status(400).json({
        isGoogleAuthMissing: true,
        message: err.message,
      });
    }
    res.status(500).json({ message: err.message || 'Gmail sync failed.' });
  }
};

// @GET /api/gmail/pending-review
const getPendingReview = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const query = {
      userId: req.user._id,
      status: 'pending_review',
    };

    if (page && limit) {
      const p = Math.max(1, Number(page));
      const l = Math.max(1, Number(limit));
      const [items, total] = await Promise.all([
        GmailSyncLog.find(query)
          .sort({ receivedAt: -1 })
          .skip((p - 1) * l)
          .limit(l),
        GmailSyncLog.countDocuments(query),
      ]);
      return res.json({ items, total, page: p, pages: Math.ceil(total / l) });
    }

    const items = await GmailSyncLog.find(query).sort({ receivedAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching pending review items:', err);
    res.status(500).json({ message: 'Failed to fetch pending review items', items: [] });
  }
};

// @GET /api/gmail/auto-updates
const getAutoUpdates = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const query = {
      userId: req.user._id,
      status: 'auto_updated',
    };

    if (page && limit) {
      const p = Math.max(1, Number(page));
      const l = Math.max(1, Number(limit));
      const [updates, total] = await Promise.all([
        GmailSyncLog.find(query)
          .sort({ receivedAt: -1 })
          .skip((p - 1) * l)
          .limit(l)
          .populate('opportunityId', 'company role status deadline driveDate testDate interviewDate shortlistInfo'),
        GmailSyncLog.countDocuments(query),
      ]);
      return res.json({ updates, total, page: p, pages: Math.ceil(total / l) });
    }

    const updates = await GmailSyncLog.find(query)
      .sort({ receivedAt: -1 })
      .limit(50)
      .populate('opportunityId', 'company role status deadline driveDate testDate interviewDate shortlistInfo');

    res.json(updates);
  } catch (err) {
    console.error('Error fetching auto updates:', err);
    res.status(500).json({ message: 'Failed to fetch auto updates', updates: [] });
  }
};

// @DELETE /api/gmail/auto-updates/:id
const dismissAutoUpdate = async (req, res) => {
  const item = await GmailSyncLog.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!item) return res.status(404).json({ message: 'Auto-update suggestion not found.' });
  res.json({ message: 'Auto-update suggestion removed.' });
};

// @PUT /api/gmail/auto-updates/:id
const updateAutoUpdate = async (req, res) => {
  const item = await GmailSyncLog.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!item) return res.status(404).json({ message: 'Auto-update item not found.' });

  const { status, testDate, driveDate, interviewDate, deadline, shortlistInfo } = req.body;

  if (item.opportunityId) {
    const opp = await Opportunity.findOne({ _id: item.opportunityId, userId: req.user._id });
    if (opp) {
      if (status) opp.status = status;
      if (testDate !== undefined) opp.testDate = testDate ? new Date(testDate) : null;
      if (driveDate !== undefined) opp.driveDate = driveDate ? new Date(driveDate) : null;
      if (interviewDate !== undefined) opp.interviewDate = interviewDate ? new Date(interviewDate) : null;
      if (deadline !== undefined) opp.deadline = deadline ? new Date(deadline) : null;
      if (shortlistInfo !== undefined) opp.shortlistInfo = shortlistInfo;
      await opp.save();

      // Mirror to Google Calendar
      await calendarSyncService.createOrUpdateEvent(req.user._id, opp).catch(err => {
        console.warn('Google Calendar mirror warning in updateAutoUpdate:', err.message);
      });

      const updatedChanges = [];
      if (status) updatedChanges.push(`Status: ${status}`);
      if (driveDate) updatedChanges.push(`Drive: ${new Date(driveDate).toLocaleDateString()}`);
      if (testDate) updatedChanges.push(`Test: ${new Date(testDate).toLocaleDateString()}`);
      if (interviewDate) updatedChanges.push(`Interview: ${new Date(interviewDate).toLocaleDateString()}`);
      if (shortlistInfo) updatedChanges.push(`Shortlist: ${shortlistInfo.substring(0, 30)}...`);

      if (updatedChanges.length > 0) {
        if (!item.autoUpdateDetails) item.autoUpdateDetails = {};
        item.autoUpdateDetails.changesSummary = updatedChanges;
        await item.save();
      }
    }
  }

  res.json({ message: 'Opportunity updated successfully from suggestion!', item });
};

// @POST /api/gmail/pending-review/:id/re-extract
const reExtractPending = async (req, res) => {
  const item = await GmailSyncLog.findOne({ _id: req.params.id, userId: req.user._id });
  if (!item) return res.status(404).json({ message: 'Pending item not found.' });

  if (!req.user?.settings?.llmApiKey) {
    return res.status(400).json({
      isKeyMissing: true,
      message: 'AI API Key is missing. Please configure your key in Settings to extract details.',
    });
  }

  const aiService = require('../services/aiExtraction.service');
  const duplicateService = require('../services/duplicate.service');

  try {
    const extracted = await aiService.extract(item.rawText, req.user.settings);

    let duplicateWarning = null;
    if (extracted.company && extracted.role) {
      duplicateWarning = await duplicateService.check(req.user._id, extracted.company, extracted.role, extracted.deadline);
    }

    const profile = await Profile.findOne({ userId: req.user._id });
    let eligibilityCheckResult = null;
    if (profile && extracted.eligibility) {
      eligibilityCheckResult = eligibilityService.check(extracted.eligibility, profile.academics);
    }

    item.extractionResult = {
      extractedFields: extracted,
      duplicateWarning,
      eligibilityCheckResult,
    };
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to re-extract details with AI' });
  }
};

// @POST /api/gmail/pending-review/:id/confirm
const confirmPending = async (req, res) => {
  const item = await GmailSyncLog.findOne({ _id: req.params.id, userId: req.user._id });
  if (!item) return res.status(404).json({ message: 'Pending item not found.' });

  const extracted = item.extractionResult?.extractedFields || {};
  const body = req.body || {};

  const company = body.company || extracted.company;
  const role = body.role || extracted.role;

  if (!company || !role) {
    return res.status(400).json({ message: 'Company and Role are required to confirm this opportunity.' });
  }

  let deadline = body.deadline || extracted.deadline || null;
  if (deadline && !isNaN(new Date(deadline).getTime())) {
    deadline = new Date(deadline);
  } else {
    deadline = null;
  }

  let testDate = body.testDate || extracted.testDate || null;
  if (testDate && !isNaN(new Date(testDate).getTime())) {
    testDate = new Date(testDate);
  } else {
    testDate = null;
  }

  let driveDate = body.driveDate || extracted.driveDate || null;
  if (driveDate && !isNaN(new Date(driveDate).getTime())) {
    driveDate = new Date(driveDate);
  } else {
    driveDate = null;
  }

  let interviewDate = body.interviewDate || extracted.interviewDate || null;
  if (interviewDate && !isNaN(new Date(interviewDate).getTime())) {
    interviewDate = new Date(interviewDate);
  } else {
    interviewDate = null;
  }

  // Preserve allowedBranches in eligibility
  const eligibility = body.eligibility || extracted.eligibility || {};
  if (body.allowedBranches && Array.isArray(body.allowedBranches)) {
    eligibility.allowedBranches = body.allowedBranches;
  }

  const oppData = {
    userId: req.user._id,
    company: company.trim(),
    role: role.trim(),
    ctc: body.ctc ?? extracted.ctc ?? null,
    stipend: body.stipend ?? extracted.stipend ?? null,
    ppo: body.ppo ?? extracted.ppo ?? null,
    employmentType: body.employmentType || extracted.employmentType || 'placement',
    location: body.location ?? extracted.location ?? null,
    deadline,
    testDate,
    driveDate,
    interviewDate,
    shortlistInfo: body.shortlistInfo || extracted.shortlistInfo || null,
    links: body.links || extracted.links || [],
    customFields: body.customFields || [],
    eligibility,
    source: {
      rawEmailText: item.rawText,
      extractedViaAI: true,
    },
  };

  const opp = await Opportunity.create(oppData);

  // Check eligibility
  const profile = await Profile.findOne({ userId: req.user._id });
  if (profile && opp.eligibility) {
    const result = eligibilityService.check(opp.eligibility, profile.academics);
    opp.eligibilityCheckResult = result;
    await opp.save();
  }

  // Schedule reminder if deadline present
  if (opp.deadline) {
    await reminderService.scheduleReminder(opp, req.user);
  }

  // Activity Log
  await ActivityLog.create({
    userId: req.user._id,
    opportunityId: opp._id,
    eventType: 'gmail_approved',
    description: `Approved from Gmail: ${opp.company} — ${opp.role}`,
    metadata: { gmailMessageId: item.gmailMessageId, from: item.from },
  });

  // Mirror all dates to Google Calendar
  await calendarSyncService.createOrUpdateEvent(req.user._id, opp).catch(err => {
    console.warn('Google Calendar mirror warning:', err.message);
  });

  // Mark log as added
  item.status = 'added';
  item.opportunityId = opp._id;
  await item.save();

  res.status(201).json({
    message: 'Opportunity confirmed and saved!',
    opportunity: opp,
  });
};

// @POST /api/gmail/pending-review/:id/ignore
const ignorePending = async (req, res) => {
  const item = await GmailSyncLog.findOne({ _id: req.params.id, userId: req.user._id });
  if (!item) return res.status(404).json({ message: 'Pending item not found.' });

  item.status = 'ignored';
  await item.save();

  // Log the ignore action
  await ActivityLog.create({
    userId: req.user._id,
    opportunityId: null,
    eventType: 'gmail_ignored',
    description: `Ignored Gmail email: ${item.subject || '(No Subject)'} from ${item.from || 'unknown'}`,
    metadata: { gmailMessageId: item.gmailMessageId },
  }).catch(() => {}); // non-critical, don't block response

  res.json({ message: 'Email ignored from review queue.' });
};

module.exports = {
  getTrustedSenders,
  addTrustedSender,
  deleteTrustedSender,
  syncGmail,
  getPendingReview,
  getAutoUpdates,
  dismissAutoUpdate,
  updateAutoUpdate,
  reExtractPending,
  confirmPending,
  ignorePending,
};
