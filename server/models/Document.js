const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['resume', 'aadhar', 'pan', 'marksheet', 'photo', 'signature', 'other'],
      required: true,
    },
    label: { type: String, required: true },
    fileUrl: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
