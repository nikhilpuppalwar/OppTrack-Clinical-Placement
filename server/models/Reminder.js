const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    remindAt: { type: Date, required: true },
    channel: { type: String, enum: ['email', 'browser'], default: 'email' },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reminderSchema.index({ remindAt: 1, sent: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
