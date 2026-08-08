/**
 * duplicate.service.js
 * Fuzzy-matches company name + role against existing user opportunities.
 */
const Opportunity = require('../models/Opportunity');

const normalize = (str = '') => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

const similarity = (a, b) => {
  const na = normalize(a), nb = normalize(b);
  if (!na || !nb) return 0;
  const dist = levenshtein(na, nb);
  return 1 - dist / Math.max(na.length, nb.length);
};

const check = async (userId, company, role, deadline) => {
  const existingOpps = await Opportunity.find({ userId }).select('company role deadline _id');
  for (const opp of existingOpps) {
    const companySim = similarity(company, opp.company);
    const roleSim = similarity(role, opp.role);
    if (companySim > 0.7 && roleSim > 0.5) {
      return { isDuplicate: true, existingId: opp._id, existingCompany: opp.company, existingRole: opp.role };
    }
  }
  return { isDuplicate: false };
};

module.exports = { check };
