const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  createRequest,
  getStats,
  getMyStatus,
  listRequests,
  updateRequestStatus,
} = require('../controllers/testerController');

// Optional authentication middleware (allows logged in or guest applicants)
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch (_) {}
  }
  next();
};

// Public / User routes
router.get('/stats', getStats);
router.post('/', optionalAuth, createRequest);
router.get('/my-status', optionalAuth, getMyStatus);

// Management routes
router.get('/all', protect, listRequests);
router.patch('/:id/status', protect, updateRequestStatus);

module.exports = router;
