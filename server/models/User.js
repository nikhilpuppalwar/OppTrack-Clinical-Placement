const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    collegeName: { type: String, trim: true },
    branch: { type: String, trim: true },
    batch: { type: String, trim: true },
    // Settings
    settings: {
      reminderLeadHours: { type: Number, default: 24 },
      notificationChannel: { type: String, enum: ['email', 'browser'], default: 'email' },
      llmProvider: { type: String, default: 'groq' },
      llmApiKey: { type: String, default: '' },
      llmModel: { type: String, default: 'llama-3.3-70b-versatile' },

      // SMTP Custom Credentials
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: '' },
      smtpPass: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Virtual — don't store plain password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

module.exports = mongoose.model('User', userSchema);
