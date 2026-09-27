/**
 * testDatabaseIntegration.js
 * End-to-end database safety, merge, rollback, and staging verification.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const ExtensionSync = require('../models/ExtensionSync');
const ActivityLog = require('../models/ActivityLog');
const {
  stageExtensionData,
  verifyAndMergeSync,
  undoProfileUpdate,
  rejectSync,
} = require('../controllers/extensionSyncController');

async function runDbIntegrationTests() {
  console.log('\n======================================================');
  console.log('🗄️ RUNNING DATABASE INTEGRATION & SAFETY TESTS');
  console.log('======================================================\n');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const testEmail = `test_resume_${Date.now()}@example.com`;
  let testUser = null;
  let testProfile = null;

  try {
    // 1. Create a dummy user & profile
    testUser = await User.create({
      name: 'Integration Tester',
      email: testEmail,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklm',
    });

    testProfile = await Profile.create({
      userId: testUser._id,
      candidateName: 'Integration Tester',
      personalEmail: testEmail,
      cgpa: '7.5',
      fields: [
        {
          id: 'technicalSkills',
          section: 'skills',
          label: 'Skills',
          fieldType: 'short_text',
          value: 'C++, Python',
        },
      ],
    });

    console.log('✓ Initialized test user & profile in database');

    // 2. Stage new resume data
    const incomingFields = [
      { id: 'candidateName', label: 'Full Name', value: 'Integration Tester', confidence: 0.99 },
      { id: 'cgpa', label: 'CGPA', value: '8.8', confidence: 0.95 },
      { id: 'currentCity', label: 'Current City', value: 'Pune', confidence: 0.92 },
      { id: 'technicalSkills', label: 'Skills', value: 'React, Node.js', confidence: 0.94 },
    ];

    const stagedDoc = await stageExtensionData({
      userId: testUser._id,
      fieldsToSave: incomingFields,
      source: 'AI Resume Import',
      fileName: 'Senior_Resume.pdf',
    });

    // 3. Database Safety Check: Profile MUST NOT be modified at stage time!
    const profileAfterStage = await Profile.findOne({ userId: testUser._id });
    if (profileAfterStage.cgpa !== '7.5') {
      throw new Error(`DATABASE SAFETY VIOLATION: Profile CGPA was altered to ${profileAfterStage.cgpa} during staging!`);
    }
    if (profileAfterStage.currentCity) {
      throw new Error(`DATABASE SAFETY VIOLATION: Profile City was written during staging!`);
    }
    console.log('✓ DATABASE SAFETY VERIFIED: Profile remained unaltered after analysis & staging');

    // 4. Verify & Merge Approved Fields (Selective Merge)
    const approvedFields = [
      {
        fieldId: 'cgpa',
        label: 'CGPA',
        value: '8.8',
        action: 'accept',
      },
      {
        fieldId: 'currentCity',
        label: 'Current City',
        value: 'Pune',
        action: 'accept',
      },
      {
        fieldId: 'technicalSkills',
        label: 'Skills',
        value: 'React, Node.js',
        action: 'append', // Merge test!
      },
    ];

    // Mock Express req and res
    let responseData = null;
    const mockReq = {
      user: testUser,
      params: { id: stagedDoc._id.toString() },
      body: { approvedFields },
    };
    const mockRes = {
      json: (data) => {
        responseData = data;
      },
      status: () => mockRes,
    };

    await verifyAndMergeSync(mockReq, mockRes);

    const profileAfterMerge = await Profile.findOne({ userId: testUser._id });
    if (profileAfterMerge.cgpa !== '8.8') {
      throw new Error(`Merge failed: Expected CGPA 8.8, got ${profileAfterMerge.cgpa}`);
    }
    if (profileAfterMerge.currentCity !== 'Pune') {
      throw new Error(`Merge failed: Expected currentCity Pune, got ${profileAfterMerge.currentCity}`);
    }

    const skillsField = profileAfterMerge.fields.find((f) => f.id === 'technicalSkills');
    if (!skillsField || !skillsField.value.includes('C++') || !skillsField.value.includes('React')) {
      throw new Error(`Append/Merge failed: Expected combined skills, got ${skillsField?.value}`);
    }

    if (!skillsField.provenance || skillsField.provenance.source !== 'AI Resume Import') {
      throw new Error(`Provenance missing or incorrect: ${JSON.stringify(skillsField.provenance)}`);
    }

    console.log('✓ SELECTIVE MERGE & PROVENANCE VERIFIED: Profile updated with approved fields');
    console.log(`  - CGPA: ${profileAfterMerge.cgpa}`);
    console.log(`  - City: ${profileAfterMerge.currentCity}`);
    console.log(`  - Merged Skills: ${skillsField.value}`);

    // Check ActivityLog
    const activity = await ActivityLog.findOne({ userId: testUser._id, eventType: 'profile_updated' }).sort({ createdAt: -1 });
    if (!activity || !activity.metadata || !activity.metadata.previousValues) {
      throw new Error('ActivityLog did not record rollback snapshot previousValues');
    }
    console.log('✓ ACTIVITY LOG VERIFIED: Snapshot recorded with previousValues');

    // 5. Test Rollback / Undo
    const mockUndoReq = {
      user: testUser,
      params: { logId: activity._id.toString() },
    };
    let undoResponse = null;
    const mockUndoRes = {
      json: (data) => {
        undoResponse = data;
      },
      status: () => mockUndoRes,
    };

    await undoProfileUpdate(mockUndoReq, mockUndoRes);

    const profileAfterRollback = await Profile.findOne({ userId: testUser._id });
    if (profileAfterRollback.cgpa !== '7.5') {
      throw new Error(`Rollback failed: Expected CGPA to revert to 7.5, got ${profileAfterRollback.cgpa}`);
    }
    console.log('✓ ROLLBACK / UNDO VERIFIED: Profile reverted to initial snapshot values');
    console.log(`  - Restored CGPA: ${profileAfterRollback.cgpa}`);

    console.log('\n======================================================');
    console.log('🎉 ALL DATABASE INTEGRATION TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    // Cleanup
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      await Profile.deleteOne({ userId: testUser._id });
      await ExtensionSync.deleteMany({ userId: testUser._id });
      await ActivityLog.deleteMany({ userId: testUser._id });
      console.log('🧹 Cleaned up temporary test user and documents');
    }
    await mongoose.disconnect();
  }
}

runDbIntegrationTests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
