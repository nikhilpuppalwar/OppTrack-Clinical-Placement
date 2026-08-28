const User = require('../models/User');
const Profile = require('../models/Profile');
const Opportunity = require('../models/Opportunity');
const ActivityLog = require('../models/ActivityLog');
const reminderService = require('../services/reminder.service');
const aiService = require('../services/aiExtraction.service');

function resolveApiKeyAndProvider(userSettings = {}) {
  let provider = (userSettings.llmProvider || 'groq').toLowerCase().trim();
  let apiKey = userSettings.llmApiKey?.trim();
  let model = userSettings.llmModel?.trim();

  if (apiKey) {
    if (apiKey.startsWith('gsk_')) provider = 'groq';
    else if (apiKey.startsWith('sk-or-')) provider = 'openrouter';
    else if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-')) provider = 'openai';
  }

  // Model safety validation per provider according to official documentation
  if (provider === 'groq') {
    const validGroqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
    if (!model || !validGroqModels.includes(model)) {
      model = 'llama-3.3-70b-versatile';
    }
  } else if (provider === 'openai') {
    const validOpenAIModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
    if (!model || !validOpenAIModels.includes(model)) {
      model = 'gpt-4o-mini';
    }
  } else if (provider === 'openrouter') {
    if (!model || !model.includes('/') || model === 'other') {
      model = 'meta-llama/llama-3.3-70b-instruct';
    }
  }

  return { apiKey, provider, model };
}

// @GET /api/settings
const getSettings = async (req, res) => {
  const userSettings = req.user.settings || {};
  const { apiKey, provider, model } = resolveApiKeyAndProvider(userSettings);

  res.json({
    ...userSettings,
    llmProvider: userSettings.llmProvider || provider || 'groq',
    llmApiKey: userSettings.llmApiKey || apiKey || '',
    llmModel: userSettings.llmModel || model || '',
    hasApiKey: !!apiKey,
  });
};

// @PUT /api/settings
const updateSettings = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.settings = { ...user.settings, ...req.body };
  await user.save();

  const { apiKey, provider, model } = resolveApiKeyAndProvider(user.settings);

  res.json({
    ...user.settings,
    hasApiKey: !!apiKey,
    effectiveProvider: provider,
    effectiveModel: model,
  });
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
    const { apiKey, provider, model } = resolveApiKeyAndProvider(settingsToTest);

    if (!apiKey) {
      return res.status(400).json({
        isKeyMissing: true,
        keyType: 'AI',
        message: 'No API Key found in your account settings. Please enter your LLM API Key in Settings.',
      });
    }

    const sampleText = 'Company: TestCorp, Role: Software Engineer, CTC: 10 LPA, Deadline: 2026-12-31';
    const result = await aiService.extract(sampleText, {
      llmProvider: provider,
      llmApiKey: apiKey,
      llmModel: model,
    });

    res.json({
      message: `AI Connection Successful! (${provider} - ${model || 'default'})`,
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
