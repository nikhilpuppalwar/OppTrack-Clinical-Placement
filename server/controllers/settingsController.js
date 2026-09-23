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
  let baseUrl = userSettings.llmBaseUrl?.trim() || '';

  // Only auto-detect if provider is not explicitly set or set to default 'groq' without user selection
  if (!userSettings.llmProvider) {
    if (apiKey) {
      if (apiKey.startsWith('gsk_')) provider = 'groq';
      else if (apiKey.startsWith('sk-or-')) provider = 'openrouter';
      else if (apiKey.startsWith('AIzaSy')) provider = 'gemini';
      else if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-')) provider = 'openai';
    }
  }

  // Model safety validation: only migrate known decommissioned/discontinued models or placeholder 'other'
  if (provider === 'groq') {
    const deprecatedGroqModels = [
      'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it',
      'llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'qwen/qwen3.8-27b'
    ];
    if (!model || model === 'other' || deprecatedGroqModels.includes(model)) {
      model = 'openai/gpt-oss-120b';
    }
  } else if (provider === 'gemini') {
    const deprecatedGeminiModels = ['gemini-2.0-flash-exp', 'gemini-1.0-pro', 'gemini-1.0-pro-vision'];
    if (!model || model === 'other' || deprecatedGeminiModels.includes(model)) {
      model = 'gemini-2.0-flash';
    }
  } else if (provider === 'openai') {
    const deprecatedOpenAiModels = ['gpt-3.5-turbo', 'gpt-3.5-turbo-instruct', 'gpt-4-0613', 'gpt-4-1106-preview'];
    if (!model || model === 'other' || deprecatedOpenAiModels.includes(model)) {
      model = 'gpt-4o-mini';
    }
  } else if (provider === 'openrouter') {
    if (!model || model === 'other') {
      model = 'meta-llama/llama-3.3-70b-instruct';
    }
  } else if (provider === 'deepseek') {
    if (!model || model === 'other') {
      model = 'deepseek-chat';
    }
  } else if (provider === 'together') {
    if (!model || model === 'other') {
      model = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
    }
  } else if (provider === 'mistral') {
    if (!model || model === 'other') {
      model = 'mistral-large-latest';
    }
  } else if (provider === 'ollama') {
    if (!model || model === 'other') {
      model = 'llama3.3';
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:11434/v1';
    }
  }

  return { apiKey, provider, model, baseUrl };
}

// @GET /api/settings
const getSettings = async (req, res) => {
  const userSettings = req.user.settings || {};
  const { apiKey, provider, model, baseUrl } = resolveApiKeyAndProvider(userSettings);

  res.json({
    ...userSettings,
    llmProvider: userSettings.llmProvider || provider || 'groq',
    llmApiKey: userSettings.llmApiKey || apiKey || '',
    llmModel: userSettings.llmModel || model || '',
    llmBaseUrl: userSettings.llmBaseUrl || baseUrl || '',
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
    const authUser = settingsToTest.smtpUser || process.env.SMTP_USER;
    const authPass = settingsToTest.smtpPass || process.env.SMTP_PASS;
    if (!authUser || !authPass) {
      return res.status(400).json({
        isKeyMissing: true,
        keyType: 'Email',
        message: 'Server SMTP credentials are not configured in .env',
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
      message: err.message || 'Failed to send test email.',
    });
  }
};

// @POST /api/settings/test-ai
const testAiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const settingsToTest = { ...user.settings, ...req.body };
    const { apiKey, provider, model, baseUrl } = resolveApiKeyAndProvider(settingsToTest);

    const isLocal = provider === 'ollama' || (baseUrl && (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')));
    if (!apiKey && !isLocal) {
      return res.status(400).json({
        isKeyMissing: true,
        keyType: 'AI',
        message: 'No API Key found in your account settings. Please enter your LLM API Key in Settings.',
      });
    }

    const effectiveApiKey = apiKey || (isLocal ? 'ollama-local-key' : '');
    const sampleText = 'Company: TestCorp, Role: Software Engineer, CTC: 10 LPA, Deadline: 2026-12-31';
    const result = await aiService.extract(sampleText, {
      llmProvider: provider,
      llmApiKey: effectiveApiKey,
      llmModel: model,
      llmBaseUrl: baseUrl,
    });

    res.json({
      message: `AI Connection Successful! (${provider} — ${model || 'default'})`,
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

// @POST /api/settings/test-notification
const testNotification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const result = await reminderService.sendTestNotification(user, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to dispatch test notification' });
  }
};

// @GET /api/settings/upcoming-reminders
const getUpcomingReminders = async (req, res) => {
  try {
    const reminders = await reminderService.getUpcomingReminders(req.user._id);
    res.json({ reminders, count: reminders.length });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load upcoming reminders' });
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
    version: '1.5.0',
    stats: {
      opportunitiesCount: opportunities.length,
      historyCount: history.length,
    },
    user,
    profile,
    opportunities,
    history,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=opptrack-export-${Date.now()}.json`);
  res.json(exportPayload);
};

// @GET /api/settings/export-csv
const exportCsv = async (req, res) => {
  try {
    const userId = req.user._id;
    const opportunities = await Opportunity.find({ userId }).sort({ createdAt: -1 });

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Company',
      'Role',
      'Type',
      'Status',
      'Package',
      'Allowed Branches',
      'Application Deadline',
      'OA / Test Date',
      'Campus Drive Date',
      'Interview Date',
      'Shortlist Updates',
      'Location',
      'Application URL',
      'Created At',
    ];

    const rows = opportunities.map((opp) => [
      escapeCsv(opp.company),
      escapeCsv(opp.role),
      escapeCsv(opp.type),
      escapeCsv(opp.status),
      escapeCsv(opp.package),
      escapeCsv((opp.allowedBranches || []).join('; ')),
      escapeCsv(opp.deadline ? new Date(opp.deadline).toISOString() : ''),
      escapeCsv(opp.testDate ? new Date(opp.testDate).toISOString() : ''),
      escapeCsv(opp.driveDate ? new Date(opp.driveDate).toISOString() : ''),
      escapeCsv(opp.interviewDate ? new Date(opp.interviewDate).toISOString() : ''),
      escapeCsv(opp.shortlistInfo),
      escapeCsv(opp.location),
      escapeCsv(opp.applyUrl),
      escapeCsv(opp.createdAt ? new Date(opp.createdAt).toISOString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=opptrack-opportunities-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to export CSV' });
  }
};

// @POST /api/settings/import-backup
const importBackup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { backupData, mode = 'merge' } = req.body;

    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ message: 'Invalid backup file payload. Must be a valid JSON object.' });
    }

    let opportunitiesRestored = 0;
    let profileRestored = false;
    let historyRestored = 0;

    // Handle opportunities
    const rawOpps = backupData.opportunities || backupData.jobs || [];
    if (Array.isArray(rawOpps) && rawOpps.length > 0) {
      if (mode === 'replace') {
        await Opportunity.deleteMany({ userId });
      }

      for (const item of rawOpps) {
        if (!item.company) continue;
        const oppData = {
          userId,
          company: item.company,
          role: item.role || 'Software Engineer',
          type: item.type || 'placement',
          status: item.status || 'not_applied',
          package: item.package || '',
          allowedBranches: Array.isArray(item.allowedBranches) ? item.allowedBranches : [],
          deadline: item.deadline || null,
          testDate: item.testDate || null,
          driveDate: item.driveDate || null,
          interviewDate: item.interviewDate || null,
          shortlistInfo: item.shortlistInfo || '',
          location: item.location || '',
          applyUrl: item.applyUrl || '',
          description: item.description || '',
          eligibilityCriteria: item.eligibilityCriteria || '',
          notes: item.notes || '',
          customFields: item.customFields || {},
        };

        if (mode === 'merge') {
          await Opportunity.findOneAndUpdate(
            { userId, company: oppData.company, role: oppData.role },
            { $set: oppData },
            { upsert: true, new: true }
          );
        } else {
          await Opportunity.create(oppData);
        }
        opportunitiesRestored++;
      }
    }

    // Handle profile
    if (backupData.profile && typeof backupData.profile === 'object') {
      const p = { ...backupData.profile };
      delete p._id;
      delete p.userId;
      delete p.__v;
      await Profile.findOneAndUpdate({ userId }, { $set: { ...p, userId } }, { upsert: true, new: true });
      profileRestored = true;
    }

    // Log Activity
    await ActivityLog.create({
      userId,
      eventType: 'backup_restored',
      description: `Restored backup: ${opportunitiesRestored} opportunities (${mode} mode).`,
    });

    res.json({
      success: true,
      message: `Successfully restored ${opportunitiesRestored} opportunities and profile data.`,
      stats: {
        opportunitiesRestored,
        profileRestored,
        historyRestored,
      },
    });
  } catch (err) {
    console.error('Import backup error:', err);
    res.status(500).json({ message: err.message || 'Failed to restore backup.' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  testEmail,
  testAiKey,
  testNotification,
  getUpcomingReminders,
  exportData,
  exportCsv,
  importBackup,
};
