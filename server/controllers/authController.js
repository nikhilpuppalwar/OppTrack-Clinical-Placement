const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, collegeName, branch, batch } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });

    const cleanEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) return res.status(400).json({ message: 'Email already registered.' });

    const user = await User.create({
      name,
      email: cleanEmail,
      passwordHash: password,
      collegeName: collegeName || '',
      branch: branch || '',
      batch: batch || '',
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
    res.status(500).json({ message: err.message || 'Registration failed.' });
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
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      batch: user.batch,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Login failed.' });
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
      return res.status(400).json({ message: 'Please provide your registered email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate random 40-char token and its hash
    const rawToken = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Client Reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

    // Transporter
    const host = user?.settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(user?.settings?.smtpPort || process.env.SMTP_PORT || 587);
    const authUser = user?.settings?.smtpUser || process.env.SMTP_USER;
    const authPass = user?.settings?.smtpPass || process.env.SMTP_PASS;

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
        // We still inform user or provide resetUrl in development
        if (process.env.NODE_ENV !== 'production') {
          return res.json({
            success: true,
            message: 'Password reset link generated. (SMTP error logged).',
            debugResetUrl: resetUrl,
          });
        }
      }
    } else {
      console.warn('SMTP credentials not configured. Direct reset URL:', resetUrl);
      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: 'Password reset initiated. Reset link generated.',
          debugResetUrl: resetUrl,
        });
      }
    }

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email! Please check your inbox and spam folder.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: err.message || 'Failed to process password reset request.' });
  }
};

// @POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Token, email, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
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
      message: 'Password has been successfully updated! You can now log in.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: err.message || 'Failed to reset password.' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
