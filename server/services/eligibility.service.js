/**
 * eligibility.service.js
 * Compares opportunity eligibility criteria against a student's profile academics.
 * Returns: { status: 'eligible' | 'not_eligible' | 'needs_review', checkedAt: Date, reasons: [] }
 */
const check = (eligibility, academics) => {
  if (!eligibility || !academics) return { status: 'needs_review', checkedAt: new Date(), reasons: ['Missing data'] };

  const reasons = [];
  let isEligible = true;
  let needsReview = false;

  const { minTenthPercent, minTwelfthPercent, minCGPA, backlogAllowed } = eligibility;
  const { tenthPercent, twelfthPercent, cgpa, activeBacklog } = academics;

  if (minCGPA != null) {
    if (cgpa == null) {
      needsReview = true;
      reasons.push('CGPA not set in profile');
    } else if (cgpa < minCGPA) {
      isEligible = false;
      reasons.push(`CGPA ${cgpa} < required ${minCGPA}`);
    }
  }

  if (minTenthPercent != null) {
    if (tenthPercent == null) {
      needsReview = true;
      reasons.push('10th % not set in profile');
    } else if (tenthPercent < minTenthPercent) {
      isEligible = false;
      reasons.push(`10th ${tenthPercent}% < required ${minTenthPercent}%`);
    }
  }

  if (minTwelfthPercent != null) {
    if (twelfthPercent == null) {
      needsReview = true;
      reasons.push('12th % not set in profile');
    } else if (twelfthPercent < minTwelfthPercent) {
      isEligible = false;
      reasons.push(`12th ${twelfthPercent}% < required ${minTwelfthPercent}%`);
    }
  }

  if (backlogAllowed === false && activeBacklog) {
    isEligible = false;
    reasons.push('Active backlog not allowed');
  }

  let status;
  if (!isEligible) status = 'not_eligible';
  else if (needsReview) status = 'needs_review';
  else status = 'eligible';

  return { status, checkedAt: new Date(), reasons };
};

module.exports = { check };
