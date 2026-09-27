const ExtensionSync = require('../models/ExtensionSync');
const Profile = require('../models/Profile');
const ActivityLog = require('../models/ActivityLog');
const aiService = require('../services/aiExtraction.service');
const fieldMapper = require('../services/fieldMapper.service');
const resumeParser = require('../services/resumeParser.service');

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
const stageExtensionData = async ({
  userId,
  fieldsToSave = [],
  formUrl = '',
  formTitle = '',
  fileName = '',
  source = 'Chrome Extension',
  metadata = {}
}) => {
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
  const seenKeys = new Set();

  for (const item of fieldsToSave) {
    if (!item.label || item.value === undefined || item.value === null) continue;

    // Check semantic mapping
    const mapped = fieldMapper.mapToStandardField(item.id || item.label);
    const standardKey = mapped ? mapped.fieldId : null;
    const label = mapped ? mapped.label : item.label;
    const section = mapped ? mapped.section : item.section || 'personal';
    const fieldType = mapped ? mapped.fieldType : item.fieldType || 'short_text';
    const fieldId = standardKey || item.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    if (seenKeys.has(fieldId.toLowerCase())) continue;
    seenKeys.add(fieldId.toLowerCase());

    const incomingVal = fieldMapper.normalizeFieldValue(fieldId, item.value);
    if (!incomingVal) continue;

    const lookupKey = standardKey ? standardKey.toLowerCase() : fieldId.toLowerCase();
    const existingVal =
      currentMap.get(lookupKey) ||
      currentMap.get(normalize(label)) ||
      '';

    let status = 'new';
    let action = 'accept';
    let reason = item.reason || 'New candidate field detected from form submission.';
    const confidence = typeof item.confidence === 'number' ? item.confidence : 0.95;

    if (!existingVal) {
      status = 'new';
      action = 'accept';
      reason = item.reason || 'Field is currently empty in your Profile Vault.';
    } else if (existingVal.trim().toLowerCase() === incomingVal.trim().toLowerCase()) {
      status = 'identical';
      action = 'keep';
      reason = 'Value already matches your current Profile Vault.';
    } else {
      const isMulti =
        fieldId.toLowerCase().includes('skill') ||
        fieldId.toLowerCase().includes('certification') ||
        fieldId.toLowerCase().includes('achievement');

      if (isMulti) {
        status = 'updated';
        action = 'append';
        reason = `Vault has existing entries. Incoming data contains additional or updated items.`;
      } else {
        const isNumeric = /^[0-9.]+$/.test(existingVal) && /^[0-9.]+$/.test(incomingVal);
        if (isNumeric && Math.abs(parseFloat(existingVal) - parseFloat(incomingVal)) > 1.5) {
          status = 'conflict';
          reason = `Significant variation: Vault has "${existingVal}", incoming value is "${incomingVal}".`;
        } else {
          status = 'updated';
          reason = `Vault currently has: "${existingVal}". Incoming value: "${incomingVal}".`;
        }
        action = 'accept';
      }
    }

    analysis.push({
      fieldId,
      label,
      currentValue: existingVal,
      incomingValue: incomingVal,
      suggestedValue: incomingVal,
      status,
      action,
      reason,
      section,
      fieldType,
      approved: status !== 'identical',
      confidence,
    });
  }

  const syncDoc = await ExtensionSync.create({
    userId,
    source,
    formUrl,
    formTitle: formTitle || fileName || 'Candidate Data Scan',
    fileName,
    metadata,
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

// @GET /api/profile/sync-history
const getSyncHistory = async (req, res) => {
  try {
    const history = await ExtensionSync.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, history, count: history.length });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch sync history' });
  }
};

// @POST /api/profile/verify-sync/:id
const verifyAndMergeSync = async (req, res) => {
  try {
    const userId = req.user._id;
    const syncDoc = await ExtensionSync.findOne({ _id: req.params.id, userId });

    if (!syncDoc) {
      return res.status(404).json({ message: 'Staged sync record not found.' });
    }

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    const { approvedFields = [] } = req.body;
    let fieldsArray = [...(profile.fields || [])];
    let mergedCount = 0;
    const fieldsChanged = [];
    const previousValues = {};

    for (const field of approvedFields) {
      if (!field.label || field.value === undefined || field.value === null) continue;
      if (field.action === 'keep') continue; // User opted to retain existing vault value

      const valToSave = String(field.value).trim();

      const provenanceInfo = {
        source: syncDoc.source || 'AI Resume Import',
        fileName: syncDoc.fileName || syncDoc.formTitle || '',
        importedAt: new Date(),
        method: syncDoc.source === 'AI Resume Import' ? 'AI Resume Import' : 'Form Sync',
      };

      // Check if matches a standard top-level property
      const matchedStdKey = STANDARD_FIELDS.find(
        (k) => k.toLowerCase() === field.fieldId?.toLowerCase() || normalize(k) === normalize(field.label)
      );

      if (matchedStdKey) {
        previousValues[matchedStdKey] = profile[matchedStdKey] || '';
        profile[matchedStdKey] = valToSave;
        fieldsChanged.push(matchedStdKey);
      }

      // Check dynamic fields array
      const existingIdx = fieldsArray.findIndex(
        (f) => f.id === field.fieldId || normalize(f.label) === normalize(field.label)
      );

      if (existingIdx >= 0) {
        const currentTargetId = fieldsArray[existingIdx].id || fieldsArray[existingIdx].label;
        previousValues[currentTargetId] = fieldsArray[existingIdx].value || '';

        if (field.action === 'append' && fieldsArray[existingIdx].value) {
          // Merge logic (deduplicate items)
          const existingParts = fieldsArray[existingIdx].value.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
          const newParts = valToSave.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
          const combined = Array.from(new Set([...existingParts, ...newParts])).join(', ');
          fieldsArray[existingIdx].value = combined || `${fieldsArray[existingIdx].value}; ${valToSave}`;
        } else {
          fieldsArray[existingIdx].value = valToSave;
        }

        fieldsArray[existingIdx].provenance = provenanceInfo;
        fieldsChanged.push(fieldsArray[existingIdx].label);
      } else {
        // Append as a new dynamic field
        const newFieldId = field.fieldId || `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        fieldsArray.push({
          id: newFieldId,
          section: field.section || 'personal',
          label: field.label,
          fieldType: field.fieldType || 'short_text',
          options: [],
          value: valToSave,
          hidden: false,
          isCustom: true,
          sensitive: false,
          provenance: provenanceInfo,
        });
        fieldsChanged.push(field.label);
      }
      mergedCount++;
    }

    profile.fields = fieldsArray;
    await profile.save();

    // Mark sync record as verified & merged
    syncDoc.status = 'verified_and_merged';
    syncDoc.mergedAt = new Date();
    await syncDoc.save();

    // Log Activity with rollback / provenance metadata
    const activity = await ActivityLog.create({
      userId,
      eventType: 'profile_updated',
      description: `Verified & merged ${mergedCount} field(s) from ${syncDoc.source || 'Import'} into Profile Vault.`,
      metadata: {
        source: syncDoc.source === 'AI Resume Import' ? 'resume_import' : 'form_sync',
        fileName: syncDoc.fileName || syncDoc.formTitle || '',
        fieldsChanged,
        previousValues,
        mergedCount,
        syncId: syncDoc._id,
      },
    });

    res.json({
      success: true,
      message: `Successfully verified and merged ${mergedCount} field(s) into your Profile Vault!`,
      profile,
      activityId: activity._id,
    });
  } catch (err) {
    console.error('Verify & Merge Error:', err);
    res.status(500).json({ message: err.message || 'Failed to verify and merge profile data' });
  }
};

// @POST /api/profile/undo-update/:logId
const undoProfileUpdate = async (req, res) => {
  try {
    const userId = req.user._id;
    const log = await ActivityLog.findOne({ _id: req.params.logId, userId, eventType: 'profile_updated' });

    if (!log || !log.metadata || !log.metadata.previousValues) {
      return res.status(404).json({ message: 'No rollback snapshot available for this update.' });
    }

    let profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });

    const prev = log.metadata.previousValues;
    const revertedFields = [];

    // Revert top-level fields
    STANDARD_FIELDS.forEach((key) => {
      if (prev[key] !== undefined) {
        profile[key] = prev[key];
        revertedFields.push(key);
      }
    });

    // Revert dynamic fields array
    profile.fields = (profile.fields || []).map((f) => {
      const match = prev[f.id] !== undefined ? prev[f.id] : prev[f.label];
      if (match !== undefined) {
        revertedFields.push(f.label);
        return { ...f.toObject(), value: match };
      }
      return f;
    });

    await profile.save();

    // Log rollback activity
    await ActivityLog.create({
      userId,
      eventType: 'profile_updated',
      description: `Rolled back profile changes from: "${log.description}"`,
      metadata: {
        source: 'rollback',
        revertedFields,
        originalLogId: log._id,
      },
    });

    res.json({
      success: true,
      message: `Successfully restored previous profile values for ${revertedFields.length} field(s)!`,
      profile,
    });
  } catch (err) {
    console.error('Undo Update Error:', err);
    res.status(500).json({ message: err.message || 'Failed to roll back profile changes.' });
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
      return res.status(404).json({ message: 'Staged sync record not found.' });
    }

    res.json({
      success: true,
      message: 'Incoming data review dismissed without modifying Profile Vault.',
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
${rawText.substring(0, 4500)}
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
      "reason": "string (explanation of where and how this field was found)",
      "confidence": 0.95
    }
  ]
}
`;

    let extracted;
    try {
      extracted = await aiService.extract(prompt, userSettings);
    } catch {
      extracted = { detectedNewData: [] };
    }

    let detectedNewData = Array.isArray(extracted?.detectedNewData)
      ? extracted.detectedNewData
      : Array.isArray(extracted)
      ? extracted
      : [];

    if (detectedNewData.length === 0) {
      // Deterministic regex fallback
      const fallback = resumeParser.deterministicFallbackExtract(rawText);
      detectedNewData = fallback.fields || [];
    }

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
      message: `AI detected ${syncDoc.analysis.length} field(s). Ready for your verification!`,
      syncDoc,
    });
  } catch (err) {
    console.error('Analyze Text Error:', err);
    res.status(500).json({ message: err.message || 'Failed to analyze text data' });
  }
};

// @POST /api/profile/analyze-resume
const analyzeResumeData = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF or DOCX resume file.' });
    }

    // 1. Text extraction & cleaning
    let cleanedText;
    try {
      cleanedText = await resumeParser.extractResumeText(req.file);
    } catch (parseErr) {
      return res.status(parseErr.status || 400).json({ message: parseErr.message });
    }

    // 2. AI Profile extraction with injection defense
    const userSettings = req.user.settings || {};
    const extractedFields = await resumeParser.analyzeResumeWithAI(cleanedText, userSettings);

    if (!extractedFields || extractedFields.length === 0) {
      return res.status(400).json({
        message: 'No candidate profile fields could be detected in this resume document.',
      });
    }

    // 3. Diff analysis against active profile
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = await Profile.create({ userId });
    }

    const analysis = resumeParser.processAndDiffResumeFields(extractedFields, profile);

    if (analysis.length === 0) {
      return res.status(400).json({
        message: 'No valid candidate fields could be parsed from the resume.',
      });
    }

    // Compute summary breakdown
    const summary = {
      total: analysis.length,
      new: analysis.filter((a) => a.status === 'new').length,
      updated: analysis.filter((a) => a.status === 'updated').length,
      identical: analysis.filter((a) => a.status === 'identical').length,
      conflict: analysis.filter((a) => a.status === 'conflict').length,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    };

    // 4. Stage into ExtensionSync (DATABASE SAFETY: Profile is NEVER updated here!)
    const syncDoc = await ExtensionSync.create({
      userId,
      source: 'AI Resume Import',
      fileName: req.file.originalname,
      formTitle: `Resume: ${req.file.originalname}`,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        extractedAt: new Date(),
        summary,
      },
      rawFields: extractedFields,
      analysis,
      status: 'pending_review',
    });

    res.json({
      success: true,
      message: `Resume analyzed successfully! AI detected ${analysis.length} field(s) (${summary.new} new, ${summary.updated} updated, ${summary.conflict} conflicts). Review them below.`,
      syncDoc,
      summary,
    });
  } catch (err) {
    console.error('Analyze Resume Error:', err);
    res.status(500).json({ message: err.message || 'Failed to analyze resume' });
  }
};

module.exports = {
  stageExtensionData,
  getPendingSyncs,
  getSyncHistory,
  verifyAndMergeSync,
  undoProfileUpdate,
  rejectSync,
  analyzeTextData,
  analyzeResumeData,
};
