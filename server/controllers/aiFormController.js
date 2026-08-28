/**
 * aiFormController.js
 * Handles AI-driven Google Form understanding, semantic vector-based autofill,
 * confidence scoring, and novel field data analysis/saving.
 */

const User = require('../models/User');
const Profile = require('../models/Profile');
const Document = require('../models/Document');
const vectorService = require('../services/vector.service');

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

/**
 * Call configured LLM API to process form questions
 */
async function callLLM(prompt, userSettings) {
  const { apiKey, provider, model } = resolveApiKeyAndProvider(userSettings);

  if (!apiKey) {
    const err = new Error('AI API Key is missing. Please configure your LLM API Key in Settings or Extension Settings.');
    err.isKeyMissing = true;
    err.keyType = 'AI';
    throw err;
  }

  const systemMessage =
    'You are an expert AI form-filling assistant. Understand form questions, map them to candidate database values or generate concise accurate answers, and return valid JSON only.';

  let baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  if (provider === 'openai') baseUrl = 'https://api.openai.com/v1/chat/completions';
  if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  if (provider === 'groq') {
    const modelsToTry = [
      model,
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-70b-8192',
      'llama3-8b-8192',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastErr = null;

    for (const candidate of modelsToTry) {
      try {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: candidate,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
          }),
        });

        const data = await response.json();
        if (data.error) {
          const msg = data.error.message || JSON.stringify(data.error);
          if (msg.includes('does not exist') || msg.includes('not have access') || msg.includes('Rate limit')) {
            lastErr = new Error(msg);
            continue;
          }
          throw new Error(msg);
        }

        const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
        return cleanAndParseJSON(content);
      } catch (err) {
        if (err.message?.includes('does not exist') || err.message?.includes('not have access') || err.message?.includes('Rate limit')) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }

    if (lastErr) throw lastErr;
  }

  const reqBody = {
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
  };

  if (provider === 'openai') {
    reqBody.response_format = { type: 'json_object' };
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(reqBody),
  });

  const data = await response.json();
  if (data.error) {
    const err = new Error(data.error.message || JSON.stringify(data.error));
    if (response.status === 429 || (data.error.message && data.error.message.includes('Rate limit'))) {
      err.isRateLimit = true;
    }
    throw err;
  }

  const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
  return cleanAndParseJSON(content);
}

function cleanAndParseJSON(text) {
  if (!text) throw new Error('Empty response received from LLM.');
  if (typeof text === 'object') return text;

  let cleaned = text
    .replace(/^```[a-z]*\n?/im, '')
    .replace(/\n?```$/im, '')
    .trim();

  const firstCurly = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;

  if (firstCurly !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstCurly, firstBracket);
  } else if (firstCurly !== -1) {
    startIdx = firstCurly;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const endCurly = cleaned.lastIndexOf('}');
    const endBracket = cleaned.lastIndexOf(']');
    const endIdx = Math.max(endCurly, endBracket);

    if (endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  cleaned = cleaned
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, (match) => {
      if (match === '\n' || match === '\r' || match === '\t') return match;
      return '';
    });

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    try {
      const sanitized = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');
      return JSON.parse(sanitized);
    } catch {
      throw new Error(`LLM output format error: ${parseErr.message}`);
    }
  }
}

// @POST /api/ai/form-autofill
const autofillForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const { questions = [], formUrl = '', formTitle = '' } = req.body;

    const [user, profile, documents] = await Promise.all([
      User.findById(userId),
      Profile.findOne({ userId }),
      Document.find({ userId }),
    ]);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please complete your profile first.' });
    }

    const userSettings = user.settings || {};

    // Build vector DB index for user profile & documents
    const vectorIndex = vectorService.buildVectorIndex(profile, documents);

    // Retrieve top 2 semantic context items per question to stay well within token limits
    const questionsWithContext = questions.map((q) => {
      const topContext = vectorService.searchVectorIndex(vectorIndex, q.label, 2);
      return {
        id: q.id,
        label: q.label,
        type: q.type,
        options: q.options || [],
        placeholder: q.placeholder || '',
        relevantContext: topContext.map((c) => ({ label: c.label, value: c.value, key: c.key, score: c.score })),
      };
    });

    // Prepare full candidate profile summary
    const rawProfileSummary = {
      candidateName: profile.candidateName,
      prn: profile.prn,
      collegeEmail: profile.collegeEmail,
      personalEmail: profile.personalEmail,
      phone: profile.phone,
      gender: profile.gender,
      collegeName: profile.collegeName,
      stream: profile.stream,
      branch: profile.branch,
      passingYear: profile.passingYear,
      cgpa: profile.cgpa,
      tenthPercent: profile.tenthPercent,
      twelfthPercent: profile.twelfthPercent,
      resumeLink: profile.resumeLink,
      leetcodeLink: profile.leetcodeLink,
      codechefLink: profile.codechefLink,
      hackerrankLink: profile.hackerrankLink,
      leetcodeScore: profile.leetcodeScore,
      codechefRating: profile.codechefRating,
      projectTitle: profile.projectTitle,
      projectDetails: profile.projectDetails,
      hobby: profile.hobby,
      technicalCertifications: profile.technicalCertifications,
      previousInternships: profile.previousInternships,
      customFields: (profile.fields || [])
        .filter((f) => !f.hidden && f.value)
        .map((f) => ({ label: f.label, value: f.value, key: f.id, sensitive: !!f.sensitive })),
    };

    const prompt = `
Form Title: "${formTitle}"
Form URL: "${formUrl}"

Candidate Database Profile Context:
${JSON.stringify(rawProfileSummary, null, 2)}

Questions to Autofill (with Vector DB similarity matches):
${JSON.stringify(questionsWithContext, null, 2)}

INSTRUCTIONS:
1. For each question in "Questions to Autofill", understand what data is requested.
2. Search the Candidate Database Profile & Vector Context for the exact or best matching candidate value.
3. If the question is an open-ended subjective question (e.g. "Describe your key project", "Why apply?", "Skills summary"), synthesize a high-quality response using the candidate's actual projects, skills, or background. Set matchedField to "AI_GENERATED".
4. CONFIDENCE SCORE: Output a score between 0.00 and 1.00 representing how confident you are in the accuracy of the answer.
5. MISSING DATA RULE: If no relevant data is present in the database profile for this question, or if you are uncertain, return "value": "", "matchedField": null, and "confidenceScore": 0.00. NEVER invent false candidate data (like fake phone numbers, fake emails, or fake PRN).
6. SENSITIVE GATE: Set "sensitive": true if the field is Aadhar, PAN, or marked sensitive in profile.

Return ONLY a JSON object with this exact structure:
{
  "answers": [
    {
      "questionId": "string (matching question id)",
      "label": "string",
      "value": "string (the value to fill, or empty string if no data)",
      "confidenceScore": number (0.0 to 1.0),
      "matchedField": "string | null (e.g. 'collegeEmail' or 'AI_GENERATED')",
      "reason": "string (concise explanation of why/how this was matched)",
      "sensitive": boolean
    }
  ]
}
`;

    // Call LLM with vector database context
    let aiResult;
    try {
      aiResult = await callLLM(prompt, userSettings);
    } catch (llmErr) {
      console.warn('LLM API call failed or key missing. Falling back to direct database vector matching:', llmErr.message);
      // Direct vector + rule matching from user's MongoDB database profile
      const fallbackAnswers = performDatabaseFallbackMatching(questions, profile, vectorIndex);
      return res.json({
        ok: true,
        formTitle,
        isFallback: true,
        message: 'Autofilled directly from database profile (vector match fallback)',
        answers: fallbackAnswers,
      });
    }

    res.json({
      ok: true,
      formTitle,
      answers: aiResult.answers || [],
    });
  } catch (err) {
    console.error('AI Form Autofill Error:', err);
    res.status(500).json({ ok: false, message: err.message || 'AI Form Autofill failed.' });
  }
};

/**
 * Direct matching engine against user's MongoDB Database Profile & Vector Index
 */
function performDatabaseFallbackMatching(questions, profile, vectorIndex) {
  return questions.map((q) => {
    // 1. Vector similarity search in database profile
    const searchHits = vectorService.searchVectorIndex(vectorIndex, q.label, 3);
    const topHit = searchHits && searchHits[0];

    if (topHit && topHit.score >= 0.40 && topHit.value) {
      return {
        questionId: q.id,
        label: q.label,
        value: String(topHit.value),
        confidenceScore: Math.min(0.95, Number((topHit.score + 0.1).toFixed(2))),
        matchedField: topHit.key || 'DB_PROFILE',
        reason: `Matched database field '${topHit.label}' via Vector Similarity (${Math.round(topHit.score * 100)}%)`,
        sensitive: topHit.sensitive || false,
      };
    }

    // 2. Direct key mapping on MongoDB profile
    const labelLower = q.label.toLowerCase();
    let matchedValue = '';
    let matchedField = null;
    let confidence = 0.0;

    if (labelLower.includes('prn') || labelLower.includes('roll')) {
      matchedValue = profile.prn; matchedField = 'prn'; confidence = 0.95;
    } else if (labelLower.includes('college email') || (labelLower.includes('email') && labelLower.includes('college'))) {
      matchedValue = profile.collegeEmail || profile.personalEmail; matchedField = 'collegeEmail'; confidence = 0.95;
    } else if (labelLower.includes('email')) {
      matchedValue = profile.personalEmail || profile.collegeEmail; matchedField = 'personalEmail'; confidence = 0.90;
    } else if (labelLower.includes('phone') || labelLower.includes('mobile') || labelLower.includes('contact no')) {
      matchedValue = profile.phone; matchedField = 'phone'; confidence = 0.95;
    } else if (labelLower.includes('name of student') || labelLower.includes('full name') || labelLower.includes('candidate name') || labelLower === 'name') {
      matchedValue = profile.candidateName; matchedField = 'candidateName'; confidence = 0.95;
    } else if (labelLower.includes('gender')) {
      matchedValue = profile.gender; matchedField = 'gender'; confidence = 0.95;
    } else if (labelLower.includes('college') || labelLower.includes('institute')) {
      matchedValue = profile.collegeName; matchedField = 'collegeName'; confidence = 0.90;
    } else if (labelLower.includes('branch')) {
      matchedValue = profile.branch; matchedField = 'branch'; confidence = 0.95;
    } else if (labelLower.includes('course') || labelLower.includes('stream') || labelLower.includes('degree')) {
      matchedValue = profile.stream; matchedField = 'stream'; confidence = 0.90;
    } else if (labelLower.includes('graduation') || labelLower.includes('passing year')) {
      matchedValue = profile.passingYear; matchedField = 'passingYear'; confidence = 0.90;
    } else if (labelLower.includes('10th') || labelLower.includes('ssc')) {
      matchedValue = profile.tenthPercent; matchedField = 'tenthPercent'; confidence = 0.90;
    } else if (labelLower.includes('12th') || labelLower.includes('hsc')) {
      matchedValue = profile.twelfthPercent; matchedField = 'twelfthPercent'; confidence = 0.90;
    } else if (labelLower.includes('cgpa') || labelLower.includes('btech %') || labelLower.includes('be %')) {
      matchedValue = profile.cgpa; matchedField = 'cgpa'; confidence = 0.90;
    }

    if (matchedValue) {
      return {
        questionId: q.id,
        label: q.label,
        value: String(matchedValue),
        confidenceScore: confidence,
        matchedField,
        reason: `Matched database field '${matchedField}' directly from MongoDB profile`,
        sensitive: false,
      };
    }

    return {
      questionId: q.id,
      label: q.label,
      value: '',
      confidenceScore: 0.0,
      matchedField: null,
      reason: 'No matching data in candidate database profile',
      sensitive: false,
    };
  });
}

// @POST /api/ai/analyze-new-data
const analyzeNewData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { formFields = [], formTitle = '' } = req.body;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const existingProfileData = {
      candidateName: profile.candidateName || '',
      prn: profile.prn || '',
      collegeEmail: profile.collegeEmail || '',
      personalEmail: profile.personalEmail || '',
      phone: profile.phone || '',
      gender: profile.gender || '',
      collegeName: profile.collegeName || '',
      stream: profile.stream || '',
      branch: profile.branch || '',
      passingYear: profile.passingYear || '',
      cgpa: profile.cgpa || '',
      tenthPercent: profile.tenthPercent || '',
      twelfthPercent: profile.twelfthPercent || '',
      resumeLink: profile.resumeLink || '',
      leetcodeLink: profile.leetcodeLink || '',
      codechefLink: profile.codechefLink || '',
      hackerrankLink: profile.hackerrankLink || '',
      leetcodeScore: profile.leetcodeScore || '',
      codechefRating: profile.codechefRating || '',
      projectTitle: profile.projectTitle || '',
      projectDetails: profile.projectDetails || '',
      hobby: profile.hobby || '',
      technicalCertifications: profile.technicalCertifications || '',
      previousInternships: profile.previousInternships || '',
      fields: (profile.fields || []).map((f) => ({ label: f.label, value: f.value, id: f.id })),
    };

    const user = await User.findById(userId);
    const userSettings = user.settings || {};

    const prompt = `
Form Title: "${formTitle}"

Existing Candidate Database Profile:
${JSON.stringify(existingProfileData, null, 2)}

Fields & Entered Values Scanned from Form:
${JSON.stringify(formFields, null, 2)}

INSTRUCTIONS:
1. Analyze the fields and values scanned from the form.
2. Compare each filled field against the candidate's existing database profile.
3. Identify ANY NEW candidate information that is present in the form but MISSING or DIFFERENT in the database profile (for example: a new PRN, updated CGPA, new phone number, new GitHub/LeetCode link, new certification, or custom field).
4. Ignore generic non-candidate form questions (like "Do you agree to terms?", "Select your batch timing", "Today's date").
5. Return ONLY a JSON object with proposed additions/updates:

{
  "detectedNewData": [
    {
      "id": "string (suggested unique key/slug)",
      "label": "string (human-readable field label)",
      "value": "string (the new value found)",
      "section": "personal | academic | competitive_coding | projects | dynamic",
      "fieldType": "short_text | paragraph | date | select",
      "isNew": true,
      "reason": "string (e.g. 'Found PRN value in form which was empty in DB')"
    }
  ]
}
`;

    let result;
    try {
      result = await callLLM(prompt, userSettings);
    } catch (llmErr) {
      if (llmErr.isKeyMissing) {
        return res.status(400).json({
          isKeyMissing: true,
          keyType: 'AI',
          message: 'AI API Key is missing. Please configure your LLM API Key in Settings.',
        });
      }
      throw llmErr;
    }

    res.json({
      ok: true,
      detectedNewData: result.detectedNewData || [],
    });
  } catch (err) {
    console.error('Analyze New Data Error:', err);
    res.status(500).json({ ok: false, message: err.message || 'Failed to analyze form for new data.' });
  }
};

// @POST /api/ai/sync-new-data
const syncNewData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fieldsToSave = [] } = req.body;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const stdKeys = [
      'candidateName',
      'prn',
      'collegeEmail',
      'personalEmail',
      'phone',
      'gender',
      'collegeName',
      'stream',
      'branch',
      'passingYear',
      'hobby',
      'cgpa',
      'tenthPercent',
      'twelfthPercent',
      'technicalCertifications',
      'previousInternships',
      'projectTitle',
      'projectDetails',
      'codechefRating',
      'codechefLink',
      'hackerrankRating',
      'hackerrankLink',
      'leetcodeScore',
      'leetcodeLink',
      'resumeLink',
    ];

    let fieldsArray = profile.fields || [];

    for (const item of fieldsToSave) {
      if (!item.label || item.value === undefined) continue;

      // Check if it matches a standard top-level property
      const matchedStdKey = stdKeys.find(
        (k) => k.toLowerCase() === item.id?.toLowerCase() || k.toLowerCase() === item.label?.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      if (matchedStdKey) {
        profile[matchedStdKey] = String(item.value);
      }

      // Also ensure it is present in dynamic fields array so it shows in the builder
      const existingFieldIndex = fieldsArray.findIndex(
        (f) => f.id === item.id || f.label.toLowerCase() === item.label.toLowerCase()
      );

      if (existingFieldIndex >= 0) {
        fieldsArray[existingFieldIndex].value = String(item.value);
      } else {
        fieldsArray.push({
          id: item.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          section: item.section || 'personal',
          label: item.label,
          fieldType: item.fieldType || 'short_text',
          options: item.options || [],
          value: String(item.value),
          hidden: false,
          isCustom: true,
          sensitive: false,
        });
      }
    }

    profile.fields = fieldsArray;
    await profile.save();

    res.json({
      ok: true,
      message: `Successfully saved ${fieldsToSave.length} new/updated field(s) to your database profile!`,
      profile,
    });
  } catch (err) {
    console.error('Sync New Data Error:', err);
    res.status(500).json({ ok: false, message: err.message || 'Failed to save new data to profile.' });
  }
};

module.exports = {
  autofillForm,
  analyzeNewData,
  syncNewData,
};
