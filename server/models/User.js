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
      notificationChannel: { type: String, enum: ['email', 'browser', 'both'], default: 'browser' },
      notifyTests: { type: Boolean, default: true },
      notifyDeadlines: { type: Boolean, default: true },
      notifyDrives: { type: Boolean, default: true },
      notifyInterviews: { type: Boolean, default: true },
      llmProvider: { type: String, default: 'groq' },
      llmApiKey: { type: String, default: '' },
      llmModel: { type: String, default: 'openai/gpt-oss-120b' },
      llmBaseUrl: { type: String, default: '' },

      // SMTP Custom Credentials
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: '' },
      smtpPass: { type: String, default: '' },
    },
    // Google OAuth & Sync Settings
    googleAuth: {
      refreshToken: { type: String, default: null }, // AES-256-GCM encrypted
      connectedAt: { type: Date, default: null },
      googleEmail: { type: String, default: null },
      gmailSyncEnabled: { type: Boolean, default: false },
      calendarSyncEnabled: { type: Boolean, default: false },
      lastGmailSyncAt: { type: Date, default: null },
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },
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
