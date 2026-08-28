const mongoose = require('mongoose');

const formHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formUrl: { type: String, required: true },
    formTitle: { type: String, default: '' },
    action: {
      type: String,
      enum: ['autofilled', 'synced', 'opened'],
      required: true,
    },
    matchedOpportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },
    fieldsFilledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for efficient per-user chronological queries
formHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FormHistory', formHistorySchema);
