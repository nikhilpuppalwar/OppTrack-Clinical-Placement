/**
 * aiExtraction.service.js
 * Calls LLM API to extract structured placement opportunity data from raw email text.
 * Returns both flat fields AND a structured `sections` array for the dynamic field builder.
 */

const SCHEMA_PROMPT = `You are a placement/internship opportunity extractor for a college student's tracker app. 
You will receive RAW email text that varies wildly in format — some are internship-only, 
some are placement-only, some offer internship+PPO, some are off-campus drives. Fields may 
appear in any order, with different labels, bullet styles, or missing entirely. 
Extract what is present; never fabricate what is absent.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

═══════════════════════════════════════
GENERAL PRINCIPLES
═══════════════════════════════════════
1. Never invent values. If a fact is not explicitly stated or clearly implied by 
   context, set it to null (or "" inside "sections" fields — never guess a number/date).
2. Treat field labels flexibly — companies use different wording for the same thing:
   - "Package" / "CTC" / "Salary" / "Compensation" → ctc
   - "Stipend" / "Monthly stipend" / "Remuneration" → stipend
   - "PPO" / "Pre-placement offer" / "PPI" / "Full-time conversion" → ppo
   - "Eligibility" / "Criteria" / "Who can apply" → eligibility
   - "Last date" / "Deadline" / "Apply by" / "Registration closes" → deadline
   - "Selection process" / "Rounds" / "Hiring process" / "Interview process" → pipelineStages
3. Determine "employmentType" from context, not just keywords:
   - Only stipend mentioned, no CTC/PPO → "internship"
   - Stipend + PPO mentioned → "internship+ppo"
   - Only CTC mentioned, no stipend → "placement"
   - Explicitly says "off-campus" → "off-campus"
   - If genuinely ambiguous, use your best judgment and lower confidence flag for it.
4. SINGLE SOURCE OF TRUTH: The "sections" array is NOT a separate extraction — it is a re-formatted VIEW of the exact same top-level field values. Extract each fact ONCE, mentally, then write that identical value into both the flat top-level field AND the matching section field. Never let the two representations disagree.

═══════════════════════════════════════
MONEY FIELDS — DO NOT CROSS-CONTAMINATE
═══════════════════════════════════════
An email may mention 0, 1, 2, or 3 of these. Map each to its correct field ONLY:
  - "ctc": full-time/placement package — a number/range followed by LPA, "per annum", 
    "annual package", etc. Applies to direct full-time hires.
  - "stipend": recurring monthly internship pay — a number followed by "per month", 
    "/month", "pm", "monthly".
  - "ppo": package offered AFTER internship completion, conditional on performance — 
    look for words like "PPO", "pre-placement offer", "on successful completion", 
    "conversion to full-time".
  If an email is internship-only, "ctc" MUST be null. If placement-only, "stipend" 
  and "ppo" MUST be null. Never copy one value into another field just because one 
  is missing — leave it null instead.

═══════════════════════════════════════
DATES — HANDLE ANY FORMAT SEEN
═══════════════════════════════════════
Indian college emails use inconsistent date formats. Handle all of these correctly:
  - "06-08-2026" or "06/08/2026" → DAY-MONTH-YEAR (NOT month-day). = 6 Aug 2026.
  - "6th August 2026", "August 6, 2026", "6 Aug'26" → parse naturally.
  - If only day+month given with no year, assume the nearest FUTURE occurrence 
    of that date relative to today.
  - Always output ISO 8601: "YYYY-MM-DDTHH:mm:ss".
  - If a time is given ("4 PM", "16:00", "till 5:30 pm"), convert to 24-hour format.
  - If no time is given at all, default time to "23:59:59".
  - If BOTH a "last date to register" and a separate "test date"/"interview date" 
    are mentioned, "deadline" = the REGISTRATION deadline, not the test/interview date. 
    Capture the test/interview date instead inside "suggestions" or the relevant section fields.

═══════════════════════════════════════
ELIGIBILITY — HANDLE VARIED PHRASING
═══════════════════════════════════════
- Percentage/CGPA thresholds may be given as a single combined line ("70% throughout"), 
  or split separately per level (10th / 12th / diploma / degree). Extract into the most 
  specific fields available; if only one combined number is given, apply it to all of 
  minTenthPercent, minTwelfthPercent, and minCGPA equally, and note this in eligibility.rawText.
- CGPA vs percentage: if given as "7.0 CGPA", put it in minCGPA as a number (not %). 
  If given as a %, put it in the percent fields. Do not convert between them.
- Backlog phrasing varies: "no active backlog", "no live backlog", "no standing arrears", 
  "backlog allowed up to 2" — parse the actual condition, don't assume it's always zero-tolerance.
- Branch eligibility may be full names, abbreviations, or combined ("CS/IT/AI&DS", 
  "Computer, IT, AIML branches only", "CSE and allied branches") — extract as a clean 
  comma-separated list of the specific branches/abbreviations mentioned.
- ALWAYS also copy the full original eligibility text verbatim into eligibility.rawText, 
  regardless of how well you parsed the structured fields — this is the fallback of record.

═══════════════════════════════════════
LINKS — LABEL BY CONTEXT, NOT POSITION
═══════════════════════════════════════
- Some emails have ONE registration link, others have TWO (company portal + college 
  portal), others have THREE+ (registration + job description PDF + brochure PDF).
- Label each based on the sentence immediately preceding/following it in the raw text 
  (e.g. "Company Registration Link", "College Registration Link", "Job Description", 
  "Brochure", "Portal Link"). Never leave a link labeled generically as "Link" if 
  context suggests a better label.

═══════════════════════════════════════
SELECTION PROCESS / PIPELINE
═══════════════════════════════════════
- Extract stages in the exact order listed, regardless of formatting (numbered list, 
  bullet list, arrows "→", or a plain sentence like "process includes OA, GD, then HR").
- Normalize obviously redundant stage names but preserve meaning (e.g. "Techno-Manager 
  round along with HR" → keep as one combined stage, don't split arbitrarily).
- If no selection process is mentioned at all, return an empty array — do NOT default 
  to a generic guess like ["OA", "Interview", "HR"].

═══════════════════════════════════════
SUGGESTED / DYNAMIC FIELDS
═══════════════════════════════════════
- After extracting all standard fields, scan for any OTHER opportunity-specific 
  information mentioned in the email that isn't covered above (e.g. internship period 
  dates like "Jan to May", company industry/domain, HQ location, prior-offer 
  restrictions, number of openings, work mode, notice period, dress code, dedicated 
  test date separate from the registration deadline).
- Add these as extra fields inside the most relevant existing section (per your 
  existing rules) rather than dropping them.
- Separately, suggest 4-8 commonly useful fields that were NOT found in this email at 
  all but are typically relevant for this type of opportunity (internship vs placement 
  vs off-campus) — put these in "suggestions" as before.

═══════════════════════════════════════
CONFIDENCE FLAGGING
═══════════════════════════════════════
For every field in confidenceFlags, set true only if the value was explicitly and 
unambiguously stated in the raw text. Set false if you inferred, guessed, defaulted, 
or the field was genuinely absent (even if you left it null).

JSON Schema:
{
  "company": "string",
  "role": "string",
  "employmentType": "internship | placement | internship+ppo | off-campus",
  "ctc": "string (e.g. '7 LPA') — full-time package ONLY, null if this is an internship-only email",
  "stipend": "string (e.g. '15000 per month') — internship stipend ONLY, null if not an internship",
  "ppo": "string (e.g. '7 LPA') — PPO package after internship, null if not mentioned",
  "durationMonths": "string (e.g. '3-4 months') — internship duration if applicable, else null",
  "location": "string",
  "bond": {
    "required": boolean,
    "durationMonths": number | null,
    "breachAmount": number | null
  },
  "eligibility": {
    "minTenthPercent": number | null,
    "minTwelfthPercent": number | null,
    "minCGPA": number | null,
    "backlogAllowed": boolean,
    "allowedBranches": ["CS", "IT"],
    "rawText": "string"
  },
  "links": [{ "label": "string", "url": "string" }],
  "applicationNo": "string | null",
  "contactPerson": { "name": "string | null", "phone": "string | null" },
  "deadline": "ISO 8601 date string | null",
  "pipelineStages": ["OA", "GD", "Tech Interview", "HR"],
  "notes": "string | null",
  "confidenceFlags": {
    "ctc": boolean,
    "stipend": boolean,
    "ppo": boolean,
    "deadline": boolean,
    "eligibility": boolean,
    "links": boolean
  },
  "sections": [
    {
      "name": "1. General & Job Details",
      "fields": [
        { "id": "company", "label": "Company Name", "value": "<extracted>", "fieldType": "short_text" },
        { "id": "role", "label": "Role / Profile", "value": "<extracted>", "fieldType": "short_text" },
        { "id": "ctc", "label": "CTC / Package", "value": "<extracted or empty string, blank if internship-only>", "fieldType": "short_text" },
        { "id": "stipend", "label": "Internship Stipend", "value": "<extracted or empty string, blank if not internship>", "fieldType": "short_text" },
        { "id": "ppo", "label": "PPO Package", "value": "<extracted or empty string, blank if not mentioned>", "fieldType": "short_text" },
        { "id": "durationMonths", "label": "Internship Duration", "value": "<extracted or empty string>", "fieldType": "short_text" },
        { "id": "employmentType", "label": "Employment Type", "value": "placement | internship | internship+ppo | off-campus", "fieldType": "select", "options": ["placement", "internship", "internship+ppo", "off-campus"] },
        { "id": "location", "label": "Work Location", "value": "<extracted or empty string>", "fieldType": "short_text" },
        { "id": "deadline", "label": "Application Deadline", "value": "<ISO string or empty>", "fieldType": "datetime-local" },
        { "id": "applicationNo", "label": "Application / Registration ID", "value": "<extracted or empty>", "fieldType": "short_text" }
      ]
    },
    {
      "name": "2. Eligibility Criteria",
      "fields": [
        { "id": "majorBranch", "label": "Allowed Branches", "value": "<e.g. CS, IT, CS AI-ML>", "fieldType": "short_text" },
        { "id": "minCGPA", "label": "Min CGPA", "value": "<number as string or empty>", "fieldType": "short_text" },
        { "id": "minTenthPercent", "label": "Min 10th %", "value": "<number as string or empty>", "fieldType": "short_text" },
        { "id": "minTwelfthPercent", "label": "Min 12th % / Diploma %", "value": "<number as string or empty>", "fieldType": "short_text" },
        { "id": "backlogAllowed", "label": "Active Backlogs Allowed", "value": "Yes | No", "fieldType": "select", "options": ["No", "Yes"] },
        { "id": "passoutYear", "label": "Passout Year", "value": "<if mentioned>", "fieldType": "short_text" }
      ]
    },
    {
      "name": "3. Bond & Legal Details",
      "fields": [
        { "id": "bondRequired", "label": "Service Bond Required", "value": "Yes | No", "fieldType": "select", "options": ["No", "Yes"] },
        { "id": "bondDuration", "label": "Bond Duration (Months)", "value": "<number as string or empty>", "fieldType": "short_text" },
        { "id": "bondPenalty", "label": "Breach Penalty Amount", "value": "<amount or empty>", "fieldType": "short_text" }
      ]
    },
    {
      "name": "4. Contact & HR Details",
      "fields": [
        { "id": "hrName", "label": "Contact Person / HR Name", "value": "<extracted or empty>", "fieldType": "short_text" },
        { "id": "hrPhone", "label": "HR Phone / Email", "value": "<extracted or empty>", "fieldType": "short_text" }
      ]
    },
    {
      "name": "5. Registration & Important Links",
      "fields": [
        { "id": "companyLink", "label": "Company Registration Link", "value": "<extracted URL or empty>", "fieldType": "url" },
        { "id": "tpoLink", "label": "College / TPO Registration Link", "value": "<extracted URL or empty>", "fieldType": "url" },
        { "id": "jdLink", "label": "Job Description / Brochure Link", "value": "<extracted URL or empty>", "fieldType": "url" }
      ]
    }
  ],
  "suggestions": [
    {
      "section": "1. General & Job Details",
      "label": "<field name not found in email but commonly needed>",
      "placeholder": "<example value>",
      "reason": "<1 sentence: why this field is useful to track>"
    }
  ]
}

RULES:
- Always populate all standard fields. Set value to empty string "" if not found (never null for section fields).
- If you find ANY extra information (e.g. dress code, venue, selection rounds, stipend for internship, service agreement, joining date), add additional fields to the relevant section instead of suggestions.
- For deadline: convert to ISO 8601 format (e.g. 2026-09-15T00:00:00.000Z). If no year given, assume current year.
- For allowedBranches: join as comma-separated string like "CS, IT, CS AI-ML".
- For suggestions: suggest 4-8 fields that were NOT found in the email but are commonly useful for placement tracking. Examples: "Interview Mode (Online/Offline)", "Number of Interview Rounds", "Selection Process Overview", "Joining Date / Batch", "Dress Code", "Stipend (if internship)", "Required Documents", "Drive Venue / Address", "Resume Submission Deadline", "Referral / Promo Code", "Campus Ambassador Contact". Pick the most relevant ones based on company type and role.

Raw Email:
`;

const extract = async (rawText, userSettings = {}) => {
  let provider = (userSettings?.llmProvider || process.env.LLM_PROVIDER || 'groq').toLowerCase().trim();
  const apiKey = userSettings?.llmApiKey || process.env.LLM_API_KEY;
  let model = userSettings?.llmModel || process.env.LLM_MODEL;

  if (apiKey && apiKey.startsWith('gsk_') && provider !== 'groq') provider = 'groq';
  else if (apiKey && apiKey.startsWith('sk-or-') && provider !== 'openrouter') provider = 'openrouter';

  if (!apiKey || apiKey === 'your_llm_api_key_here') {
    return getMockExtraction(rawText);
  }

  let result;
  if (provider === 'groq') {
    result = await extractWithGroq(rawText, apiKey, model || 'llama-3.3-70b-versatile');
  } else if (provider === 'openai') {
    result = await extractWithOpenAI(rawText, apiKey, model || 'gpt-4o-mini');
  } else if (provider === 'anthropic') {
    result = await extractWithAnthropic(rawText, apiKey, model || 'claude-3-haiku-20240307');
  } else if (provider === 'openrouter') {
    result = await extractWithOpenRouter(rawText, apiKey, model || 'meta-llama/llama-3.3-70b-instruct');
  } else {
    result = await extractWithOpenAICompatible(rawText, apiKey, model || 'llama-3.3-70b-versatile', provider);
  }

  return result;
};

const extractWithGroq = async (rawText, apiKey, model) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a JSON-only extraction assistant. Return only valid JSON, no markdown, no code blocks.' },
        { role: 'user', content: SCHEMA_PROMPT + rawText },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return JSON.parse(data.choices[0].message.content);
};

const extractWithOpenAI = async (rawText, apiKey, model) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a JSON-only extraction assistant. Return only valid JSON.' },
        { role: 'user', content: SCHEMA_PROMPT + rawText },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return JSON.parse(data.choices[0].message.content);
};

const extractWithOpenRouter = async (rawText, apiKey, model) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: 'You are a JSON-only extraction assistant. Return only valid JSON.' },
        { role: 'user', content: SCHEMA_PROMPT + rawText },
      ],
      temperature: 0.1,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from response');
  return JSON.parse(jsonMatch[0]);
};

const extractWithAnthropic = async (rawText, apiKey, model) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [{ role: 'user', content: SCHEMA_PROMPT + rawText + '\n\nReturn ONLY valid JSON.' }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from AI response');
  return JSON.parse(jsonMatch[0]);
};

const extractWithOpenAICompatible = async (rawText, apiKey, model, providerName) => {
  let baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  if (providerName.includes('together')) baseUrl = 'https://api.together.xyz/v1/chat/completions';
  if (providerName.includes('deepseek')) baseUrl = 'https://api.deepseek.com/chat/completions';
  if (providerName.includes('mistral')) baseUrl = 'https://api.mistral.ai/v1/chat/completions';

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a JSON-only extraction assistant. Return only valid JSON.' },
        { role: 'user', content: SCHEMA_PROMPT + rawText },
      ],
      temperature: 0.1,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from custom LLM response');
  return JSON.parse(jsonMatch[0]);
};

const getMockExtraction = (rawText) => {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return {
    company: 'TCS Limited',
    role: 'Software Engineer',
    ctc: '7 LPA',
    stipend: null,
    ppo: null,
    durationMonths: null,
    employmentType: 'placement',
    location: 'Pune / Hybrid',
    bond: { required: true, durationMonths: 12, breachAmount: 50000 },
    eligibility: {
      minTenthPercent: 60,
      minTwelfthPercent: 60,
      minCGPA: 7.0,
      backlogAllowed: false,
      allowedBranches: ['CS', 'IT', 'CS AI-ML'],
      rawText: 'Min 7.0 CGPA, No active backlogs, 60% in 10th and 12th, Branches: CS/IT/AI-ML',
    },
    links: [
      { label: 'TCS iON Application Portal', url: 'https://careers.tcs.com' },
      { label: 'College TPO Registration', url: 'https://tpo.pccoe.edu.in' },
    ],
    applicationNo: null,
    contactPerson: { name: 'TPO Office', phone: 'tpo@pccoe.edu.in' },
    deadline: now.toISOString(),
    pipelineStages: ['Applied', 'OA', 'Tech Interview', 'HR', 'Offer'],
    notes: 'Demo extraction — paste a real placement email and configure your LLM API key in Settings.',
    confidenceFlags: { ctc: false, stipend: false, ppo: false, deadline: true, eligibility: false, links: false },
    sections: [
      {
        name: '1. General & Job Details',
        fields: [
          { id: 'company', label: 'Company Name', value: 'TCS Limited', fieldType: 'short_text', hidden: false },
          { id: 'role', label: 'Role / Profile', value: 'Software Engineer', fieldType: 'short_text', hidden: false },
          { id: 'ctc', label: 'CTC / Package', value: '7 LPA', fieldType: 'short_text', hidden: false },
          { id: 'stipend', label: 'Internship Stipend', value: '', fieldType: 'short_text', hidden: false },
          { id: 'ppo', label: 'PPO Package', value: '', fieldType: 'short_text', hidden: false },
          { id: 'durationMonths', label: 'Internship Duration', value: '', fieldType: 'short_text', hidden: false },
          { id: 'employmentType', label: 'Employment Type', value: 'placement', fieldType: 'select', options: ['placement', 'internship', 'internship+ppo', 'off-campus'], hidden: false },
          { id: 'location', label: 'Work Location', value: 'Pune / Hybrid', fieldType: 'short_text', hidden: false },
          { id: 'deadline', label: 'Application Deadline', value: now.toISOString().slice(0, 16), fieldType: 'datetime-local', hidden: false },
          { id: 'applicationNo', label: 'Application / Registration ID', value: '', fieldType: 'short_text', hidden: false },
        ],
      },
      {
        name: '2. Eligibility Criteria',
        fields: [
          { id: 'majorBranch', label: 'Allowed Branches', value: 'CS, IT, CS AI-ML', fieldType: 'short_text', hidden: false },
          { id: 'minCGPA', label: 'Min CGPA', value: '7.0', fieldType: 'short_text', hidden: false },
          { id: 'minTenthPercent', label: 'Min 10th %', value: '60', fieldType: 'short_text', hidden: false },
          { id: 'minTwelfthPercent', label: 'Min 12th % / Diploma %', value: '60', fieldType: 'short_text', hidden: false },
          { id: 'backlogAllowed', label: 'Active Backlogs Allowed', value: 'No', fieldType: 'select', options: ['No', 'Yes'], hidden: false },
          { id: 'passoutYear', label: 'Passout Year', value: '2026', fieldType: 'short_text', hidden: false },
        ],
      },
      {
        name: '3. Bond & Legal Details',
        fields: [
          { id: 'bondRequired', label: 'Service Bond Required', value: 'Yes', fieldType: 'select', options: ['No', 'Yes'], hidden: false },
          { id: 'bondDuration', label: 'Bond Duration (Months)', value: '12', fieldType: 'short_text', hidden: false },
          { id: 'bondPenalty', label: 'Breach Penalty Amount', value: '50000', fieldType: 'short_text', hidden: false },
        ],
      },
      {
        name: '4. Contact & HR Details',
        fields: [
          { id: 'hrName', label: 'Contact Person / HR Name', value: 'TPO Office', fieldType: 'short_text', hidden: false },
          { id: 'hrPhone', label: 'HR Phone / Email', value: 'tpo@pccoe.edu.in', fieldType: 'short_text', hidden: false },
        ],
      },
    ],
    suggestions: [
      { section: '1. General & Job Details', label: 'Interview Mode', placeholder: 'Online / Offline / Hybrid', reason: 'Helps you prepare the right environment for the interview.' },
      { section: '1. General & Job Details', label: 'Joining Date / Batch', placeholder: 'July 2027', reason: 'Useful to know when you would start if selected.' },
      { section: '2. Eligibility Criteria', label: 'Gender Restriction', placeholder: 'All / Male only / Female only', reason: 'Some companies have gender-specific drives.' },
      { section: '2. Eligibility Criteria', label: 'Number of Active KTs Allowed', placeholder: '0', reason: 'Many companies have a strict zero-KT policy not always mentioned.' },
      { section: '3. Bond & Legal Details', label: 'Training / Probation Period', placeholder: '6 months', reason: 'Training period may affect your start salary or bond terms.' },
      { section: '4. Contact & HR Details', label: 'Drive Venue / Address', placeholder: 'PCCOE, Ravet', reason: 'For offline drives, having the venue saved helps with planning.' },
      { section: '1. General & Job Details', label: 'Selection Process Overview', placeholder: 'OA → Tech Interview → HR', reason: 'Knowing rounds in advance helps you prepare strategically.' },
    ],
  };
};

const UPDATE_SCHEMA_PROMPT = `You are a placement opportunity update assistant. You are given an existing record of custom fields and deadline for a placement opportunity, plus a NEW follow-up email (e.g. announcing test dates, interview venue, dress code, slot timing, exam link, etc.).

CRITICAL RULE - DATES: Indian placement emails write dates as DD-MM-YYYY (day first), NOT MM-DD-YYYY. For example "06-08-2026" means 6th August 2026, NOT June 8. Always convert any new event/test date or deadline to ISO 8601 "YYYY-MM-DDTHH:mm:ss".

Your goal:
1. Update existing field values if the follow-up email gives updated or more accurate information.
2. Extract any NEW fields mentioned in the follow-up email (such as Test Date, Exam Venue, Slot Time, Meeting Link, Instructions) and place them in the appropriate section.
3. If a new Test Date, Deadline, or Event Date is mentioned in the email, extract it as an ISO 8601 date string for "updatedDeadline".
4. Provide a list of "changesSummary" strings describing what was added or updated.

Return ONLY a valid JSON object matching this schema:
{
  "updatedDeadline": "ISO 8601 date string | null (only if a new date/deadline/test date is explicitly mentioned)",
  "updatedCustomFields": [
    {
      "id": "string",
      "section": "string",
      "label": "string",
      "value": "string",
      "fieldType": "short_text | select | datetime-local",
      "hidden": false
    }
  ],
  "changesSummary": [
    "string — e.g. 'Updated Application Deadline to 25 Aug 2026'",
    "string — e.g. 'Added field Test Venue: PCCOE Lab 3 in 1. General & Job Details'"
  ]
}

EXISTING FIELDS & DEADLINE:
`;

const updateExtraction = async (rawText, existingCustomFields = [], existingDeadline = null, userSettings = {}) => {
  let provider = (userSettings?.llmProvider || process.env.LLM_PROVIDER || 'groq').toLowerCase().trim();
  const apiKey = userSettings?.llmApiKey || process.env.LLM_API_KEY;
  let model = userSettings?.llmModel || process.env.LLM_MODEL;

  if (apiKey && apiKey.startsWith('gsk_') && provider !== 'groq') provider = 'groq';
  else if (apiKey && apiKey.startsWith('sk-or-') && provider !== 'openrouter') provider = 'openrouter';

  const contextPrompt = UPDATE_SCHEMA_PROMPT + JSON.stringify({ existingDeadline, existingCustomFields }, null, 2) + '\n\nNEW FOLLOW-UP EMAIL:\n' + rawText;

  if (!apiKey || apiKey === 'your_llm_api_key_here') {
    return getMockUpdateExtraction(rawText, existingCustomFields, existingDeadline);
  }

  let result;
  if (provider === 'groq') {
    result = await extractUpdateWithGroq(contextPrompt, apiKey, model || 'llama-3.3-70b-versatile');
  } else if (provider === 'openai') {
    result = await extractUpdateWithOpenAI(contextPrompt, apiKey, model || 'gpt-4o-mini');
  } else if (provider === 'openrouter') {
    result = await extractUpdateWithOpenRouter(contextPrompt, apiKey, model || 'meta-llama/llama-3.3-70b-instruct');
  } else {
    result = await extractUpdateWithOpenAI(contextPrompt, apiKey, model || 'llama-3.3-70b-versatile');
  }

  return result;
};

const extractUpdateWithGroq = async (prompt, apiKey, model) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a JSON-only opportunity update assistant. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return JSON.parse(data.choices[0].message.content);
};

const extractUpdateWithOpenAI = async (prompt, apiKey, model) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a JSON-only opportunity update assistant. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return JSON.parse(data.choices[0].message.content);
};

const extractUpdateWithOpenRouter = async (prompt, apiKey, model) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: 'You are a JSON-only opportunity update assistant. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from update response');
  return JSON.parse(jsonMatch[0]);
};

const getMockUpdateExtraction = (rawText, existingCustomFields = [], existingDeadline = null) => {
  const now = new Date();
  now.setDate(now.getDate() + 5);
  const updatedDeadline = now.toISOString();

  const updatedFields = [...existingCustomFields];
  
  updatedFields.push(
    { id: 'field_test_date_' + Date.now(), section: '1. General & Job Details', label: 'OA / Test Date', value: now.toLocaleString('en-IN'), fieldType: 'short_text', hidden: false },
    { id: 'field_test_venue_' + Date.now(), section: '1. General & Job Details', label: 'Test Venue / Platform', value: 'HackerRank Online Portal', fieldType: 'short_text', hidden: false }
  );

  return {
    updatedDeadline,
    updatedCustomFields: updatedFields,
    changesSummary: [
      `Updated Test / Event Date to ${now.toLocaleDateString('en-IN')}`,
      `Added field 'OA / Test Date' in 1. General & Job Details`,
      `Added field 'Test Venue / Platform' in 1. General & Job Details`,
    ],
  };
};

module.exports = { extract, updateExtraction };
