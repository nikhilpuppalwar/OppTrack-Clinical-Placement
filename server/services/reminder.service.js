/**
 * reminder.service.js
 * Schedules and sends email reminders for opportunity deadlines.
 * Supports per-user SMTP settings configured in Settings UI.
 */
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');
const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const getTransporter = (user) => {
  const host = user?.settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(user?.settings?.smtpPort || process.env.SMTP_PORT) || 587;
  const authUser = user?.settings?.smtpUser || process.env.SMTP_USER;
  const authPass = user?.settings?.smtpPass || process.env.SMTP_PASS;

  if (!authUser || !authPass) {
    throw new Error('Server SMTP credentials not configured in .env');
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: authUser,
        pass: authPass,
      },
    }),
    fromEmail: authUser,
  };
};

const scheduleReminder = async (opportunity, user) => {
  const leadHours = user.settings?.reminderLeadHours ?? 24;
  const channel = user.settings?.notificationChannel ?? 'browser';

  const milestones = [
    {
      type: 'test',
      date: opportunity.testDate,
      enabled: user.settings?.notifyTests !== false,
      title: `Online Assessment / Test: ${opportunity.company}`,
    },
    {
      type: 'deadline',
      date: opportunity.deadline,
      enabled: user.settings?.notifyDeadlines !== false,
      title: `Application Deadline: ${opportunity.company}`,
    },
    {
      type: 'drive',
      date: opportunity.driveDate,
      enabled: user.settings?.notifyDrives !== false,
      title: `Campus Drive: ${opportunity.company}`,
    },
    {
      type: 'interview',
      date: opportunity.interviewDate,
      enabled: user.settings?.notifyInterviews !== false,
      title: `Interview Round: ${opportunity.company}`,
    },
  ];

  for (const m of milestones) {
    if (!m.date || !m.enabled) continue;
    const targetDate = new Date(m.date);
    if (isNaN(targetDate.getTime())) continue;

    const remindAt = new Date(targetDate.getTime() - leadHours * 60 * 60 * 1000);
    if (remindAt <= new Date()) continue; // Already passed

    // Upsert reminder record
    await Reminder.findOneAndUpdate(
      {
        userId: user._id,
        opportunityId: opportunity._id,
        milestoneType: m.type,
      },
      {
        userId: user._id,
        opportunityId: opportunity._id,
        remindAt,
        channel,
        milestoneType: m.type,
        title: m.title,
        sent: false,
      },
      { upsert: true, new: true }
    );
  }
};

const sendReminderEmail = async (user, opportunity, milestoneType = 'deadline') => {
  const { transporter, fromEmail } = getTransporter(user);

  let milestoneLabel = 'Application Deadline';
  let dateVal = opportunity.deadline;
  let icon = '⏰';

  if (milestoneType === 'test') {
    milestoneLabel = 'Online Assessment / Test Date';
    dateVal = opportunity.testDate;
    icon = '🎯';
  } else if (milestoneType === 'drive') {
    milestoneLabel = 'Campus Placement Drive';
    dateVal = opportunity.driveDate;
    icon = '🏢';
  } else if (milestoneType === 'interview') {
    milestoneLabel = 'Interview / Selection Round';
    dateVal = opportunity.interviewDate;
    icon = '💼';
  }

  const formattedDate = dateVal
    ? new Date(dateVal).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : 'Upcoming Soon';

  await transporter.sendMail({
    from: `"OppTrack Notifications" <${fromEmail}>`,
    to: user.email,
    subject: `${icon} ${milestoneLabel} Reminder: ${opportunity.company} — ${opportunity.role}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #E5EAF0; border-radius: 12px; background: #ffffff;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
          <span style="font-size: 28px;">${icon}</span>
          <div>
            <h2 style="color: #0B1F3A; margin: 0; font-size: 18px;">${milestoneLabel} Reminder</h2>
            <p style="color: #667085; margin: 2px 0 0 0; font-size: 13px;">OppTrack Milestone Alert</p>
          </div>
        </div>

        <div style="background: #F8FAFD; border: 1px solid #E5EAF0; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 18px; font-weight: 700; color: #0B1F3A; margin-bottom: 4px;">
            ${opportunity.company}
          </div>
          <div style="font-size: 14px; color: #667085; margin-bottom: 12px;">
            ${opportunity.role || 'Opportunity'}
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 13px;">
            <div><strong>${milestoneLabel}:</strong> <span style="color: #2563EB; font-weight: 600;">${formattedDate}</span></div>
            ${opportunity.package ? `<div><strong>Compensation:</strong> ${opportunity.package}</div>` : ''}
            ${opportunity.shortlistInfo ? `<div><strong>Shortlist / Update:</strong> ${opportunity.shortlistInfo}</div>` : ''}
            <div><strong>Status:</strong> ${opportunity.status?.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>

        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/opportunities/${opportunity._id}" 
           style="display: block; text-align: center; padding: 11px 20px; background: #18B7A0; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 18px;">
          View Opportunity & Prep Materials →
        </a>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5EAF0;" />
        <small style="color: #94A3B8; font-size: 11px; display: block; text-align: center;">
          OppTrack — Placement & Clinical Career Intelligence OS
        </small>
      </div>
    `,
  });
};

const sendTestEmail = async (user) => {
  const { transporter, fromEmail } = getTransporter(user);
  await transporter.sendMail({
    from: `"OppTrack Notifications" <${fromEmail}>`,
    to: user.email,
    subject: `✅ OppTrack SMTP Email Configuration Test`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #18B7A0; margin-top:0;">✅ OppTrack Email Setup Verified!</h2>
        <p>Hello <strong>${user.name || 'Student'}</strong>,</p>
        <p>Your SMTP Email settings have been configured successfully!</p>
        <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; margin: 16px 0;">
          <strong>Configured Sender:</strong> ${fromEmail}<br/>
          <strong>Target Email:</strong> ${user.email}<br/>
          <strong>Status:</strong> Connected & Operational
        </div>
        <p>You will now receive automatic email reminders for all upcoming placement & internship milestones (Assessment Tests, Campus Drives, Interviews, and Deadlines).</p>
        <hr style="margin: 20px 0; opacity: 0.2;" />
        <small style="color: #888;">OppTrack Placement Tracker</small>
      </div>
    `,
  });
};

// Dispatch a live test notification (both email if configured, plus payload for browser)
const sendTestNotification = async (user, data = {}) => {
  const milestoneType = data.milestoneType || 'test';
  const company = data.company || 'Google';
  const role = data.role || 'Software Development Engineer';

  let title = `🎯 Test Reminder: ${company} Online Assessment`;
  let body = `${company} OA / Test scheduled in 24 hours. Check syllabus and coding IDE setup!`;

  if (milestoneType === 'deadline') {
    title = `⏳ Deadline Reminder: ${company} Application`;
    body = `Applications for ${company} — ${role} close tonight at 11:59 PM. Submit your form!`;
  } else if (milestoneType === 'drive') {
    title = `🏢 Drive Reminder: ${company} Campus Drive`;
    body = `${company} on-campus placement drive scheduled tomorrow at 9:00 AM. Bring ID card & copies of resume.`;
  } else if (milestoneType === 'interview') {
    title = `💼 Interview Reminder: ${company} Round 2`;
    body = `Interview round scheduled for ${company} — ${role}. Review technical projects and STAR stories.`;
  }

  let emailSent = false;
  let emailError = null;

  // Try sending email if user has SMTP configured and channel is email or both
  const userChannel = user?.settings?.notificationChannel || 'browser';
  if ((userChannel === 'email' || userChannel === 'both') && user?.settings?.smtpUser && user?.settings?.smtpPass) {
    try {
      const mockOpp = {
        _id: 'test',
        company,
        role,
        status: 'applied',
        package: '24 LPA (PPO)',
        testDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        driveDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        interviewDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
      };
      await sendReminderEmail(user, mockOpp, milestoneType);
      emailSent = true;
    } catch (err) {
      emailError = err.message;
    }
  }

  return {
    success: true,
    notification: {
      title,
      body,
      milestoneType,
      company,
      role,
      timestamp: new Date().toISOString(),
      channel: userChannel,
      emailSent,
      emailError,
    },
  };
};

// Retrieve all upcoming milestone events across all active user opportunities
const getUpcomingReminders = async (userId) => {
  const opportunities = await Opportunity.find({
    userId,
    status: { $nin: ['rejected'] },
  }).sort({ updatedAt: -1 });

  const now = new Date();
  const cutoff = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // Next 14 days
  const pastCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Past 2 hours

  const reminders = [];

  for (const opp of opportunities) {
    const checkDate = (dateVal, type, label, icon) => {
      if (!dateVal) return;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return;
      if (d >= pastCutoff && d <= cutoff) {
        const diffMs = d.getTime() - now.getTime();
        const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));
        const isUrgent = hoursLeft <= 24;

        reminders.push({
          id: `${opp._id}_${type}`,
          opportunityId: opp._id,
          company: opp.company,
          role: opp.role,
          package: opp.package,
          type: opp.type,
          milestoneType: type,
          milestoneLabel: label,
          icon,
          date: d.toISOString(),
          hoursLeft,
          isUrgent,
          status: opp.status,
          shortlistInfo: opp.shortlistInfo,
        });
      }
    };

    checkDate(opp.testDate, 'test', 'Online Assessment / Test', '🎯');
    checkDate(opp.deadline, 'deadline', 'Application Deadline', '⏳');
    checkDate(opp.driveDate, 'drive', 'Campus Drive Date', '🏢');
    checkDate(opp.interviewDate, 'interview', 'Interview Round', '💼');
  }

  // Sort by date ascending
  reminders.sort((a, b) => new Date(a.date) - new Date(b.date));

  return reminders;
};

const startCronJob = () => {
  const interval = process.env.CRON_INTERVAL || 5;
  cron.schedule(`*/${interval} * * * *`, async () => {
    try {
      const dueReminders = await Reminder.find({ remindAt: { $lte: new Date() }, sent: false });
      for (const reminder of dueReminders) {
        const [user, opportunity] = await Promise.all([
          User.findById(reminder.userId),
          Opportunity.findById(reminder.opportunityId),
        ]);
        if (!user || !opportunity) {
          reminder.sent = true;
          await reminder.save();
          continue;
        }
        try {
          if (reminder.channel === 'email' || reminder.channel === 'both') {
            await sendReminderEmail(user, opportunity, reminder.milestoneType);
          }
          reminder.sent = true;
          await reminder.save();

          await ActivityLog.create({
            userId: reminder.userId,
            opportunityId: reminder.opportunityId,
            eventType: 'reminder_sent',
            description: `Reminder sent for ${opportunity.company} — ${opportunity.role} (${reminder.milestoneType || 'deadline'})`,
          });
        } catch (emailErr) {
          console.error('Failed to send reminder email:', emailErr.message);
        }
      }
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  });
  console.log(`Reminder cron job started (every ${interval} min)`);
};

module.exports = {
  scheduleReminder,
  sendTestEmail,
  sendTestNotification,
  getUpcomingReminders,
  startCronJob,
};
