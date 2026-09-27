const mongoose = require('mongoose');

const extensionSyncSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, default: 'Chrome Extension' },
    formUrl: { type: String, default: '' },
    formTitle: { type: String, default: '' },
    fileName: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Raw incoming items from extension or form scan
    rawFields: [
      {
        id: String,
        label: String,
        value: mongoose.Schema.Types.Mixed,
        fieldType: String,
        section: String,
        reason: String,
        confidence: Number,
      },
    ],

    // AI comparison analysis against current active profile
    analysis: [
      {
        fieldId: String,
        label: String,
        currentValue: { type: String, default: '' },
        incomingValue: { type: String, default: '' },
        suggestedValue: { type: String, default: '' },
        status: { type: String, enum: ['new', 'updated', 'identical', 'conflict'], default: 'new' },
        action: { type: String, enum: ['accept', 'keep', 'append'], default: 'accept' },
        reason: { type: String, default: '' },
        section: { type: String, default: 'personal' },
        fieldType: { type: String, default: 'short_text' },
        approved: { type: Boolean, default: true },
        confidence: { type: Number, default: 0.95 },
      },
    ],

    status: {
      type: String,
      enum: ['pending_review', 'verified_and_merged', 'rejected'],
      default: 'pending_review',
    },
    mergedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

extensionSyncSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('ExtensionSync', extensionSyncSchema);
