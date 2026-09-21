/**
 * TrustedSender.js
 * Senders from whom Gmail auto-fetch will read placement emails.
 */
const mongoose = require('mongoose');

const trustedSenderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index so a user doesn't duplicate the same sender email
trustedSenderSchema.index({ userId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('TrustedSender', trustedSenderSchema);
