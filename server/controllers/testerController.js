/**
 * testerController.js
 * Handles student requests for Google OAuth Test User access (100-user cap).
 * Notifies admin via email with direct links to Google Cloud Console.
 */
const nodemailer = require('nodemailer');
const TesterRequest = require('../models/TesterRequest');
const User = require('../models/User');

const OAUTH_USER_CAP = 100;
const DEVELOPER_COUNT = 1; // Primary admin already registered in Google Cloud Console

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Public/User: Submit a request to be added as a Google OAuth Test User
 */
exports.createRequest = async (req, res) => {
  try {
    const { name, email, gmail, reason } = req.body;

    if (!name || !email || !gmail) {
      return res.status(400).json({ message: 'Name, contact email, and Gmail address are required.' });
    }

    const cleanGmail = gmail.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanGmail)) {
      return res.status(400).json({ message: 'Please provide a valid Gmail / Google Account address.' });
    }

    // Check if already requested
    const existing = await TesterRequest.findOne({ gmail: cleanGmail });
    if (existing) {
      if (existing.status === 'approved') {
        return res.status(200).json({
          message: 'This Gmail is already an approved Google OAuth test user!',
          request: existing,
        });
      }
      return res.status(200).json({
        message: 'A request for this Gmail is already pending admin approval.',
        request: existing,
      });
    }

    // Check capacity
    const approvedCount = await TesterRequest.countDocuments({ status: 'approved' });
    const totalUsed = DEVELOPER_COUNT + approvedCount;
    const remainingSlots = Math.max(0, OAUTH_USER_CAP - totalUsed);

    if (remainingSlots <= 0) {
      return res.status(400).json({
        message: 'The 100-user Google OAuth testing cap has been reached. Please contact the administrator.',
      });
    }

    // Create record
    const request = await TesterRequest.create({
      userId: req.user?._id || null,
      name: cleanName,
      email: cleanEmail,
      gmail: cleanGmail,
      reason: reason?.trim() || 'Connect Gmail & Google Calendar for clinical placement sync',
      status: 'pending',
    });

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'nikhilpuppalwar16@gmail.com';
    const transporter = getTransporter();

    if (transporter) {
      // 1. Email to Admin
      const adminMailOptions = {
        from: `"OppTrack Platform" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🚨 Action Required: New Google OAuth Tester Request (${cleanGmail})`,
        html: `
          <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E5EAF0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div style="background: #0B1F3A; padding: 24px 30px; border-bottom: 3px solid #18B7A0;">
              <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700;">OppTrack — Google OAuth Beta</h1>
              <p style="color: #94A3B8; font-size: 12.5px; margin: 4px 0 0;">Tester Access Request Notification</p>
            </div>
            <div style="padding: 28px 30px; color: #172033;">
              <div style="background: #E8F8F5; border-left: 4px solid #18B7A0; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
                <span style="font-weight: 700; color: #0D7A6B; font-size: 13.5px;">New Tester Access Request</span>
                <p style="margin: 3px 0 0; font-size: 12.5px; color: #475569;">
                  A student has requested to be added as an authorized Google OAuth test user.
                </p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px;">
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 10px 0; color: #64748B; width: 140px;">Applicant Name:</td>
                  <td style="padding: 10px 0; color: #0B1F3A; font-weight: 600;">${cleanName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 10px 0; color: #64748B;">Contact Email:</td>
                  <td style="padding: 10px 0; color: #0B1F3A;">${cleanEmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 10px 0; color: #64748B;">Google / Gmail to Add:</td>
                  <td style="padding: 10px 0; color: #123C73; font-weight: 700; font-size: 14px;">${cleanGmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 10px 0; color: #64748B;">Reason / Drive:</td>
                  <td style="padding: 10px 0; color: #475569;">${request.reason}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748B;">Current Cap Usage:</td>
                  <td style="padding: 10px 0; color: #0D7A6B; font-weight: 700;">
                    ${totalUsed + 1} / ${OAUTH_USER_CAP} users (${remainingSlots - 1} slots remaining)
                  </td>
                </tr>
              </table>

              <div style="background: #F8FAFD; border: 1px solid #E5EAF0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #0B1F3A; font-size: 13.5px;">How to add this user in Google Cloud Console:</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #475569; line-height: 1.6;">
                  <li>Click the button below to open your Google Cloud Audience page.</li>
                  <li>Under <strong>Test users</strong>, click <strong>+ Add users</strong>.</li>
                  <li>Paste <code>${cleanGmail}</code> and click <strong>Save</strong>.</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 28px 0;">
                <a href="https://console.cloud.google.com/auth/audience" target="_blank" style="background: #0B1F3A; color: #ffffff; padding: 12px 28px; font-size: 13.5px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 14px rgba(11,31,58,0.2);">
                  Open Google Cloud Console (Audience) →
                </a>
              </div>

              <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
                Once added in Google Cloud, you can also mark them approved in OppTrack Settings.
              </p>
            </div>
          </div>
        `,
      };

      // 2. Confirmation email to Requester
      const requesterMailOptions = {
        from: `"OppTrack Support" <${process.env.SMTP_USER}>`,
        to: cleanEmail,
        subject: `OppTrack — Google OAuth Tester Request Received (${cleanGmail})`,
        html: `
          <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #E5EAF0; border-radius: 12px; overflow: hidden;">
            <div style="background: #0B1F3A; padding: 22px 28px; border-bottom: 3px solid #18B7A0;">
              <h1 style="color: #ffffff; font-size: 19px; margin: 0; font-weight: 700;">OppTrack</h1>
              <p style="color: #94A3B8; font-size: 12px; margin: 3px 0 0;">Placement Drive Email & Calendar Sync</p>
            </div>
            <div style="padding: 26px 28px; color: #172033; font-size: 13.5px; line-height: 1.6;">
              <h2 style="font-size: 17px; color: #0B1F3A; margin: 0 0 12px;">Request Received!</h2>
              <p style="color: #475569; margin: 0 0 16px;">
                Hello <strong>${cleanName}</strong>,<br/>
                We received your request to enable Google OAuth (Gmail Auto-Fetch & Google Calendar Sync) for:
              </p>
              <div style="background: #E8F8F5; border: 1px solid rgba(24,183,160,0.3); border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-weight: 700; color: #0D7A6B; font-family: monospace;">
                ${cleanGmail}
              </div>
              <p style="color: #475569; margin: 0 0 14px;">
                OppTrack Google OAuth is currently in Developer Testing mode (limited to 100 verified beta testers). Our team has been notified to add your Gmail to the authorized test users list.
              </p>
              <p style="color: #475569; margin: 0 0 20px;">
                You will receive another email as soon as your account is activated!
              </p>
              <div style="border-top: 1px solid #E5EAF0; padding-top: 16px; font-size: 12px; color: #94A3B8;">
                OppTrack Placement Platform • Questions? Contact support at ${adminEmail}
              </div>
            </div>
          </div>
        `,
      };

      // Send both asynchronously
      transporter.sendMail(adminMailOptions).catch((err) => console.error('[TesterRequest] Admin email error:', err.message));
      transporter.sendMail(requesterMailOptions).catch((err) => console.error('[TesterRequest] Requester email error:', err.message));
    }

    res.status(201).json({
      message: 'Request submitted successfully! The administrator has been notified to add your Gmail.',
      request,
      stats: {
        totalUsed: totalUsed + 1,
        userCap: OAUTH_USER_CAP,
        remainingSlots: remainingSlots - 1,
      },
    });
  } catch (error) {
    console.error('[TesterRequest] createRequest error:', error);
    res.status(500).json({ message: 'Failed to submit tester request. Please try again.' });
  }
};

/**
 * Public/User: Get current statistics on 100-user cap
 */
exports.getStats = async (req, res) => {
  try {
    const approvedCount = await TesterRequest.countDocuments({ status: 'approved' });
    const pendingCount = await TesterRequest.countDocuments({ status: 'pending' });
    const totalUsed = DEVELOPER_COUNT + approvedCount;
    const remainingSlots = Math.max(0, OAUTH_USER_CAP - totalUsed);

    res.json({
      userCap: OAUTH_USER_CAP,
      developerCount: DEVELOPER_COUNT,
      approvedCount,
      pendingCount,
      totalUsed,
      remainingSlots,
      usagePercent: Math.round((totalUsed / OAUTH_USER_CAP) * 100),
    });
  } catch (error) {
    console.error('[TesterRequest] getStats error:', error);
    res.status(500).json({ message: 'Failed to fetch tester statistics' });
  }
};

/**
 * User: Get their own request status
 */
exports.getMyStatus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const email = req.user?.email || req.query.email;
    const gmail = req.query.gmail;

    const query = { $or: [] };
    if (userId) query.$or.push({ userId });
    if (email) query.$or.push({ email: email.toLowerCase() });
    if (gmail) query.$or.push({ gmail: gmail.toLowerCase() });

    if (!query.$or.length) {
      return res.json({ request: null });
    }

    const request = await TesterRequest.findOne(query).sort({ createdAt: -1 });
    res.json({ request });
  } catch (error) {
    console.error('[TesterRequest] getMyStatus error:', error);
    res.status(500).json({ message: 'Failed to fetch status' });
  }
};

/**
 * Admin: List all requests
 */
exports.listRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const requests = await TesterRequest.find(query).sort({ createdAt: -1 });
    const approvedCount = await TesterRequest.countDocuments({ status: 'approved' });
    const pendingCount = await TesterRequest.countDocuments({ status: 'pending' });

    res.json({
      requests,
      approvedCount,
      pendingCount,
      totalUsed: DEVELOPER_COUNT + approvedCount,
      remainingSlots: Math.max(0, OAUTH_USER_CAP - (DEVELOPER_COUNT + approvedCount)),
    });
  } catch (error) {
    console.error('[TesterRequest] listRequests error:', error);
    res.status(500).json({ message: 'Failed to load requests' });
  }
};

/**
 * Admin: Update status (e.g. mark as approved once added to Google Console)
 */
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await TesterRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    if (status === 'approved' && !request.approvedAt) {
      request.approvedAt = new Date();
    }

    await request.save();

    // If approved, notify the requester
    if (status === 'approved') {
      const transporter = getTransporter();
      if (transporter) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        transporter.sendMail({
          from: `"OppTrack Platform" <${process.env.SMTP_USER}>`,
          to: request.email,
          subject: '🎉 Approved: Your Google Account is Ready on OppTrack!',
          html: `
            <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #E5EAF0; border-radius: 12px; overflow: hidden;">
              <div style="background: #0B1F3A; padding: 22px 28px; border-bottom: 3px solid #18B7A0;">
                <h1 style="color: #ffffff; font-size: 19px; margin: 0; font-weight: 700;">OppTrack Access Activated</h1>
              </div>
              <div style="padding: 26px 28px; color: #172033; font-size: 13.5px; line-height: 1.6;">
                <h2 style="font-size: 18px; color: #0D7A6B; margin: 0 0 12px;">You've Been Added as an OAuth Test User!</h2>
                <p style="color: #475569; margin: 0 0 16px;">
                  Hello <strong>${request.name}</strong>,<br/>
                  Your Google account (<code>${request.gmail}</code>) has been successfully added to our Google Cloud Console test users list.
                </p>
                <div style="background: #F8FAFD; border: 1px solid #E5EAF0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 6px 0; color: #0B1F3A;">Next Steps to Connect:</h4>
                  <ol style="margin: 0; padding-left: 18px; color: #475569; font-size: 13px; line-height: 1.6;">
                    <li>Go to OppTrack <strong>Settings → Google Integrations</strong>.</li>
                    <li>Click <strong>Connect Google Account</strong>.</li>
                    <li>Log in with <code>${request.gmail}</code> and grant read-only placement & calendar sync permissions.</li>
                  </ol>
                </div>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${clientUrl}/settings" target="_blank" style="background: #18B7A0; color: #ffffff; padding: 12px 28px; font-size: 13.5px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Open OppTrack Settings →
                  </a>
                </div>
              </div>
            </div>
          `,
        }).catch((err) => console.error('[TesterRequest] Approval email error:', err.message));
      }
    }

    res.json({ message: `Request marked as ${status}`, request });
  } catch (error) {
    console.error('[TesterRequest] updateRequestStatus error:', error);
    res.status(500).json({ message: 'Failed to update request' });
  }
};
