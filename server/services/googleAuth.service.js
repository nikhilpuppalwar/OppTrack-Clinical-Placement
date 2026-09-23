/**
 * googleAuth.service.js
 * Manages Google OAuth 2.0 flow, token encryption, and provides authorized googleapis clients.
 */
const { google } = require('googleapis');
const User = require('../models/User');
const cryptoUtil = require('../utils/crypto.util');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Creates a new OAuth2 client instance
 */
function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback';

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates the Google OAuth consent screen URL
 * @param {string} userId
 * @returns {string} Auth URL
 */
function generateAuthUrl(userId) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured on server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env');
  }

  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Ensures a refresh_token is returned
    scope: SCOPES,
    state: String(userId),
  });
}

/**
 * Exchanges authorization code for tokens and saves encrypted refresh token to user
 * @param {string} code
 * @param {string} userId
 */
async function handleAuthCallback(code, userId) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  let googleEmail = null;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    googleEmail = userInfo.data?.email || null;
  } catch (err) {
    console.warn('Could not fetch Google user info:', err.message);
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found during Google OAuth callback');

  if (tokens.refresh_token) {
    const encryptedRefreshToken = cryptoUtil.encrypt(tokens.refresh_token);
    user.googleAuth.refreshToken = encryptedRefreshToken;
  } else if (!user.googleAuth?.refreshToken) {
    throw new Error('No refresh token received. Please re-authorize with consent prompt.');
  }

  user.googleAuth.connectedAt = new Date();
  if (googleEmail) user.googleAuth.googleEmail = googleEmail;
  user.googleAuth.calendarSyncEnabled = true;
  user.googleAuth.gmailSyncEnabled = true;

  await user.save();

  // Trigger initial calendar sync in background for existing opportunities
  setImmediate(() => {
    try {
      const calendarSync = require('./calendarSync.service');
      calendarSync.syncAllUserOpportunities(userId).catch(err => {
        console.warn('Initial calendar sync background error:', err.message);
      });
    } catch (e) {
      console.warn('Could not run initial calendar sync:', e.message);
    }
  });

  return { user, googleEmail };
}

/**
 * Loads stored refresh token, sets up an authorized OAuth2 client that refreshes automatically
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<google.auth.OAuth2>}
 */
async function getAuthorizedGoogleClient(userId) {
  const user = await User.findById(userId);
  if (!user || !user.googleAuth?.refreshToken) {
    const err = new Error('Google Account is not connected. Please connect your Google Account in Settings.');
    err.isGoogleAuthMissing = true;
    throw err;
  }

  let plainRefreshToken;
  try {
    plainRefreshToken = cryptoUtil.decrypt(user.googleAuth.refreshToken);
  } catch {
    const err = new Error('Failed to decrypt Google authorization token. Please reconnect Google Account.');
    err.isGoogleAuthMissing = true;
    throw err;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: plainRefreshToken,
  });

  // Listen for refresh token rotations if Google provides a new one
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.refresh_token) {
      user.googleAuth.refreshToken = cryptoUtil.encrypt(newTokens.refresh_token);
      await user.save().catch(e => console.error('Error updating refreshed token:', e));
    }
  });

  return oauth2Client;
}

/**
 * Disconnects the user's Google account
 * @param {string|mongoose.Types.ObjectId} userId
 */
async function disconnectGoogle(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.googleAuth?.refreshToken) {
    try {
      const plainRefreshToken = cryptoUtil.decrypt(user.googleAuth.refreshToken);
      const oauth2Client = createOAuth2Client();
      await oauth2Client.revokeToken(plainRefreshToken);
    } catch (err) {
      console.warn('Could not revoke Google token remotely:', err.message);
    }
  }

  user.googleAuth = {
    refreshToken: null,
    connectedAt: null,
    googleEmail: null,
    gmailSyncEnabled: false,
    calendarSyncEnabled: false,
    lastGmailSyncAt: null,
  };

  await user.save();
  return { success: true };
}

module.exports = {
  SCOPES,
  createOAuth2Client,
  generateAuthUrl,
  handleAuthCallback,
  getAuthorizedGoogleClient,
  disconnectGoogle,
};
