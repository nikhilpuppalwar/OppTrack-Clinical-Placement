const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  createField,
  updateField,
  deleteField,
  restoreDefaultFields,
} = require('../controllers/profileController');
const {
  getPendingSyncs,
  getSyncHistory,
  verifyAndMergeSync,
  undoProfileUpdate,
  rejectSync,
  analyzeTextData,
  analyzeResumeData,
} = require('../controllers/extensionSyncController');
const { protect } = require('../middleware/auth');
const resumeUpload = require('../middleware/resumeUpload');

router.route('/').get(protect, getProfile).put(protect, updateProfile);
router.post('/field', protect, createField);
router.put('/field/:fieldId', protect, updateField);
router.delete('/field/:fieldId', protect, deleteField);
router.post('/restore-defaults', protect, restoreDefaultFields);
router.get('/pending-syncs', protect, getPendingSyncs);
router.get('/sync-history', protect, getSyncHistory);
router.post('/verify-sync/:id', protect, verifyAndMergeSync);
router.post('/undo-update/:logId', protect, undoProfileUpdate);
router.post('/reject-sync/:id', protect, rejectSync);
router.post('/analyze-text', protect, analyzeTextData);
router.post('/analyze-resume', protect, resumeUpload.single('resume'), analyzeResumeData);

module.exports = router;
