const FormHistory = require('../models/FormHistory');
const ActivityLog = require('../models/ActivityLog');

// ─── POST /api/form-history ──────────────────────────────────────────────────
// Called by the extension after an autofill or sync action.
const createFormHistory = async (req, res) => {
  try {
    const { formUrl, formTitle, action, matchedOpportunityId, fieldsFilledCount } = req.body;

    if (!formUrl || !action) {
      return res.status(400).json({ message: 'formUrl and action are required.' });
    }

    const entry = await FormHistory.create({
      userId: req.user._id,
      formUrl,
      formTitle: formTitle || '',
      action,
      matchedOpportunityId: matchedOpportunityId || null,
      fieldsFilledCount: fieldsFilledCount || 0,
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to save form history' });
  }
};

// ─── POST /api/form-history/sensitive-reveal ─────────────────────────────────
// Called by the extension when a user reveals a masked sensitive field.
const logSensitiveReveal = async (req, res) => {
  try {
    const { fieldName, formUrl } = req.body;

    if (!fieldName || !formUrl) {
      return res.status(400).json({ message: 'fieldName and formUrl are required.' });
    }

    await ActivityLog.create({
      userId: req.user._id,
      opportunityId: null,
      eventType: 'sensitive_field_revealed',
      description: `Sensitive field revealed: "${fieldName}" on ${new URL(formUrl).hostname}`,
      metadata: { fieldName, formUrl },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to log reveal' });
  }
};

// ─── GET /api/form-history ───────────────────────────────────────────────────
// Paginated list of form history entries for the web app + popup.
const getFormHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      FormHistory.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('matchedOpportunityId', 'company role'),
      FormHistory.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      entries,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch form history' });
  }
};

module.exports = { createFormHistory, logSensitiveReveal, getFormHistory };
