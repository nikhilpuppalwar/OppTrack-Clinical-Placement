const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { autofillForm, analyzeNewData, syncNewData } = require('../controllers/aiFormController');

router.post('/form-autofill', protect, autofillForm);
router.post('/analyze-new-data', protect, analyzeNewData);
router.post('/sync-new-data', protect, syncNewData);

module.exports = router;
