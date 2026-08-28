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
function buildVectorIndex(profile, documents = []) {
  const vectors = [];

  if (!profile) return vectors;

  // Standard profile attributes
  const stdKeys = [
    { key: 'candidateName', label: 'Full Candidate Name' },
    { key: 'prn', label: 'PRN / Permanent Registration Number' },
    { key: 'collegeEmail', label: 'College Email Address' },
    { key: 'personalEmail', label: 'Personal Email Address' },
    { key: 'phone', label: 'Mobile / Phone Contact Number' },
    { key: 'gender', label: 'Gender' },
    { key: 'collegeName', label: 'College / University Name' },
    { key: 'stream', label: 'Stream / Faculty' },
    { key: 'branch', label: 'Branch / Specialization' },
    { key: 'passingYear', label: 'Passing / Graduation Year' },
    { key: 'cgpa', label: 'Current CGPA / Grade' },
    { key: 'tenthPercent', label: '10th Percentage / Score' },
    { key: 'twelfthPercent', label: '12th Percentage / Diploma Score' },
    { key: 'resumeLink', label: 'Resume Drive Link' },
    { key: 'leetcodeLink', label: 'LeetCode Profile Link' },
    { key: 'codechefLink', label: 'CodeChef Profile Link' },
    { key: 'hackerrankLink', label: 'HackerRank Profile Link' },
    { key: 'leetcodeScore', label: 'LeetCode Solved Count / Rating' },
    { key: 'codechefRating', label: 'CodeChef Rating' },
    { key: 'projectTitle', label: 'Project Title' },
    { key: 'projectDetails', label: 'Project Summary / Details' },
    { key: 'hobby', label: 'Hobbies & Interests' },
    { key: 'technicalCertifications', label: 'Certifications & Courses' },
    { key: 'previousInternships', label: 'Past Internship Experience' },
  ];

  for (const item of stdKeys) {
    const val = profile[item.key];
    if (val && String(val).trim()) {
      const textToEmbed = `${item.label}: ${val}`;
      vectors.push({
        id: `std_${item.key}`,
        label: item.label,
        key: item.key,
        value: String(val),
        text: textToEmbed,
        vector: tokenize(`${item.label} ${item.key} ${val}`),
      });
    }
  }

  // Dynamic Unified Fields
  if (Array.isArray(profile.fields)) {
    for (const field of profile.fields) {
      if (field.hidden || !field.value) continue;
      const textToEmbed = `${field.label}: ${field.value}`;
      vectors.push({
        id: `field_${field.id}`,
        label: field.label,
        key: field.id,
        value: String(field.value),
        sensitive: !!field.sensitive,
        text: textToEmbed,
        vector: tokenize(`${field.label} ${field.id} ${field.value}`),
      });
    }
  }

  // User Documents
  if (Array.isArray(documents)) {
    for (const doc of documents) {
      if (!doc.fileUrl) continue;
      const textToEmbed = `Document (${doc.type}): ${doc.label} - Link: ${doc.fileUrl}`;
      vectors.push({
        id: `doc_${doc._id}`,
        label: `Document: ${doc.label}`,
        key: `doc_${doc.type}`,
        value: doc.fileUrl,
        text: textToEmbed,
        vector: tokenize(`document file resume ${doc.type} ${doc.label}`),
      });
    }
  }

  return vectors;
}

/**
 * Perform vector similarity search for a query string against index
 * Returns top-K matching vectors sorted by similarity score
 */
function searchVectorIndex(vectorIndex, query, topK = 5) {
  const queryVec = tokenize(query);
  const scored = vectorIndex.map((doc) => {
    const sim = cosineSimilarity(queryVec, doc.vector);
    return { ...doc, score: sim };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

module.exports = {
  tokenize,
  cosineSimilarity,
  buildVectorIndex,
  searchVectorIndex,
};
