const User = require('../models/User');
const Profile = require('../models/Profile');
const Opportunity = require('../models/Opportunity');
const ActivityLog = require('../models/ActivityLog');
const reminderService = require('../services/reminder.service');
const aiService = require('../services/aiExtraction.service');

// @GET /api/settings
const getSettings = async (req, res) => {
  res.json(req.user.settings || {});
};

// @PUT /api/settings
const updateSettings = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.settings = { ...user.settings, ...req.body };
  await user.save();
  res.json(user.settings);
};

// @POST /api/settings/test-email
const testEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const settingsToTest = { ...user.settings, ...req.body };
    if (!settingsToTest.smtpUser || !settingsToTest.smtpPass) {
      return res.status(400).json({
        isKeyMissing: true,
        keyType: 'Email',
        message: 'SMTP Email and App Password are not configured in Settings.',
      });
    }
    user.settings = settingsToTest;
    await user.save();
    await reminderService.sendTestEmail(user);
    res.json({ message: `Test email sent successfully to ${user.email}!` });
  } catch (err) {
    res.status(400).json({
      isKeyMissing: err.message?.includes('SMTP Email') || err.message?.includes('credentials'),
      keyType: 'Email',
      message: err.message || 'Failed to send test email. Check your SMTP credentials.',
    });
  }
};

// @POST /api/settings/test-ai
const testAiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const settingsToTest = { ...user.settings, ...req.body };
    
    if (!settingsToTest.llmApiKey) {
      return res.status(400).json({
        isKeyMissing: true,
        keyType: 'AI',
        message: 'API Key is required to perform AI test. Please enter an API Key.',
      });
    }

    // Call extraction service with a sample text to test LLM connectivity
    const sampleText = 'Company: TestCorp, Role: Software Engineer, CTC: 10 LPA, Deadline: 2026-12-31';
    const result = await aiService.extract(sampleText, settingsToTest);

    res.json({
      message: `AI Connection Successful! (${settingsToTest.llmProvider || 'groq'} - ${settingsToTest.llmModel || 'default'})`,
      result,
    });
  } catch (err) {
    res.status(400).json({
      isKeyMissing: err.isKeyMissing || err.message?.includes('missing'),
      keyType: 'AI',
      message: err.message || 'AI API Key validation failed. Check your Provider, Model, and API Key.',
    });
  }
};

// @GET /api/settings/export
const exportData = async (req, res) => {
  const userId = req.user._id;
  const [user, profile, opportunities, history] = await Promise.all([
    User.findById(userId).select('-passwordHash'),
    Profile.findOne({ userId }),
    Opportunity.find({ userId }),
    ActivityLog.find({ userId }).sort({ createdAt: -1 }),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user,
    profile,
    opportunities,
    history,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=opptrack-export-${Date.now()}.json`);
  res.json(exportPayload);
};

module.exports = { getSettings, updateSettings, testEmail, testAiKey, exportData };
