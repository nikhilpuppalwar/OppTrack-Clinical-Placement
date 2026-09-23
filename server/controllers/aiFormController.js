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
  let provider = (userSettings.llmProvider || process.env.LLM_PROVIDER || 'groq').toLowerCase().trim();
  let apiKey = (userSettings.llmApiKey || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY)?.trim();
  let model = (userSettings.llmModel || process.env.LLM_MODEL)?.trim();
  let baseUrl = userSettings.llmBaseUrl?.trim() || '';

  if (!userSettings.llmProvider) {
    if (apiKey) {
      if (apiKey.startsWith('gsk_')) provider = 'groq';
      else if (apiKey.startsWith('sk-or-')) provider = 'openrouter';
      else if (apiKey.startsWith('AIzaSy')) provider = 'gemini';
      else if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-')) provider = 'openai';
    }
  }

  // Model safety validation per provider according to official documentation
  if (provider === 'groq') {
    const deprecatedGroqModels = [
      'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it',
      'llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'qwen/qwen3.8-27b'
    ];
    if (!model || model === 'other' || deprecatedGroqModels.includes(model)) {
      model = 'openai/gpt-oss-120b';
    }
  } else if (provider === 'gemini') {
    const deprecatedGeminiModels = ['gemini-2.0-flash-exp', 'gemini-1.0-pro'];
    if (!model || model === 'other' || deprecatedGeminiModels.includes(model)) {
      model = 'gemini-2.0-flash';
    }
  } else if (provider === 'openai') {
    const deprecatedOpenAiModels = ['gpt-3.5-turbo', 'gpt-3.5-turbo-instruct', 'gpt-4-0613', 'gpt-4-1106-preview'];
    if (!model || model === 'other' || deprecatedOpenAiModels.includes(model)) {
      model = 'gpt-4o-mini';
    }
  } else if (provider === 'openrouter') {
    if (!model || !model.includes('/') || model === 'other') {
      model = 'meta-llama/llama-3.3-70b-instruct';
    }
  }

  return { apiKey, provider, model, baseUrl };
}

/**
 * Call configured LLM API to process form questions
 */
async function callLLM(prompt, userSettings) {
  const { apiKey, provider, model, baseUrl: customBaseUrl } = resolveApiKeyAndProvider(userSettings);

  if (!apiKey) {
    const err = new Error('AI API Key is missing. Please configure your LLM API Key in Settings or Extension Settings.');
    err.isKeyMissing = true;
    err.keyType = 'AI';
    throw err;
  }

  const systemMessage =
    'You are an expert AI form-filling assistant. Understand form questions, map them to candidate database values or generate concise accurate answers, and return valid JSON only.';

  if (provider === 'gemini') {
    const selectedModel = model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemMessage + '\n\n' + prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await response.json();
    if (data.error) {
      const err = new Error(`Google Gemini Error: ${data.error.message || JSON.stringify(data.error)}`);
      if (response.status === 429) err.isRateLimit = true;
      throw err;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return cleanAndParseJSON(text);
  }

  let baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  if (customBaseUrl) {
    baseUrl = customBaseUrl.endsWith('/chat/completions')
      ? customBaseUrl
      : customBaseUrl.replace(/\/+$/, '') + '/chat/completions';
  } else if (provider === 'openai') baseUrl = 'https://api.openai.com/v1/chat/completions';
  else if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  else if (provider === 'deepseek') baseUrl = 'https://api.deepseek.com/chat/completions';
  else if (provider === 'together') baseUrl = 'https://api.together.xyz/v1/chat/completions';
  else if (provider === 'mistral') baseUrl = 'https://api.mistral.ai/v1/chat/completions';
  else if (provider === 'ollama') baseUrl = 'http://localhost:11434/v1/chat/completions';

  if (provider === 'groq') {
    const modelsToTry = [
      model,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-specdec',
      'llama-3.1-70b-versatile',
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

INSTRUCTIONS & QUESTION FORMAT RULES:
1. Understand what data each question requests. Search Candidate Database Profile Context & Vector matches for candidate's actual data.
2. QUESTION FORMAT SPECIFIC RULES:
   - CHECKBOX (multi-select): If question type is "checkbox", the candidate can match multiple options. Compare candidate's skills, certifications, degrees, or background against the provided "options" array. The "value" MUST be a comma-separated list of the EXACT matching option strings from "options" (e.g. "Java, Python, Git").
   - RADIO / MULTIPLE CHOICE: If question type is "radio", select the single best matching option from the provided "options" array. The "value" MUST be the EXACT option string from the provided "options" array (e.g., if options are ["Male", "Female", "Other"] and profile gender is "Male", return "Male"). For rating scales (1 to 5, 1 to 10), return the matching rating number.
   - PICKLIST / DROPDOWN / SELECT: If question type is "dropdown", pick the single EXACT option string from the provided "options" array that best matches the candidate's data (e.g., if branch is "Computer Science and Engineering" and options are ["CS", "IT", "Mechanical"], return "CS").
   - SHORT ANSWER (text, email, tel/phone, number, url, prn/roll): Provide the exact, accurate candidate factual data.
   - PARAGRAPH (long answer / subjective): Synthesize a professional, compelling answer using the candidate's real projects, skills, or background. Set matchedField to "AI_GENERATED".
   - DATE: Return in standard ISO format "YYYY-MM-DD" (e.g. "2002-05-14").
   - TIME: Return in "HH:MM" format (e.g. "10:00").
3. CONFIDENCE SCORE: Output a score between 0.00 and 1.00 representing confidence in the accuracy of the answer.
4. MISSING DATA RULE: If no relevant data is present in the database profile for this question, or if you are uncertain, return "value": "", "matchedField": null, and "confidenceScore": 0.00. NEVER invent false candidate data (like fake phone numbers, fake emails, or fake PRN).
5. SENSITIVE GATE: Set "sensitive": true if the field is Aadhar, PAN, or marked sensitive in profile.

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

function findBestOptionMatch(options, targetValue) {
  if (!Array.isArray(options) || !options.length || targetValue === undefined || targetValue === null) return targetValue;
  const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetStr = String(targetValue).trim().toLowerCase();
  const targetNorm = clean(targetValue);
  if (!targetNorm) return targetValue;

  let bestOption = targetValue;
  let highestScore = 0;

  const targetTokens = targetStr.split(/[^a-z0-9]+/).filter((t) => t.length > 0);
  const targetAcronym = targetTokens.map((t) => t[0]).join('');

  for (const opt of options) {
    if (!opt) continue;
    const optStr = String(opt).trim().toLowerCase();
    const optNorm = clean(opt);
    if (!optNorm) continue;

    if (optNorm === targetNorm) return opt; // Exact normalized match

    let score = 0;
    if (optNorm.includes(targetNorm) || targetNorm.includes(optNorm)) {
      score += 0.65;
    }

    const optTokens = optStr.split(/[^a-z0-9]+/).filter((t) => t.length > 0);
    const common = optTokens.filter((t) => t.length > 1 && targetTokens.includes(t));
    if (common.length > 0) {
      score += (common.length / Math.max(optTokens.length, targetTokens.length)) * 0.45;
    }

    const optAcronym = optTokens.map((t) => t[0]).join('');
    if ((targetAcronym && optNorm === targetAcronym) || (optAcronym && targetNorm === optAcronym)) {
      score += 0.85;
    }

    if (score > highestScore) {
      highestScore = score;
      bestOption = opt;
    }
  }

  return highestScore >= 0.25 ? bestOption : targetValue;
}

function matchCheckboxOptions(options, candidateTexts = []) {
  if (!Array.isArray(options) || !options.length) return '';
  const allCandidateWords = candidateTexts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matched = options.filter((opt) => {
    if (!opt) return false;
    const optTrimmed = opt.trim().toLowerCase();
    if (!optTrimmed) return false;

    // 1. Exact phrase/word match in text with punctuation/word boundaries
    const escaped = optTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9+])${escaped}([^a-z0-9+]|$)`, 'i');
    if (regex.test(allCandidateWords)) return true;

    // 2. If multi-word option, check if all major words exist
    const words = optTrimmed.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 1 && words.every((w) => allCandidateWords.includes(w))) {
      return true;
    }

    return false;
  });

  return matched.join(', ');
}

/**
 * Dynamic Semantic Matching Engine against candidate profile & dynamic vault attributes
 * 100% Dynamic: Zero rule-based hardcoded if/else statements.
 * Matches any question via multi-vector semantic scoring and dynamic options resolution.
 */
function performDatabaseFallbackMatching(questions, profile, vectorIndex) {
  return questions.map((q) => {
    // 1. Dynamic Vector semantic similarity search across candidate profile & dynamic vault fields
    const searchHits = vectorService.searchVectorIndex(vectorIndex, q.label, 3);
    const topHit = searchHits && searchHits[0];

    if (topHit && topHit.score >= 0.28 && topHit.value !== undefined && topHit.value !== null && String(topHit.value).trim()) {
      let finalVal = String(topHit.value);

      // Dynamic option selection for radio / dropdown / picklist
      if ((q.type === 'radio' || q.type === 'dropdown') && q.options?.length) {
        finalVal = findBestOptionMatch(q.options, finalVal);
      } else if (q.type === 'checkbox' && q.options?.length) {
        const candidateContexts = [
          topHit.value,
          profile.technicalCertifications,
          profile.projectDetails,
          profile.projectTitle,
          profile.branch,
          profile.stream,
          profile.hobby,
        ];
        const multi = matchCheckboxOptions(q.options, candidateContexts);
        if (multi) finalVal = multi;
      }

      return {
        questionId: q.id,
        label: q.label,
        value: finalVal,
        confidenceScore: Math.min(0.98, Number((topHit.score + 0.15).toFixed(2))),
        matchedField: topHit.key || 'DB_PROFILE',
        reason: `Matched candidate attribute '${topHit.label}' dynamically (${Math.round(topHit.score * 100)}% semantic score)`,
        sensitive: topHit.sensitive || false,
      };
    }

    // Dynamic non-match: when question has no candidate data in Profile Vault
    return {
      questionId: q.id,
      label: q.label,
      value: '',
      confidenceScore: 0.0,
      matchedField: null,
      reason: 'No matching candidate information found in Profile Vault',
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

Questions & Fields Scanned from Form:
${JSON.stringify(formFields, null, 2)}

INSTRUCTIONS:
1. Analyze all fields and questions scanned from the form.
2. Compare each field against the candidate's existing database profile:
   A) NEW/UPDATED VALUE: If the form contains an entered value that is missing or different in the database profile (e.g., updated CGPA, new phone, PRN, LeetCode link), suggest it with that value.
   B) MISSING FIELD REQUIREMENT: If the form asks for candidate information (e.g., "Father's Name", "Alternate Phone", "Current Address", "JEE Score", "Backlogs details") that does NOT exist in the database profile, suggest it as a new dynamic field. Set "value" to whatever was entered, or "" if left blank.
   C) FILE UPLOAD REQUIREMENT: If the form asks for a file attachment (resume, marksheet, id card, photo), suggest it with fieldType: "file_path" and reason: "File upload required by this placement form."
3. Ignore generic non-candidate form questions (like "I agree to terms", "Captcha", "Confirm").
4. Return ONLY a JSON object with this exact structure:

{
  "detectedNewData": [
    {
      "id": "string (unique slug)",
      "label": "string (human-readable field label)",
      "value": "string (value found or suggested)",
      "section": "personal | academic | competitive_coding | projects | documents | dynamic",
      "fieldType": "short_text | paragraph | date | select | file_path",
      "isNew": true,
      "isFile": boolean,
      "reason": "string (e.g. 'Required by this form. Add to Profile Vault for future autofill.')"
    }
  ]
}
`;

    let result;
    try {
      result = await callLLM(prompt, userSettings);
    } catch (llmErr) {
      console.warn('AI form analysis LLM error, using intelligent profile diff fallback:', llmErr.message);
      // Intelligent fallback diff against profile
      const fallbackNewData = [];
      const vectorIndex = vectorService.buildVectorIndex(profile);

      formFields.forEach((field, i) => {
        if (!field.label) return;
        const hits = vectorService.searchVectorIndex(vectorIndex, field.label, 1);
        const topHit = hits && hits[0];
        const isMatchedInProfile = topHit && topHit.score >= 0.50 && topHit.value;

        if (!isMatchedInProfile) {
          const isFile = field.type === 'file' || field.label.toLowerCase().includes('upload') || field.label.toLowerCase().includes('resume');
          fallbackNewData.push({
            id: `field_${Date.now()}_${i}`,
            label: field.label,
            value: field.value || '',
            section: isFile ? 'documents' : 'dynamic',
            fieldType: isFile ? 'file_path' : (field.type === 'paragraph' ? 'paragraph' : 'short_text'),
            isNew: true,
            isFile,
            reason: isFile
              ? 'File upload required by this placement form. Add to your Profile Vault.'
              : 'Field is currently missing from your Profile Vault. Add it for instant autofill next time.',
          });
        }
      });

      result = { detectedNewData: fallbackNewData };
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
    const { fieldsToSave = [], formUrl = '', formTitle = '' } = req.body;

    if (!fieldsToSave.length) {
      return res.json({ ok: true, message: 'No fields provided.' });
    }

    const { stageExtensionData } = require('./extensionSyncController');
    const staged = await stageExtensionData({
      userId,
      fieldsToSave,
      formUrl,
      formTitle,
      source: 'Chrome Extension',
    });

    res.json({
      ok: true,
      staged: true,
      syncId: staged._id,
      message: `Candidate data safely sent to your OppTrack Profile Vault! Please open OppTrack to review and verify the AI merge recommendations before saving.`,
      analysisCount: staged.analysis.length,
    });
  } catch (err) {
    console.error('Sync New Data Error:', err);
    res.status(500).json({ ok: false, message: err.message || 'Failed to stage new data.' });
  }
};

module.exports = {
  autofillForm,
  analyzeNewData,
  syncNewData,
};
