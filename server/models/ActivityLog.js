const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', default: null },
    eventType: {
      type: String,
      enum: [
        'created',
        'status_changed',
        'edited',
        'deleted',
        'reminder_sent',
        'profile_updated',
        'sensitive_field_revealed', // Extension: user revealed a masked sensitive field
        'applied_via_extension',    // Extension: status auto-set to "applied" after form submission
      ],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
