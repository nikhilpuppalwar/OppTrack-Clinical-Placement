/**
 * fieldMapper.service.js
 * Normalizes extracted candidate data, maps labels to standard Profile Vault fields,
 * and performs semantic diff analysis against active profile data.
 */

const STANDARD_FIELDS_MAP = {
  candidateName: {
    label: 'Full Name',
    section: 'personal',
    fieldType: 'short_text',
    synonyms: ['name', 'full name', 'candidate name', 'student name', 'applicant name', 'my name'],
  },
  personalEmail: {
    label: 'Personal Email',
    section: 'personal',
    fieldType: 'short_text',
    synonyms: ['email', 'personal email', 'email address', 'e-mail', 'mail id', 'contact email', 'primary email'],
  },
  collegeEmail: {
    label: 'College Email',
    section: 'personal',
    fieldType: 'short_text',
    synonyms: ['college email', 'institutional email', 'university email', 'academic email', 'official email'],
  },
  phone: {
    label: 'Phone Number',
    section: 'personal',
    fieldType: 'short_text',
    synonyms: ['phone', 'phone number', 'mobile', 'mobile number', 'contact number', 'cell', 'telephone', 'contact'],
  },
  currentCity: {
    label: 'Current City',
    section: 'personal',
    fieldType: 'short_text',
    synonyms: ['current city', 'city', 'current location', 'location', 'where do you live', 'present city', 'hometown', 'base location', 'current residence'],
  },
  currentAddressLine1: {
    label: 'Address',
    section: 'personal',
    fieldType: 'short_text',
    synonyms: ['address', 'current address', 'residential address', 'present address', 'permanent address', 'residence'],
  },
  collegeName: {
    label: 'College / University',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['college', 'university', 'college name', 'university name', 'institute', 'institution', 'school/college', 'engineering college', 'alma mater'],
  },
  stream: {
    label: 'Degree',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['degree', 'degree name', 'qualification', 'program', 'course name', 'graduation degree', 'undergraduate degree'],
  },
  branch: {
    label: 'Branch / Specialization',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['branch', 'department', 'branch / specialization', 'specialization', 'stream', 'major', 'field of study'],
  },
  passingYear: {
    label: 'Graduation Year',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['graduation year', 'passing year', 'batch', 'year of graduation', 'passout year', 'completion year', 'grad year', 'class of'],
  },
  cgpa: {
    label: 'CGPA',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['cgpa', 'gpa', 'cumulative gpa', 'pointer', 'grade pointer', 'college pointer', 'undergraduate gpa'],
  },
  tenthPercent: {
    label: '10th Percentage',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['10th', '10th percentage', '10th %', 'ssc', 'ssc percentage', '10th marks', 'class 10', 'secondary school', '10th grade'],
  },
  twelfthPercent: {
    label: '12th Percentage',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['12th', '12th percentage', '12th %', 'hsc', 'hsc percentage', '12th marks', 'class 12', 'higher secondary', 'diploma percentage', '12th grade'],
  },
  hasBacklog: {
    label: 'Active Backlogs',
    section: 'academics',
    fieldType: 'short_text',
    synonyms: ['backlogs', 'active backlogs', 'live backlogs', 'standing arrears', 'has backlog', 'current backlogs'],
  },
  technicalSkills: {
    label: 'Skills',
    section: 'skills',
    fieldType: 'short_text',
    synonyms: ['skills', 'technical skills', 'core skills', 'key skills', 'competencies', 'technical proficiencies'],
  },
  programmingLanguages: {
    label: 'Programming Languages',
    section: 'skills',
    fieldType: 'short_text',
    synonyms: ['programming languages', 'coding languages', 'languages known', 'languages'],
  },
  frameworks: {
    label: 'Frameworks & Libraries',
    section: 'skills',
    fieldType: 'short_text',
    synonyms: ['frameworks', 'libraries', 'frameworks & libraries', 'web frameworks', 'technologies', 'tech stack'],
  },
  tools: {
    label: 'Developer Tools',
    section: 'skills',
    fieldType: 'short_text',
    synonyms: ['tools', 'developer tools', 'tools & platforms', 'databases & tools', 'utilities', 'platforms', 'databases'],
  },
  softSkills: {
    label: 'Soft Skills',
    section: 'skills',
    fieldType: 'short_text',
    synonyms: ['soft skills', 'interpersonal skills', 'communication skills', 'strengths', 'personal skills'],
  },
  linkedinLink: {
    label: 'LinkedIn Profile',
    section: 'links',
    fieldType: 'short_text',
    synonyms: ['linkedin', 'linkedin profile', 'linkedin url', 'linkedin link', 'linked in'],
  },
  githubLink: {
    label: 'GitHub Profile',
    section: 'links',
    fieldType: 'short_text',
    synonyms: ['github', 'github profile', 'github url', 'github link', 'github account', 'git profile'],
  },
  portfolioUrl: {
    label: 'Portfolio Website',
    section: 'links',
    fieldType: 'short_text',
    synonyms: ['portfolio', 'personal website', 'website', 'portfolio link', 'portfolio url', 'web site', 'personal link'],
  },
  leetcodeLink: {
    label: 'LeetCode Profile',
    section: 'links',
    fieldType: 'short_text',
    synonyms: ['leetcode', 'leetcode profile', 'leetcode url', 'leetcode link'],
  },
  codechefLink: {
    label: 'CodeChef Profile',
    section: 'links',
    fieldType: 'short_text',
    synonyms: ['codechef', 'codechef profile', 'codechef link'],
  },
  hackerrankLink: {
    label: 'HackerRank Profile',
    section: 'links',
    fieldType: 'short_text',
    synonyms: ['hackerrank', 'hackerrank profile', 'hackerrank link'],
  },
  previousInternships: {
    label: 'Internships / Experience',
    section: 'internships',
    fieldType: 'paragraph',
    synonyms: ['internships', 'work experience', 'experience', 'internship experience', 'employment history', 'past roles', 'professional experience', 'employment'],
  },
  projectTitle: {
    label: 'Projects',
    section: 'projects',
    fieldType: 'paragraph',
    synonyms: ['projects', 'key projects', 'academic projects', 'featured projects', 'major projects', 'project title', 'notable projects'],
  },
  projectDetails: {
    label: 'Project Details',
    section: 'projects',
    fieldType: 'paragraph',
    synonyms: ['project details', 'project description', 'projects summary'],
  },
  technicalCertifications: {
    label: 'Technical Certifications',
    section: 'courses',
    fieldType: 'paragraph',
    synonyms: ['certifications', 'technical certifications', 'certificates', 'courses completed', 'licenses & certifications', 'online courses'],
  },
  technicalAchievements: {
    label: 'Technical Achievements',
    section: 'technical_achievements',
    fieldType: 'paragraph',
    synonyms: ['achievements', 'technical achievements', 'honors & awards', 'awards', 'hackathons', 'competitions', 'rank', 'contest achievements'],
  },
  personalAchievements: {
    label: 'Personal Achievements',
    section: 'personal_achievements',
    fieldType: 'paragraph',
    synonyms: ['personal achievements', 'extra-curricular', 'extracurricular activities', 'leadership', 'positions of responsibility', 'volunteering'],
  },
};

const normalizeStr = (str = '') => str.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Normalizes numeric CGPA (e.g. "8.6 / 10" -> "8.6", "9.2 CGPA" -> "9.2")
 */
function normalizeCGPA(val) {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:\/|\s*out\s*of)?\s*(?:10|4)?/i);
  if (match && match[1]) {
    const num = parseFloat(match[1]);
    if (!isNaN(num) && num > 0 && num <= 10) {
      return match[1];
    }
  }
  return str.replace(/[^0-9.]/g, '');
}

/**
 * Normalizes percentage values (e.g. "88.5%" -> "88.5")
 */
function normalizePercentage(val) {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
  if (match && match[1]) return match[1];
  const directNum = str.replace(/[^0-9.]/g, '');
  return directNum;
}

/**
 * Normalizes URLs (e.g. "linkedin.com/in/demo" -> "https://linkedin.com/in/demo")
 */
function normalizeUrl(val) {
  if (!val) return '';
  let str = String(val).trim();
  if (!str) return '';
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str.replace(/^\/\//, '');
  }
  return str;
}

/**
 * Normalizes phone numbers (removes weird characters, preserves + and clean digits)
 */
function normalizePhone(val) {
  if (!val) return '';
  const str = String(val).trim();
  // Keep leading +, remove spaces, hyphens, parentheses
  const cleaned = str.replace(/[^\d+]/g, '');
  return cleaned || str;
}

/**
 * Normalizes skill sets into unique, comma-separated tokens
 */
function normalizeSkills(val) {
  if (!val) return '';
  let items = [];
  if (Array.isArray(val)) {
    items = val;
  } else if (typeof val === 'string') {
    items = val.split(/[,;\n•|]+/).map(s => s.trim());
  }
  const unique = [];
  const seen = new Set();
  items.forEach(item => {
    const clean = String(item).trim().replace(/^[-*•]\s*/, '');
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      unique.push(clean);
    }
  });
  return unique.join(', ');
}

/**
 * Normalizes a 4-digit passing year
 */
function normalizePassingYear(val) {
  if (!val) return '';
  const str = String(val);
  const match = str.match(/\b(20[1-3][0-9])\b/);
  return match ? match[1] : str.trim();
}

/**
 * Normalizes an arbitrary value according to the target field key
 */
function normalizeFieldValue(fieldKey, rawValue) {
  if (rawValue === undefined || rawValue === null) return '';
  const strVal = Array.isArray(rawValue) ? rawValue.join(', ') : String(rawValue).trim();
  if (!strVal) return '';

  const keyLower = (fieldKey || '').toLowerCase();

  if (keyLower.includes('cgpa') || keyLower === 'gpa') {
    return normalizeCGPA(strVal);
  }
  if (keyLower.includes('percent') || keyLower.includes('percentage')) {
    return normalizePercentage(strVal);
  }
  if (keyLower.includes('link') || keyLower.includes('url') || keyLower.includes('github') || keyLower.includes('linkedin') || keyLower.includes('leetcode') || keyLower.includes('portfolio')) {
    return normalizeUrl(strVal);
  }
  if (keyLower.includes('phone') || keyLower.includes('mobile')) {
    return normalizePhone(strVal);
  }
  if (keyLower.includes('skill') || keyLower.includes('languages') || keyLower.includes('frameworks') || keyLower.includes('tools')) {
    return normalizeSkills(strVal);
  }
  if (keyLower.includes('passingyear') || keyLower.includes('graduationyear')) {
    return normalizePassingYear(strVal);
  }

  return strVal;
}

/**
 * Matches an extracted label or id against known standard fields using semantic synonyms
 */
function mapToStandardField(labelOrId = '') {
  const norm = normalizeStr(labelOrId);

  // Direct key check
  if (STANDARD_FIELDS_MAP[labelOrId]) {
    return { fieldId: labelOrId, ...STANDARD_FIELDS_MAP[labelOrId] };
  }

  // Synonym search
  for (const [key, config] of Object.entries(STANDARD_FIELDS_MAP)) {
    if (norm === normalizeStr(key) || norm === normalizeStr(config.label)) {
      return { fieldId: key, ...config };
    }
    for (const syn of config.synonyms) {
      if (norm === normalizeStr(syn) || norm.includes(normalizeStr(syn)) || normalizeStr(syn).includes(norm)) {
        return { fieldId: key, ...config };
      }
    }
  }

  return null;
}

module.exports = {
  STANDARD_FIELDS_MAP,
  normalizeStr,
  normalizeCGPA,
  normalizePercentage,
  normalizeUrl,
  normalizePhone,
  normalizeSkills,
  normalizePassingYear,
  normalizeFieldValue,
  mapToStandardField,
};
