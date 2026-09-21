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
  verifyAndMergeSync,
  rejectSync,
  analyzeTextData,
} = require('../controllers/extensionSyncController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getProfile).put(protect, updateProfile);
router.post('/field', protect, createField);
router.put('/field/:fieldId', protect, updateField);
router.delete('/field/:fieldId', protect, deleteField);
router.post('/restore-defaults', protect, restoreDefaultFields);
router.get('/pending-syncs', protect, getPendingSyncs);
router.post('/verify-sync/:id', protect, verifyAndMergeSync);
router.post('/reject-sync/:id', protect, rejectSync);
router.post('/analyze-text', protect, analyzeTextData);

module.exports = router;
