/**
 * vector.service.js
 * Vector database & semantic search service for candidate profile details.
 * Embeds profile attributes, dynamic fields, and documents into a vector space
 * and performs cosine similarity search to retrieve relevant context for AI form filling.
 */

'use strict';

/**
 * Tokenize and generate a normalized term vector for a given string
 */
function tokenize(text) {
  if (!text) return new Map();
  const words = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const freq = new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

/**
 * Compute cosine similarity between two term frequency vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, count] of vecA.entries()) {
    normA += count * count;
    if (vecB.has(term)) {
      dotProduct += count * vecB.get(term);
    }
  }

  for (const count of vecB.values()) {
    normB += count * count;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Build vector index for a user profile
 * Converts flat profile attributes, dynamic fields, and documents into searchable vector documents.
 */
// Dynamic semantic definitions with synonyms and conceptual intent keywords
const STANDARD_FIELD_DEFINITIONS = [
  {
    key: 'candidateName',
    label: 'Full Candidate Name',
    synonyms: ['full name', 'student name', 'candidate name', 'applicant name', 'your name', 'first name', 'last name', 'name of student', 'name'],
  },
  {
    key: 'prn',
    label: 'PRN / Permanent Registration Number',
    synonyms: ['prn', 'roll number', 'roll no', 'registration number', 'reg no', 'student id', 'enrollment number', 'enrollment id', 'usn', 'seat no', 'hall ticket', 'uid'],
  },
  {
    key: 'collegeEmail',
    label: 'College Email Address',
    synonyms: ['college email', 'university email', 'institutional email', 'campus email', 'edu email', 'official email', 'college mail', 'university mail', 'campus mail', 'official mail', 'edu mail'],
  },
  {
    key: 'personalEmail',
    label: 'Personal Email Address',
    synonyms: ['personal email', 'primary email', 'alternate email', 'gmail', 'personal mail', 'email address', 'mail id', 'contact email', 'email'],
  },
  {
    key: 'phone',
    label: 'Mobile / Phone Contact Number',
    synonyms: ['phone number', 'mobile number', 'contact number', 'whatsapp number', 'cell number', 'telephone', 'mobile no', 'contact no', 'phone', 'mobile'],
  },
  {
    key: 'gender',
    label: 'Gender',
    synonyms: ['gender', 'sex', 'gender identity'],
  },
  {
    key: 'collegeName',
    label: 'College / University Name',
    synonyms: ['college name', 'institute name', 'university name', 'campus name', 'school name', 'institution', 'college'],
  },
  {
    key: 'stream',
    label: 'Stream / Faculty',
    synonyms: ['stream', 'course', 'degree', 'program', 'academic stream', 'undergraduate course', 'btech', 'be', 'bsc', 'mtech'],
  },
  {
    key: 'branch',
    label: 'Branch / Specialization',
    synonyms: ['branch', 'department', 'discipline', 'major', 'engineering branch', 'specialization', 'field of study'],
  },
  {
    key: 'passingYear',
    label: 'Passing / Graduation Year',
    synonyms: ['year of passing', 'graduation year', 'batch', 'passout year', 'completion year', 'passing year', 'year of graduation'],
  },
  {
    key: 'cgpa',
    label: 'Current CGPA / Grade',
    synonyms: ['cgpa', 'gpa', 'cumulative grade', 'pointer', 'aggregate percentage', 'btech percent', 'overall pointer', 'marks percentage'],
  },
  {
    key: 'tenthPercent',
    label: '10th Percentage / Score',
    synonyms: ['10th percentage', 'ssc marks', '10th marks', 'matriculation', 'class 10', 'secondary school', '10th score', 'ssc %'],
  },
  {
    key: 'twelfthPercent',
    label: '12th Percentage / Diploma Score',
    synonyms: ['12th percentage', 'hsc marks', '12th marks', 'intermediate', 'diploma marks', 'class 12', 'higher secondary', '12th score', 'hsc %'],
  },
  {
    key: 'resumeLink',
    label: 'Resume Drive Link',
    synonyms: ['resume link', 'cv link', 'curriculum vitae', 'resume drive url', 'cv drive', 'drive link', 'resume url', 'resume', 'cv'],
  },
  {
    key: 'linkedinLink',
    label: 'LinkedIn Profile Link',
    synonyms: ['linkedin url', 'linkedin profile', 'linkedin link', 'linkedin'],
  },
  {
    key: 'githubLink',
    label: 'GitHub Profile Link',
    synonyms: ['github url', 'github profile', 'git profile', 'github link', 'github'],
  },
  {
    key: 'leetcodeLink',
    label: 'LeetCode Profile Link',
    synonyms: ['leetcode profile', 'leetcode handle', 'leetcode url', 'leetcode'],
  },
  {
    key: 'codechefLink',
    label: 'CodeChef Profile Link',
    synonyms: ['codechef profile', 'codechef rating', 'codechef handle', 'codechef'],
  },
  {
    key: 'hackerrankLink',
    label: 'HackerRank Profile Link',
    synonyms: ['hackerrank profile', 'hackerrank handle', 'hackerrank'],
  },
  {
    key: 'projectTitle',
    label: 'Project Title',
    synonyms: ['project title', 'capstone title', 'major project title', 'final year project name', 'academic project title', 'title of project'],
  },
  {
    key: 'projectDetails',
    label: 'Project Summary / Details',
    synonyms: ['project description', 'project details', 'about your project', 'capstone details', 'key projects', 'project overview', 'project summary'],
  },
  {
    key: 'hobby',
    label: 'Hobbies & Interests',
    synonyms: ['hobbies', 'interests', 'extracurricular', 'areas of interest', 'leisure activities', 'hobby'],
  },
  {
    key: 'technicalCertifications',
    label: 'Certifications & Courses',
    synonyms: ['technical skills', 'skills', 'certifications', 'technologies known', 'programming skills', 'courses completed', 'tech stack', 'languages known'],
  },
  {
    key: 'previousInternships',
    label: 'Past Internship Experience',
    synonyms: ['work experience', 'internships', 'previous employment', 'companies worked', 'prior experience', 'internship details'],
  },
  {
    key: 'hasBacklog',
    label: 'Backlog Status',
    synonyms: ['active backlogs', 'live backlogs', 'history of arrears', 'atkt', 'standing arrears', 'backlogs'],
  },
];

/**
 * Build vector index for a user profile
 * Converts flat profile attributes, dynamic vault fields, and documents into dynamic semantic vector documents.
 */
function buildVectorIndex(profile, documents = []) {
  const vectors = [];

  if (!profile) return vectors;

  // Standard profile attributes with dynamic semantic expansion
  for (const item of STANDARD_FIELD_DEFINITIONS) {
    const val = profile[item.key];
    if (val !== undefined && val !== null && String(val).trim()) {
      const textToEmbed = `${item.label}: ${val}`;
      const tokenSource = `${item.label} ${item.key} ${item.synonyms.join(' ')} ${val}`;
      vectors.push({
        id: `std_${item.key}`,
        label: item.label,
        key: item.key,
        value: String(val),
        synonyms: item.synonyms,
        text: textToEmbed,
        vector: tokenize(tokenSource),
      });
    }
  }

  // Dynamic Unified Fields (from Profile Vault)
  if (Array.isArray(profile.fields)) {
    for (const field of profile.fields) {
      if (field.hidden || field.value === undefined || field.value === null || !String(field.value).trim()) continue;
      const textToEmbed = `${field.label}: ${field.value}`;
      const tokenSource = `${field.label} ${field.id} ${field.value}`;
      vectors.push({
        id: `field_${field.id}`,
        label: field.label,
        key: field.id,
        value: String(field.value),
        sensitive: !!field.sensitive,
        synonyms: [field.label.toLowerCase()],
        text: textToEmbed,
        vector: tokenize(tokenSource),
      });
    }
  }

  // User Documents
  if (Array.isArray(documents)) {
    for (const doc of documents) {
      if (!doc.fileUrl) continue;
      const textToEmbed = `Document (${doc.type}): ${doc.label} - Link: ${doc.fileUrl}`;
      const tokenSource = `document file resume ${doc.type} ${doc.label} ${doc.fileUrl}`;
      vectors.push({
        id: `doc_${doc._id}`,
        label: `Document: ${doc.label}`,
        key: `doc_${doc.type}`,
        value: doc.fileUrl,
        synonyms: [doc.label.toLowerCase(), doc.type.toLowerCase()],
        text: textToEmbed,
        vector: tokenize(tokenSource),
      });
    }
  }

  return vectors;
}

/**
 * Perform dynamic semantic similarity search for a query string against index
 * Computes hybrid score: Cosine TF similarity + Jaccard token overlap + Semantic phrase matching.
 * Returns top-K matching vectors sorted by dynamic similarity score.
 */
function searchVectorIndex(vectorIndex, query, topK = 5) {
  if (!query || !vectorIndex?.length) return [];
  const queryVec = tokenize(query);
  const queryWords = Array.from(queryVec.keys());
  const queryLower = String(query).toLowerCase().trim();

  const scored = vectorIndex.map((doc) => {
    // 1. Cosine similarity of term vectors
    const cosineSim = cosineSimilarity(queryVec, doc.vector);

    // 2. Token overlap / Jaccard similarity
    let overlapCount = 0;
    for (const word of queryWords) {
      if (doc.vector.has(word)) overlapCount++;
    }
    const totalUnique = queryWords.length + doc.vector.size - overlapCount;
    const jaccardSim = totalUnique > 0 ? overlapCount / totalUnique : 0;

    // 3. Dynamic synonym / phrase matching boost
    let synonymBoost = 0;
    if (Array.isArray(doc.synonyms)) {
      for (const syn of doc.synonyms) {
        if (queryLower === syn) {
          synonymBoost = Math.max(synonymBoost, 0.55);
          break;
        } else if (queryLower.includes(syn) || syn.includes(queryLower)) {
          const phraseScore = Math.min(0.48, 0.22 + (syn.length / 30));
          synonymBoost = Math.max(synonymBoost, phraseScore);
        }
      }
    }

    // Combined dynamic score
    const combinedScore = Math.min(1.0, cosineSim * 0.5 + jaccardSim * 0.25 + synonymBoost);

    return {
      ...doc,
      score: Number(combinedScore.toFixed(3)),
    };
  });

  return scored
    .filter((item) => item.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

module.exports = {
  tokenize,
  cosineSimilarity,
  buildVectorIndex,
  searchVectorIndex,
};
