/**
 * GmailSyncLog.js
 * Tracks emails fetched from Gmail, deduplicates by messageId, stores AI extraction results,
 * and tracks review status (pending_review, added, duplicate, ignored).
 */
const mongoose = require('mongoose');

const gmailSyncLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gmailMessageId: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      default: '(No Subject)',
    },
    from: {
      type: String,
      default: '',
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    rawText: {
      type: String,
      default: '',
    },
    extractionResult: {
      extractedFields: { type: mongoose.Schema.Types.Mixed, default: {} },
      duplicateWarning: { type: mongoose.Schema.Types.Mixed, default: null },
      eligibilityCheckResult: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    status: {
      type: String,
      enum: ['pending_review', 'added', 'duplicate', 'ignored', 'auto_updated'],
      default: 'pending_review',
      index: true,
    },
    autoUpdateDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per user and messageId
gmailSyncLogSchema.index({ userId: 1, gmailMessageId: 1 }, { unique: true });
gmailSyncLogSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('GmailSyncLog', gmailSyncLogSchema);
