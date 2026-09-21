/**
 * googleController.js
 * Handles OAuth 2.0 URLs, callbacks, connection status, disconnect, and feature toggles.
 */
const User = require('../models/User');
const googleAuthService = require('../services/googleAuth.service');

// @GET /api/google/auth-url
const getAuthUrl = async (req, res) => {
  try {
    const url = googleAuthService.generateAuthUrl(req.user._id);
    res.json({ url });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @GET /api/google/callback
const handleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${clientUrl}/settings?google=error&message=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${clientUrl}/settings?google=error&message=Missing+code+or+state`);
  }

  try {
    await googleAuthService.handleAuthCallback(code, state);
    return res.redirect(`${clientUrl}/settings?google=connected`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`${clientUrl}/settings?google=error&message=${encodeURIComponent(err.message)}`);
  }
};

// @GET /api/google/status
const getStatus = async (req, res) => {
  const user = await User.findById(req.user._id);
  const auth = user.googleAuth || {};
  res.json({
    isConnected: Boolean(auth.refreshToken),
    connectedAt: auth.connectedAt,
    googleEmail: auth.googleEmail,
    gmailSyncEnabled: Boolean(auth.gmailSyncEnabled),
    calendarSyncEnabled: Boolean(auth.calendarSyncEnabled),
    lastGmailSyncAt: auth.lastGmailSyncAt,
  });
};

// @POST /api/google/disconnect
const disconnect = async (req, res) => {
  try {
    await googleAuthService.disconnectGoogle(req.user._id);
    res.json({ message: 'Google account disconnected successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @PATCH /api/google/settings
const updateSettings = async (req, res) => {
  const { gmailSyncEnabled, calendarSyncEnabled } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.googleAuth) user.googleAuth = {};

  if (typeof gmailSyncEnabled === 'boolean') {
    user.googleAuth.gmailSyncEnabled = gmailSyncEnabled;
  }
  if (typeof calendarSyncEnabled === 'boolean') {
    user.googleAuth.calendarSyncEnabled = calendarSyncEnabled;
  }

  await user.save();

  res.json({
    gmailSyncEnabled: user.googleAuth.gmailSyncEnabled,
    calendarSyncEnabled: user.googleAuth.calendarSyncEnabled,
  });
};

module.exports = {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  updateSettings,
};
