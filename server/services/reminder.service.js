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
  const port = Number(user?.settings?.smtpPort) || Number(process.env.SMTP_PORT) || 587;
  const authUser = user?.settings?.smtpUser || process.env.SMTP_USER;
  const authPass = user?.settings?.smtpPass || process.env.SMTP_PASS;

  if (!authUser || !authPass) {
    throw new Error('SMTP Email & Password not configured. Please add SMTP credentials in Settings.');
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
  if (!opportunity.deadline) return;
  const leadHours = user.settings?.reminderLeadHours ?? 24;
  const remindAt = new Date(new Date(opportunity.deadline).getTime() - leadHours * 60 * 60 * 1000);
  if (remindAt <= new Date()) return; // Already past, skip

  await Reminder.create({
    userId: user._id,
    opportunityId: opportunity._id,
    remindAt,
    channel: user.settings?.notificationChannel ?? 'email',
  });
};

const sendReminderEmail = async (user, opportunity) => {
  const { transporter, fromEmail } = getTransporter(user);
  const deadline = new Date(opportunity.deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  await transporter.sendMail({
    from: `"OppTrack" <${fromEmail}>`,
    to: user.email,
    subject: `⏰ Deadline Reminder: ${opportunity.company} — ${opportunity.role}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#6366f1;">⏰ Deadline Reminder</h2>
        <p>Your deadline for <strong>${opportunity.company} — ${opportunity.role}</strong> is approaching!</p>
        <p><strong>Deadline:</strong> ${deadline}</p>
        <p><strong>Status:</strong> ${opportunity.status.replace('_', ' ').toUpperCase()}</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/opportunities/${opportunity._id}" 
           style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;margin-top:16px;">
          View Opportunity
        </a>
        <hr style="margin:24px 0;opacity:0.2"/>
        <small style="color:#888">OppTrack — Your personal placement tracker</small>
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
        <h2 style="color: #6366f1; margin-top:0;">✅ OppTrack Email Setup Verified!</h2>
        <p>Hello <strong>${user.name || 'Student'}</strong>,</p>
        <p>Your SMTP Email settings have been configured successfully!</p>
        <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; margin: 16px 0;">
          <strong>Configured Sender:</strong> ${fromEmail}<br/>
          <strong>Target Email:</strong> ${user.email}<br/>
          <strong>Status:</strong> Connected & Operational
        </div>
        <p>You will now receive automatic email reminders for all upcoming placement & internship deadlines.</p>
        <hr style="margin: 20px 0; opacity: 0.2;" />
        <small style="color: #888;">OppTrack Placement Tracker</small>
      </div>
    `,
  });
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
          await sendReminderEmail(user, opportunity);
          reminder.sent = true;
          await reminder.save();

          await ActivityLog.create({
            userId: reminder.userId,
            opportunityId: reminder.opportunityId,
            eventType: 'reminder_sent',
            description: `Reminder sent for ${opportunity.company} — ${opportunity.role}`,
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

module.exports = { scheduleReminder, sendTestEmail, startCronJob };
