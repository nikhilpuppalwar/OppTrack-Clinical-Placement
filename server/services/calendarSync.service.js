/**
 * calendarSync.service.js
 * Mirrors placement opportunity deadlines, OA/test dates, drive dates, and interview dates
 * to the user's primary Google Calendar with popup reminders.
 */
const { google } = require('googleapis');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const googleAuthService = require('./googleAuth.service');

/**
 * Helper to sync a single milestone date to Google Calendar
 */
async function syncMilestone({ calendar, opportunity, typeKey, dateValue, titleSuffix, existingEventId }) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;

  const isDateOnly = typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim());
  const startObj = isDateOnly
    ? { date: dateValue.trim() }
    : { dateTime: d.toISOString(), timeZone: 'Asia/Kolkata' };
  const endObj = isDateOnly
    ? { date: dateValue.trim() }
    : { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Kolkata' };

  const eventPayload = {
    summary: `${opportunity.company} — ${titleSuffix}`,
    description: [
      `Role: ${opportunity.role}`,
      `Milestone: ${titleSuffix}`,
      `CTC/Stipend: ${opportunity.ctc || opportunity.stipend || 'N/A'}`,
      `Status: ${opportunity.status || 'not_applied'}`,
      opportunity.location ? `Location: ${opportunity.location}` : '',
      opportunity.shortlistInfo ? `Shortlist / Notes: ${opportunity.shortlistInfo}` : '',
      linksList ? `Links:\n${linksList}` : '',
      '\n(Synced automatically via OppTrack)',
    ].filter(Boolean).join('\n'),
    start: startObj,
    end: endObj,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 },      // 1 hour before
      ],
    },
  };

  if (existingEventId) {
    try {
      const res = await calendar.events.update({
        calendarId: 'primary',
        eventId: existingEventId,
        requestBody: eventPayload,
      });
      return res.data?.id || existingEventId;
    } catch (err) {
      if (err.code !== 404 && err.code !== 410) {
        console.warn(`Could not update calendar event (${typeKey}):`, err.message);
      }
    }
  }

  // Insert new event
  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventPayload,
    });
    return res.data?.id || null;
  } catch (err) {
    console.warn(`Could not insert calendar event (${typeKey}):`, err.message);
    return null;
  }
}

/**
 * Creates or updates all date events for an opportunity in the user's primary Google Calendar
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {object} opportunity - Opportunity mongoose document or plain object
 */
async function createOrUpdateEvent(userId, opportunity) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.googleAuth?.calendarSyncEnabled || !user.googleAuth?.refreshToken) {
      return null;
    }

    const auth = await googleAuthService.getAuthorizedGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const eventIds = {
      ...(opportunity.googleCalendarEventIds || {}),
    };

    // Helper to find date from customFields if not in top level
    const findCustomDate = (terms) => {
      if (!Array.isArray(opportunity.customFields)) return null;
      const found = opportunity.customFields.find(f => 
        terms.some(t => f.id?.toLowerCase().includes(t) || f.label?.toLowerCase().includes(t)) && !f.hidden
      );
      if (found && found.value) {
        const parsed = new Date(found.value);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };

    // 1. Deadline event
    const deadlineVal = opportunity.deadline;
    if (deadlineVal) {
      const id = await syncMilestone({
        calendar,
        opportunity,
        typeKey: 'deadline',
        dateValue: deadlineVal,
        titleSuffix: 'Application Deadline',
        existingEventId: eventIds.deadline || opportunity.googleCalendarEventId,
      });
      if (id) {
        eventIds.deadline = id;
      }
    }

    // 2. OA / Test Date event
    const testDateVal = opportunity.testDate || findCustomDate(['test', 'oa', 'assessment', 'exam']);
    if (testDateVal) {
      const id = await syncMilestone({
        calendar,
        opportunity,
        typeKey: 'test',
        dateValue: testDateVal,
        titleSuffix: 'OA / Online Assessment',
        existingEventId: eventIds.test,
      });
      if (id) {
        eventIds.test = id;
      }
    }

    // 3. Drive Date event
    const driveDateVal = opportunity.driveDate || findCustomDate(['drive', 'campus drive', 'recruitment drive']);
    if (driveDateVal) {
      const id = await syncMilestone({
        calendar,
        opportunity,
        typeKey: 'drive',
        dateValue: driveDateVal,
        titleSuffix: 'Campus Placement Drive',
        existingEventId: eventIds.drive,
      });
      if (id) {
        eventIds.drive = id;
      }
    }

    // 4. Interview / Round 2 Date event
    const interviewDateVal = opportunity.interviewDate || findCustomDate(['interview', 'round 2', 'technical interview']);
    if (interviewDateVal) {
      const id = await syncMilestone({
        calendar,
        opportunity,
        typeKey: 'interview',
        dateValue: interviewDateVal,
        titleSuffix: 'Interview / Round 2',
        existingEventId: eventIds.interview,
      });
      if (id) {
        eventIds.interview = id;
      }
    }

    // Update opportunity with event IDs
    await Opportunity.findByIdAndUpdate(opportunity._id, {
      googleCalendarEventId: eventIds.deadline || Object.values(eventIds)[0] || null,
      googleCalendarEventIds: eventIds,
    });
    opportunity.googleCalendarEventId = eventIds.deadline || Object.values(eventIds)[0] || null;
    opportunity.googleCalendarEventIds = eventIds;

    return eventIds;
  } catch (err) {
    console.error('calendarSync.service createOrUpdateEvent error:', err.message);
    return null;
  }
}

/**
 * Deletes all associated Google Calendar events when an opportunity is deleted or reaches terminal status
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {object} opportunity
 */
async function deleteEvent(userId, opportunity) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.googleAuth?.calendarSyncEnabled || !user.googleAuth?.refreshToken) {
      return null;
    }

    const idsToDelete = new Set();
    if (opportunity.googleCalendarEventId) idsToDelete.add(opportunity.googleCalendarEventId);
    if (opportunity.googleCalendarEventIds) {
      Object.values(opportunity.googleCalendarEventIds).filter(Boolean).forEach(id => idsToDelete.add(id));
    }

    if (idsToDelete.size === 0) return null;

    const auth = await googleAuthService.getAuthorizedGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    for (const eventId of idsToDelete) {
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId,
        });
      } catch (err) {
        if (err.code !== 404 && err.code !== 410) {
          console.warn(`Could not delete calendar event (${eventId}):`, err.message);
        }
      }
    }

    await Opportunity.findByIdAndUpdate(opportunity._id, {
      googleCalendarEventId: null,
      googleCalendarEventIds: { deadline: null, test: null, drive: null, interview: null },
    });
    opportunity.googleCalendarEventId = null;
    opportunity.googleCalendarEventIds = { deadline: null, test: null, drive: null, interview: null };

    return true;
  } catch (err) {
    console.error('calendarSync.service deleteEvent error:', err.message);
    return null;
  }
}

/**
 * One-time batch sync: syncs all opportunities with deadlines to Google Calendar
 * @param {string|mongoose.Types.ObjectId} userId
 */
async function syncAllUserOpportunities(userId) {
  const user = await User.findById(userId);
  if (!user || !user.googleAuth?.refreshToken) {
    const err = new Error('Google Account is not connected. Please connect your Google Account in Settings.');
    err.isGoogleAuthMissing = true;
    throw err;
  }

  // Ensure calendarSyncEnabled is active so createOrUpdateEvent does not bail out
  if (!user.googleAuth.calendarSyncEnabled) {
    user.googleAuth.calendarSyncEnabled = true;
    await user.save();
  }

  const opportunities = await Opportunity.find({
    userId,
    status: { $nin: ['rejected', 'offer'] },
  });

  let syncedCount = 0;
  let errorCount = 0;

  for (const opp of opportunities) {
    try {
      const res = await createOrUpdateEvent(userId, opp);
      if (res) {
        syncedCount++;
      }
    } catch (err) {
      console.error(`Failed to sync opp ${opp._id} to Calendar:`, err.message);
      errorCount++;
    }
  }

  return { total: opportunities.length, syncedCount, errorCount };
}

/**
 * Fetches events from the user's primary Google Calendar via Google Calendar API v3
 * @param {string|mongoose.Types.ObjectId} userId
 */
async function getGoogleCalendarEvents(userId) {
  const user = await User.findById(userId);
  if (!user || !user.googleAuth?.refreshToken) {
    return { isConnected: false, events: [], message: 'Google Account is not connected.' };
  }

  // Auto-activate calendarSyncEnabled if refresh token is present
  if (!user.googleAuth.calendarSyncEnabled) {
    user.googleAuth.calendarSyncEnabled = true;
    await user.save().catch(() => {});
  }

  try {
    const auth = await googleAuthService.getAuthorizedGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    // Default 3 months in past to 6 months in future
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 1).toISOString();

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const items = res.data.items || [];
    const formattedEvents = items.map((item) => {
      const isOppTrack =
        Boolean(item.description && item.description.includes('Synced automatically via OppTrack')) ||
        Boolean(item.summary &&
          (item.summary.includes('— Application Deadline') ||
            item.summary.includes('— OA') ||
            item.summary.includes('— Campus Placement Drive') ||
            item.summary.includes('— Interview')));

      let start = null;
      let end = null;
      let allDay = false;

      if (item.start?.dateTime) {
        start = new Date(item.start.dateTime);
      } else if (item.start?.date) {
        start = new Date(`${item.start.date}T00:00:00`);
        allDay = true;
      }

      if (item.end?.dateTime) {
        end = new Date(item.end.dateTime);
      } else if (item.end?.date) {
        end = new Date(`${item.end.date}T23:59:59`);
      } else if (start) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }

      let milestoneType = 'other';
      const summaryUpper = (item.summary || '').toLowerCase();
      if (summaryUpper.includes('application deadline') || summaryUpper.includes('deadline')) {
        milestoneType = 'deadline';
      } else if (summaryUpper.includes('oa') || summaryUpper.includes('assessment') || summaryUpper.includes('test')) {
        milestoneType = 'test';
      } else if (summaryUpper.includes('placement drive') || summaryUpper.includes('campus drive') || summaryUpper.includes('drive')) {
        milestoneType = 'drive';
      } else if (summaryUpper.includes('interview')) {
        milestoneType = 'interview';
      }

      let color = '#4285F4'; // Google Calendar blue
      if (isOppTrack) {
        if (milestoneType === 'deadline') color = '#2563EB';
        else if (milestoneType === 'test') color = '#F59E0B';
        else if (milestoneType === 'drive') color = '#8B5CF6';
        else if (milestoneType === 'interview') color = '#EA580C';
      }

      return {
        id: item.id,
        title: item.summary || 'Untitled Event',
        start,
        end,
        allDay,
        description: item.description || '',
        location: item.location || '',
        htmlLink: item.htmlLink || `https://calendar.google.com/calendar/u/0/r/eventedit/${item.id}`,
        isOppTrack,
        milestoneType,
        source: 'google',
        color,
      };
    }).filter(e => e.start && !isNaN(e.start.getTime()));

    return {
      isConnected: true,
      googleEmail: user.googleAuth.googleEmail,
      calendarSyncEnabled: true,
      events: formattedEvents,
    };
  } catch (err) {
    console.error('getGoogleCalendarEvents error:', err.message);
    return {
      isConnected: true,
      googleEmail: user.googleAuth?.googleEmail,
      calendarSyncEnabled: Boolean(user.googleAuth?.calendarSyncEnabled),
      error: err.message,
      events: [],
    };
  }
}

module.exports = {
  createOrUpdateEvent,
  deleteEvent,
  syncAllUserOpportunities,
  getGoogleCalendarEvents,
};
