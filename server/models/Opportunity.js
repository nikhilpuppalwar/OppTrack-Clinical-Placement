const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    ctc: String,
    stipend: String,
    ppo: String,
    employmentType: { type: String, enum: ['internship', 'placement', 'internship+ppo', 'off-campus'], default: 'placement' },
    location: String,

    bond: {
      required: { type: Boolean, default: false },
      durationMonths: Number,
      breachAmount: Number,
    },

    // Expanded Eligibility Criteria with Custom Field CRUD Support
    eligibility: {
      minTenthPercent: Number,
      minTwelfthPercent: Number,
      minCGPA: Number,
      backlogAllowed: { type: Boolean, default: false },
      allowedBranches: [String],
      majorBranch: String,
      rawText: String,
      customCriteria: [
        {
          id: String,
          label: String,
          value: String,
          fieldType: { type: String, default: 'short_text' },
          hidden: { type: Boolean, default: false },
        },
      ],
    },

    eligibilityCheckResult: {
      status: { type: String, enum: ['eligible', 'not_eligible', 'needs_review'], default: 'needs_review' },
      checkedAt: Date,
    },

    links: [{ label: String, url: String }],

    applicationNo: String,

    contactPerson: {
      name: String,
      phone: String,
    },

    deadline: Date,

    status: {
      type: String,
      enum: ['not_applied', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected'],
      default: 'not_applied',
    },

    pipelineStages: { type: [String], default: ['Applied', 'OA', 'Interview', 'HR', 'Offer'] },
    currentStageIndex: { type: Number, default: 0 },

    resumeVersionUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },

    notes: String,

    // Dynamic Section-Wide Custom Fields Array (Full CRUD across all sections)
    customFields: [
      {
        id: String,
        section: { type: String, default: 'General & Job Details' },
        label: String,
        value: String,
        fieldType: { type: String, default: 'short_text' },
        options: [String],
        hidden: { type: Boolean, default: false },
      },
    ],

    source: {
      rawEmailText: String,
      extractedViaAI: { type: Boolean, default: false },
      confidenceFlags: {
        ctc: Boolean,
        deadline: Boolean,
        eligibility: Boolean,
        links: Boolean,
      },
    },
  },
  { timestamps: true }
);

// Indexes
opportunitySchema.index({ userId: 1, deadline: 1 });
opportunitySchema.index({ userId: 1, status: 1 });
opportunitySchema.index({ company: 'text', role: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
