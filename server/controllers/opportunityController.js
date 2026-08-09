const Opportunity = require('../models/Opportunity');
const ActivityLog = require('../models/ActivityLog');
const Reminder = require('../models/Reminder');
const Profile = require('../models/Profile');
const eligibilityService = require('../services/eligibility.service');
const reminderService = require('../services/reminder.service');

// @GET /api/opportunities
const getOpportunities = async (req, res) => {
  const { status, employmentType, search, from, to, fields } = req.query;
  const query = { userId: req.user._id };

  if (status) query.status = status;
  if (employmentType) query.employmentType = employmentType;
  if (from || to) {
    query.deadline = {};
    if (from) query.deadline.$gte = new Date(from);
    if (to) query.deadline.$lte = new Date(to);
  }
  if (search) query.$text = { $search: search };

  let dbQuery = Opportunity.find(query).sort({ deadline: 1, createdAt: -1 });
  if (fields) dbQuery = dbQuery.select(fields.split(',').join(' '));

  const opportunities = await dbQuery;
  res.json(opportunities);
};

// @POST /api/opportunities
const createOpportunity = async (req, res) => {
  const data = { ...req.body, userId: req.user._id };

  // Fallback top-level field extraction from customFields
  if (Array.isArray(data.customFields)) {
    const getVal = (id) => data.customFields.find(f => (f.id === id || f.label?.toLowerCase().includes(id)) && !f.hidden)?.value;
    if (!data.ctc && getVal('ctc')) data.ctc = getVal('ctc');
    if (!data.stipend && getVal('stipend')) data.stipend = getVal('stipend');
    if (!data.ppo && getVal('ppo')) data.ppo = getVal('ppo');
    if (!data.location && getVal('location')) data.location = getVal('location');
    if ((!data.employmentType || data.employmentType === 'placement') && getVal('employmentType')) {
      data.employmentType = getVal('employmentType');
    }
    if (!data.deadline && getVal('deadline')) {
      const d = new Date(getVal('deadline'));
      if (!isNaN(d.getTime())) data.deadline = d;
    }
  }

  const opp = await Opportunity.create(data);

  // Eligibility check
  const profile = await Profile.findOne({ userId: req.user._id });
  if (profile && opp.eligibility) {
    const result = eligibilityService.check(opp.eligibility, profile.academics);
    opp.eligibilityCheckResult = result;
    await opp.save();
  }

  // Activity log
  await ActivityLog.create({
    userId: req.user._id,
    opportunityId: opp._id,
    eventType: 'created',
    description: `Added opportunity: ${opp.company} — ${opp.role}`,
    metadata: {},
  });

  // Reminder
  if (opp.deadline) {
    await reminderService.scheduleReminder(opp, req.user);
  }

  res.status(201).json(opp);
};

// @GET /api/opportunities/:id
const getOpportunity = async (req, res) => {
  const opp = await Opportunity.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('resumeVersionUsed', 'label fileUrl type');
  if (!opp) return res.status(404).json({ message: 'Opportunity not found.' });
  res.json(opp);
};

// @PUT /api/opportunities/:id
const updateOpportunity = async (req, res) => {
  const opp = await Opportunity.findOne({ _id: req.params.id, userId: req.user._id });
  if (!opp) return res.status(404).json({ message: 'Opportunity not found.' });

  Object.assign(opp, req.body);
  await opp.save();

  // Re-run eligibility
  const profile = await Profile.findOne({ userId: req.user._id });
  if (profile && opp.eligibility) {
    const result = eligibilityService.check(opp.eligibility, profile.academics);
    opp.eligibilityCheckResult = result;
    await opp.save();
  }

  // Update reminder if deadline changed
  if (req.body.deadline) {
    await Reminder.deleteMany({ opportunityId: opp._id, sent: false });
    await reminderService.scheduleReminder(opp, req.user);
  }

  await ActivityLog.create({
    userId: req.user._id,
    opportunityId: opp._id,
    eventType: 'edited',
    description: `Edited opportunity: ${opp.company} — ${opp.role}`,
  });

  res.json(opp);
};

// @DELETE /api/opportunities/:id
const deleteOpportunity = async (req, res) => {
  const opp = await Opportunity.findOne({ _id: req.params.id, userId: req.user._id });
  if (!opp) return res.status(404).json({ message: 'Opportunity not found.' });

  const { company, role } = opp;
  await opp.deleteOne();
  await Reminder.deleteMany({ opportunityId: req.params.id });

  await ActivityLog.create({
    userId: req.user._id,
    opportunityId: null,
    eventType: 'deleted',
    description: `Deleted opportunity: ${company} — ${role}`,
  });

  res.json({ message: 'Opportunity deleted.' });
};

// @PATCH /api/opportunities/:id/status
const updateStatus = async (req, res) => {
  const { newStatus } = req.body;
  const validStatuses = ['not_applied', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];
  if (!validStatuses.includes(newStatus))
    return res.status(400).json({ message: 'Invalid status.' });

  const opp = await Opportunity.findOne({ _id: req.params.id, userId: req.user._id });
  if (!opp) return res.status(404).json({ message: 'Opportunity not found.' });

  const oldStatus = opp.status;
  opp.status = newStatus;

  // Update currentStageIndex based on pipeline
  const stageMap = { not_applied: -1, applied: 0, oa: 1, interview: 2, hr: 3, offer: 4, rejected: 4 };
  opp.currentStageIndex = stageMap[newStatus] ?? opp.currentStageIndex;

  await opp.save();

  await ActivityLog.create({
    userId: req.user._id,
    opportunityId: opp._id,
    eventType: 'status_changed',
    description: `${opp.company}: status changed to ${newStatus}`,
    metadata: { fromStatus: oldStatus, toStatus: newStatus },
  });

  res.json(opp);
};

// @POST /api/opportunities/extract
const extractFromEmail = async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ message: 'rawText is required.' });

  if (!req.user?.settings?.llmApiKey) {
    return res.status(400).json({
      isKeyMissing: true,
      keyType: 'AI',
      message: 'AI API Key is missing! Please configure your LLM API Key in Settings to use AI Smart Paste.',
    });
  }

  const aiService = require('../services/aiExtraction.service');
  const duplicateService = require('../services/duplicate.service');

  const extracted = await aiService.extract(rawText, req.user?.settings);

  // Duplicate check
  const duplicate = await duplicateService.check(req.user._id, extracted.company, extracted.role, extracted.deadline);

  // Eligibility check
  const profile = await Profile.findOne({ userId: req.user._id });
  let eligibilityCheckResult = null;
  if (profile && extracted.eligibility) {
    eligibilityCheckResult = eligibilityService.check(extracted.eligibility, profile.academics);
  }

  res.json({ extractedFields: extracted, duplicateWarning: duplicate, eligibilityCheckResult });
};

// @POST /api/opportunities/:id/ai-update
const aiUpdateOpportunity = async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ message: 'rawText is required.' });

  if (!req.user?.settings?.llmApiKey) {
    return res.status(400).json({
      isKeyMissing: true,
      keyType: 'AI',
      message: 'AI API Key is missing! Please configure your LLM API Key in Settings.',
    });
  }

  const opp = await Opportunity.findOne({ _id: req.params.id, userId: req.user._id });
  if (!opp) return res.status(404).json({ message: 'Opportunity not found.' });

  const aiService = require('../services/aiExtraction.service');
  const updateResult = await aiService.updateExtraction(rawText, opp.customFields, opp.deadline, req.user?.settings);

  // Apply updated deadline if found
  let deadlineUpdated = false;
  if (updateResult.updatedDeadline) {
    opp.deadline = new Date(updateResult.updatedDeadline);
    deadlineUpdated = true;
  }

  // Apply updated custom fields
  if (updateResult.updatedCustomFields && updateResult.updatedCustomFields.length > 0) {
    opp.customFields = updateResult.updatedCustomFields;
  }

  // Append raw text to email history
  if (opp.source) {
    opp.source.rawEmailText = (opp.source.rawEmailText || '') + '\n\n--- FOLLOW-UP EMAIL ---\n\n' + rawText;
  } else {
    opp.source = { rawEmailText: rawText, extractedViaAI: true };
  }

  await opp.save();

  // Reschedule reminder if deadline updated
  if (deadlineUpdated && opp.deadline) {
    await Reminder.deleteMany({ opportunityId: opp._id, sent: false });
    await reminderService.scheduleReminder(opp, req.user);
  }

  // Log activity
  await ActivityLog.create({
    userId: req.user._id,
    opportunityId: opp._id,
    eventType: 'edited',
    description: `AI merged follow-up email for ${opp.company} — ${opp.role}`,
    metadata: { changesSummary: updateResult.changesSummary },
  });

  res.json({ opportunity: opp, changesSummary: updateResult.changesSummary || [] });
};

// @GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const ALL_STATUSES = ['not_applied', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];

    const [total, applied, inProgress, offers, rejected, ...statusCounts] = await Promise.all([
      Opportunity.countDocuments({ userId }),
      Opportunity.countDocuments({ userId, status: 'applied' }),
      Opportunity.countDocuments({ userId, status: { $in: ['oa', 'interview', 'hr'] } }),
      Opportunity.countDocuments({ userId, status: 'offer' }),
      Opportunity.countDocuments({ userId, status: 'rejected' }),
      ...ALL_STATUSES.map(s => Opportunity.countDocuments({ userId, status: s })),
    ]);

    // Build byStatus map
    const byStatus = {};
    ALL_STATUSES.forEach((s, i) => { byStatus[s] = statusCounts[i]; });

    const now = new Date();
    const upcoming = await Opportunity.find({
      userId,
      deadline: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      status: { $nin: ['offer', 'rejected'] },
    })
      .sort({ deadline: 1 })
      .limit(5)
      .select('company role deadline status');

    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    res.json({ total, applied, inProgress, offers, rejected, rejectionRate, upcoming, byStatus });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch dashboard statistics' });
  }
};

module.exports = {
  getOpportunities,
  createOpportunity,
  getOpportunity,
  updateOpportunity,
  deleteOpportunity,
  updateStatus,
  extractFromEmail,
  aiUpdateOpportunity,
  getDashboardStats,
};
