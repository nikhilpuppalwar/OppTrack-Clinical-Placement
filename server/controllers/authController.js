const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const gmailSyncService = require('../services/gmailSync.service');
const cryptoUtil = require('../utils/crypto.util');

function safeDecrypt(value) {
  if (!value) return '';
  try { return cryptoUtil.decrypt(value); } catch { return value; }
}

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePasswordPolicy = (password) => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain at least one special character.';
  return null;
};

const isAllowedClientUrl = (urlStr) => {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname.toLowerCase();

    // 1. Allow localhost and 127.0.0.1 for local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

    // 2. Allow any Vercel deployment (*.vercel.app)
    if (hostname === 'vercel.app' || hostname.endsWith('.vercel.app')) return true;

    // 3. Allow origins configured in environment variables (CLIENT_URL, FRONTEND_URL, VERCEL_URL)
    const envOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ]
      .filter(Boolean)
      .flatMap((s) => s.split(','))
      .map((s) => s.trim().toLowerCase().replace(/\/+$/, ''));

    const originWithoutTrailing = `${parsed.protocol}//${parsed.host}`.toLowerCase();
    for (const envOrigin of envOrigins) {
      if (!envOrigin) continue;
      if (envOrigin === originWithoutTrailing || envOrigin.includes(hostname)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
};

const getClientBaseUrl = (req) => {
  // 1. Check if client explicitly sent clientUrl in body (e.g. from Vercel frontend)
  if (req?.body?.clientUrl && isAllowedClientUrl(req.body.clientUrl)) {
    const parsed = new URL(req.body.clientUrl);
    return `${parsed.protocol}//${parsed.host}`;
  }

  // 2. Check Origin header from the browser
  const origin = req?.headers?.origin;
  if (origin && origin !== 'null' && isAllowedClientUrl(origin)) {
    const parsed = new URL(origin);
    return `${parsed.protocol}//${parsed.host}`;
  }

  // 3. Check Referer header
  const referer = req?.headers?.referer;
  if (referer && isAllowedClientUrl(referer)) {
    const parsed = new URL(referer);
    return `${parsed.protocol}//${parsed.host}`;
  }

  // 4. Fallback to CLIENT_URL or FRONTEND_URL or VERCEL_URL environment variable
  const envUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (envUrl) {
    const primary = envUrl.split(',')[0].trim().replace(/\/+$/, '');
    if (primary) return primary;
  }

  // 5. Default production fallback for OppTrack Vercel deployment
  if (process.env.NODE_ENV === 'production') {
    return 'https://opp-track-clinical-placement.vercel.app';
  }

  return 'http://localhost:5173';
};

// @POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, collegeName, branch, batch } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Full name, email address, and password are required.' });

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const pwError = validatePasswordPolicy(password);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(400).json({
        message: 'An account may already exist with this email. Try signing in or resetting your password.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password,
      collegeName: collegeName ? collegeName.trim() : '',
      branch: branch ? branch.trim() : '',
      batch: batch ? batch.trim() : '',
    });

    // Create empty profile (upsert if exists)
    await Profile.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id },
      { upsert: true, returnDocument: 'after' }
    );

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      batch: user.batch,
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'We couldn\'t create your account right now. Please try again shortly.' });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Email or password is incorrect.' });

    const token = generateToken(user._id);

    // Auto-sync Gmail once per day on first login in background
    const todayStr = new Date().toISOString().slice(0, 10);
    let autoSyncedOnLogin = false;
    if (user.lastLoginAutoSyncDate !== todayStr) {
      user.lastLoginAutoSyncDate = todayStr;
      await user.save();

      if (user.googleAuth?.refreshToken) {
        autoSyncedOnLogin = true;
        // Run in background asynchronously without blocking the login response
        gmailSyncService.syncUserGmail(user._id).catch(err => {
          if (err.isGoogleAuthExpired || err.message?.includes('invalid_grant')) {
            console.warn(`[Auto-Sync] Google authorization expired for user ${user._id}. Token cleared; user needs to reconnect in Settings.`);
          } else {
            console.warn(`[Auto-Sync] Background Gmail sync on login failed for user ${user._id}:`, err.message);
          }
        });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      batch: user.batch,
      token,
      autoSyncedOnLogin,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'We couldn\'t sign you in right now. Please try again shortly.' });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      batch: user.batch,
      settings: user.settings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const genericMessage = "If an account exists for this email, you'll receive password reset instructions shortly.";
    const user = await User.findOne({ email: cleanEmail });

    // Prevent account enumeration: return identical success message if user not found
    if (!user) {
      return res.json({
        success: true,
        message: genericMessage,
      });
    }

    // Generate random 40-char token and its hash
    const rawToken = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Dynamic Client Reset URL (resolves to Vercel production/preview domain, CLIENT_URL, or localhost)
    const clientUrl = getClientBaseUrl(req);
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

    // Transporter
    const host = user?.settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(user?.settings?.smtpPort || process.env.SMTP_PORT || 587);
    const authUser = user?.settings?.smtpUser || process.env.SMTP_USER;
    const authPass = safeDecrypt(user?.settings?.smtpPass) || process.env.SMTP_PASS;

    if (authUser && authPass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user: authUser, pass: authPass },
        });

        const mailOptions = {
          from: `"OppTrack Security" <${authUser}>`,
          to: cleanEmail,
          subject: 'OppTrack — Reset Your Account Password',
          html: `
            <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <div style="background: #0B1F3A; padding: 26px 32px; border-bottom: 2px solid #18B7A0;">
                <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">OppTrack</h1>
                <p style="color: #94A3B8; font-size: 12.5px; margin: 4px 0 0;">Precision Placement Productivity Platform</p>
              </div>
              <div style="padding: 32px 32px 28px; color: #1e293b;">
                <h2 style="font-size: 19px; color: #0B1F3A; margin: 0 0 12px; font-weight: 700;">Password Reset Request</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                  Hello <strong>${user.name || 'Student'}</strong>,<br/>
                  We received a request to reset the password for your OppTrack placement account (${cleanEmail}).
                </p>
                <div style="margin: 28px 0; text-align: center;">
                  <a href="${resetUrl}" target="_blank" style="background-color: #18B7A0; color: #ffffff; padding: 13px 30px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 14px rgba(24, 183, 160, 0.35);">
                    Reset My Password →
                  </a>
                </div>
                <p style="font-size: 12.5px; line-height: 1.5; color: #64748b; margin: 24px 0 8px;">
                  Or copy and paste this link into your browser:
                </p>
                <div style="background: #f8fafd; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; font-size: 12px; word-break: break-all; color: #2563eb; font-family: monospace;">
                  ${resetUrl}
                </div>
                <div style="background-color: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 8px; padding: 12px 16px; margin-top: 24px; font-size: 12px; color: #166534; display: flex; align-items: center; gap: 8px;">
                  <span>🔒 This link will expire in <strong>60 minutes</strong>. If you did not request this, your account remains secure and no action is required.</span>
                </div>
              </div>
              <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 11.5px; color: #94a3b8;">
                OppTrack Campus Recruitment Tracker • Precision Placement
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.error('SMTP sendMail error:', mailErr);
        if (process.env.NODE_ENV !== 'production') {
          return res.json({
            success: true,
            message: genericMessage,
            debugResetUrl: resetUrl,
          });
        }
      }
    } else {
      console.warn('SMTP credentials not configured. Direct reset URL:', resetUrl);
      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: genericMessage,
          debugResetUrl: resetUrl,
        });
      }
    }

    res.json({
      success: true,
      message: genericMessage,
      ...(process.env.NODE_ENV !== 'production' ? { debugResetUrl: resetUrl } : {}),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process password reset request. Please try again shortly.' });
  }
};

// @POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Token, email, and new password are required.' });
    }

    const pwError = validatePasswordPolicy(newPassword);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    user.passwordHash = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({
      success: true,
      message: 'Your password has been updated.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password. Please try again shortly.' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
