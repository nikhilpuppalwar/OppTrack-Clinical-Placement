const ExtensionSync = require('../models/ExtensionSync');
const Profile = require('../models/Profile');
const ActivityLog = require('../models/ActivityLog');
const aiService = require('../services/aiExtraction.service');

const STANDARD_FIELDS = [
  'candidateName', 'preferredName', 'prn', 'collegeEmail', 'personalEmail', 'phone', 'gender',
  'collegeName', 'stream', 'branch', 'passingYear', 'hobby', 'cgpa', 'tenthPercent', 'twelfthPercent',
  'hasBacklog', 'backlogDetails', 'dsCourseDone', 'dsCourseName', 'technicalCertifications',
  'previousInternships', 'roleApplied', 'projectTitle', 'projectDetails', 'portfolioUrl',
  'linkedinLink', 'githubLink', 'leetcodeLink', 'codechefLink', 'hackerrankLink', 'resumeLink',
  'technicalSkills', 'programmingLanguages', 'frameworks', 'tools', 'softSkills', 'languages',
  'technicalAchievements', 'personalAchievements',
  'currentAddressLine1', 'currentAddressLine2', 'currentCity', 'currentState', 'currentPincode', 'currentCountry',
  'permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 'permanentState', 'permanentPincode', 'permanentCountry'
];

const normalize = (str = '') => str.toLowerCase().replace(/[^a-z0-9]/g, '');

// Stage incoming data from extension or form scanner with AI diff analysis
const stageExtensionData = async ({ userId, fieldsToSave = [], formUrl = '', formTitle = '', source = 'Chrome Extension' }) => {
  let profile = await Profile.findOne({ userId });
  if (!profile) {
    profile = await Profile.create({ userId });
  }

  // Create lookup map of current profile values
  const currentMap = new Map();

  // Top-level properties
  STANDARD_FIELDS.forEach((key) => {
    if (profile[key] !== undefined && profile[key] !== null) {
      currentMap.set(key.toLowerCase(), String(profile[key]));
      currentMap.set(normalize(key), String(profile[key]));
    }
  });

  // Dynamic fields array
  (profile.fields || []).forEach((f) => {
    if (f.id) currentMap.set(f.id.toLowerCase(), String(f.value || ''));
    if (f.label) currentMap.set(normalize(f.label), String(f.value || ''));
  });

  // Analyze each incoming field against active profile
  const analysis = [];

  for (const item of fieldsToSave) {
    if (!item.label || item.value === undefined || item.value === null) continue;

    const incomingVal = String(item.value).trim();
    if (!incomingVal) continue;

    const fieldKey = item.id || normalize(item.label);
    const existingVal = currentMap.get(fieldKey.toLowerCase()) || currentMap.get(normalize(item.label)) || '';

    let status = 'new';
    let action = 'accept';
    let reason = item.reason || 'New candidate field detected from form submission.';

    if (!existingVal) {
      status = 'new';
      action = 'accept';
      reason = item.reason || 'Field is currently empty in your Profile Vault.';
    } else if (existingVal.trim() === incomingVal) {
      status = 'identical';
      action = 'keep';
      reason = 'Value already matches your current Profile Vault.';
    } else {
      status = 'updated';
      action = 'accept';
      reason = `Vault currently has: "${existingVal}". Form contains updated value: "${incomingVal}".`;
    }

    analysis.push({
      fieldId: item.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: item.label,
      currentValue: existingVal,
      incomingValue: incomingVal,
      suggestedValue: incomingVal,
      status,
      action,
      reason,
      section: item.section || 'personal',
      fieldType: item.fieldType || 'short_text',
      approved: status !== 'identical',
    });
  }

  const syncDoc = await ExtensionSync.create({
    userId,
    source,
    formUrl,
    formTitle,
    rawFields: fieldsToSave,
    analysis,
    status: 'pending_review',
  });

  return syncDoc;
};

// @GET /api/profile/pending-syncs
const getPendingSyncs = async (req, res) => {
  try {
    const syncs = await ExtensionSync.find({
      userId: req.user._id,
      status: 'pending_review',
    }).sort({ createdAt: -1 });

    res.json({ syncs, count: syncs.length });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch pending extension syncs' });
  }
};

// @POST /api/profile/verify-sync/:id
const verifyAndMergeSync = async (req, res) => {
  try {
    const userId = req.user._id;
    const syncDoc = await ExtensionSync.findOne({ _id: req.params.id, userId });

    if (!syncDoc) {
      return res.status(404).json({ message: 'Staged extension record not found.' });
    }

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    const { approvedFields = [] } = req.body;
    let fieldsArray = [...(profile.fields || [])];
    let mergedCount = 0;

    for (const field of approvedFields) {
      if (!field.label || field.value === undefined || field.value === null) continue;
      if (field.action === 'keep') continue; // User opted to retain existing vault value

      const valToSave = String(field.value).trim();

      // Check if matches a standard top-level property
      const matchedStdKey = STANDARD_FIELDS.find(
        (k) => k.toLowerCase() === field.fieldId?.toLowerCase() || normalize(k) === normalize(field.label)
      );

      if (matchedStdKey) {
        profile[matchedStdKey] = valToSave;
      }

      // Check dynamic fields array
      const existingIdx = fieldsArray.findIndex(
        (f) => f.id === field.fieldId || normalize(f.label) === normalize(field.label)
      );

      if (existingIdx >= 0) {
        if (field.action === 'append' && fieldsArray[existingIdx].value) {
          fieldsArray[existingIdx].value = `${fieldsArray[existingIdx].value}; ${valToSave}`;
        } else {
          fieldsArray[existingIdx].value = valToSave;
        }
      } else {
        // Append as a new field
        fieldsArray.push({
          id: field.fieldId || `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          section: field.section || 'personal',
          label: field.label,
          fieldType: field.fieldType || 'short_text',
          options: [],
          value: valToSave,
          hidden: false,
          isCustom: true,
          sensitive: false,
        });
      }
      mergedCount++;
    }

    profile.fields = fieldsArray;
    await profile.save();

    // Mark sync record as verified & merged
    syncDoc.status = 'verified_and_merged';
    syncDoc.mergedAt = new Date();
    await syncDoc.save();

    // Log Activity
    await ActivityLog.create({
      userId,
      eventType: 'profile_updated',
      description: `Verified & merged ${mergedCount} field(s) from ${syncDoc.source || 'Chrome Extension'} into Profile Vault.`,
    });

    res.json({
      success: true,
      message: `Successfully verified and merged ${mergedCount} field(s) into your Profile Vault!`,
      profile,
    });
  } catch (err) {
    console.error('Verify & Merge Error:', err);
    res.status(500).json({ message: err.message || 'Failed to verify and merge profile data' });
  }
};

// @POST /api/profile/reject-sync/:id
const rejectSync = async (req, res) => {
  try {
    const userId = req.user._id;
    const syncDoc = await ExtensionSync.findOneAndUpdate(
      { _id: req.params.id, userId },
      { status: 'rejected' },
      { new: true }
    );

    if (!syncDoc) {
      return res.status(404).json({ message: 'Staged extension record not found.' });
    }

    res.json({
      success: true,
      message: 'Extension data review dismissed without modifying Profile Vault.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to dismiss staged record' });
  }
};

// @POST /api/profile/analyze-text
const analyzeTextData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rawText = '', formUrl = '', formTitle = 'Manual Form Scan' } = req.body;

    if (!rawText.trim()) {
      return res.status(400).json({ message: 'Please provide text or form fields to analyze.' });
    }

    const userSettings = req.user.settings || {};
    const prompt = `
You are an expert candidate profile extraction engine.
Analyze the following text from a job application form, company placement portal, or resume:
"""
${rawText.substring(0, 4000)}
"""

Extract all student / candidate details into a JSON object matching this structure:
{
  "detectedNewData": [
    {
      "id": "string (slug)",
      "label": "string (readable field title like Full Name, CGPA, LeetCode Profile, Project Title, Tech Stack, Current City)",
      "value": "string (extracted value)",
      "section": "personal | academics | courses | internships | links | skills | technical_achievements | personal_achievements | current_address | permanent_address",
      "fieldType": "short_text | paragraph | select | file_path",
      "reason": "string (explanation of where and how this field was found)"
    }
  ]
}
`;

    let extracted;
    try {
      extracted = await aiService.extract(prompt, userSettings);
    } catch {
      // Fallback baseline extraction if AI is unavailable
      extracted = { detectedNewData: [] };
    }

    const detectedNewData = Array.isArray(extracted?.detectedNewData)
      ? extracted.detectedNewData
      : Array.isArray(extracted)
      ? extracted
      : [];

    if (detectedNewData.length === 0) {
      return res.status(400).json({ message: 'No candidate profile fields could be detected from the provided text.' });
    }

    const syncDoc = await stageExtensionData({
      userId,
      fieldsToSave: detectedNewData,
      formUrl,
      formTitle,
      source: 'AI Form Scanner',
    });

    res.json({
      success: true,
      message: `AI detected ${detectedNewData.length} field(s). Ready for your verification!`,
      syncDoc,
    });
  } catch (err) {
    console.error('Analyze Text Error:', err);
    res.status(500).json({ message: err.message || 'Failed to analyze text data' });
  }
};

module.exports = {
  stageExtensionData,
  getPendingSyncs,
  verifyAndMergeSync,
  rejectSync,
  analyzeTextData,
};
