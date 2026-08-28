const express = require('express');
const router = express.Router();
const { createFormHistory, logSensitiveReveal, getFormHistory } = require('../controllers/formHistoryController');
const { protect } = require('../middleware/auth');

// All routes require JWT auth, scoped to req.user.id
router.get('/', protect, getFormHistory);
router.post('/', protect, createFormHistory);
router.post('/sensitive-reveal', protect, logSensitiveReveal);

module.exports = router;
