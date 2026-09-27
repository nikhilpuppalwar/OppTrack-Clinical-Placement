const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Standard fields (kept for backward compatibility & direct query)
    candidateName: String,
    prn: String,
    collegeEmail: String,
    personalEmail: String,
    phone: String,
    gender: String,
    collegeName: String,
    stream: String,
    branch: String,
    passingYear: String,
    hobby: String,

    cgpa: String,
    tenthPercent: String,
    twelfthPercent: String,
    hasBacklog: String,
    backlogDetails: String,

    dsCourseDone: String,
    dsCourseName: String,
    dsCourseType: String,
    technicalCertifications: String,
    proofCertificateLink: String,

    previousInternships: String,
    projectTitle: String,
    projectDetails: String,
    roleApplied: String,

    cocubesScore: String,
    codechefRating: String,
    codechefLink: String,
    hackerrankRating: String,
    hackerrankLink: String,
    leetcodeScore: String,
    leetcodeLink: String,

    personalAchievements: String,
    technicalAchievements: String,
    resumeLink: String,
    githubLink: String,
    linkedinLink: String,
    portfolioUrl: String,
    currentCity: String,
    currentAddressLine1: String,
    technicalSkills: String,
    programmingLanguages: String,
    frameworks: String,
    tools: String,
    softSkills: String,

    // Dynamic Unified Fields (Stores built-in + custom fields with labels, fieldTypes, values, and hidden state)
    fields: [
      {
        id: { type: String, required: true },
        section: { type: String, default: 'personal' },
        label: { type: String, required: true },
        fieldType: {
          type: String,
          enum: ['short_text', 'paragraph', 'date', 'select', 'file_path'],
          default: 'short_text',
        },
        options: [String],
        value: { type: String, default: '' },
        hidden: { type: Boolean, default: false },
        isCustom: { type: Boolean, default: false },
        sensitive: { type: Boolean, default: false },
        provenance: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],
    deletedFieldIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
