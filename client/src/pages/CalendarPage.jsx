import { useEffect, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { opportunityAPI, googleAPI, calendarAPI } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, CalendarDays, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import toast from 'react-hot-toast';

const localizer = momentLocalizer(moment);

const STATUS_COLORS = {
  not_applied: '#64748b',
  applied: '#3b82f6',
  oa: '#f59e0b',
  interview: '#f97316',
  hr: '#a855f7',
  offer: '#22c55e',
  rejected: '#ef4444',
};

// Custom Toolbar matching Stitch AI design
const CustomToolbar = (toolbar) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToToday = () => toolbar.onNavigate('TODAY');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E5EAF0',
        flexWrap: 'wrap',
        gap: 14
      }}
    >
      {/* Left controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={goToToday}
          type="button"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            color: '#172033',
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Today
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={goToBack}
            title="Previous"
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#667085',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            title="Next"
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#667085',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
          {toolbar.label}
        </h2>
      </div>

      {/* Right view buttons */}
      <div style={{ display: 'flex', gap: 6, background: '#F8FAFD', padding: 3, borderRadius: 6, border: '1px solid #E5EAF0' }}>
        {['month', 'week', 'day', 'agenda'].map((viewName) => (
          <button
            key={viewName}
            onClick={() => toolbar.onView(viewName)}
            type="button"
            style={{
              background: toolbar.view === viewName ? '#FFFFFF' : 'transparent',
              border: toolbar.view === viewName ? '1px solid #E5EAF0' : 'none',
              color: toolbar.view === viewName ? '#0B1F3A' : '#667085',
              padding: '5px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: toolbar.view === viewName ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
              boxShadow: toolbar.view === viewName ? '0 1px 2px rgba(11, 31, 58, 0.04)' : 'none'
            }}
          >
            {viewName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [syncing, setSyncing] = useState(false);
  const [calendarSyncActive, setCalendarSyncActive] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [calendarMode, setCalendarMode] = useState('opptrack');
  const [milestoneFilter, setMilestoneFilter] = useState('all');
  const navigate = useNavigate();

  const fetchCalendarData = () => {
    googleAPI.getStatus()
      .then(({ data }) => {
        setCalendarSyncActive(!!data?.calendarSyncEnabled);
        setGoogleEmail(data?.googleEmail || '');
      })
      .catch(() => {});

    opportunityAPI.list()
      .then(({ data }) => {
        const oppsList = Array.isArray(data) ? data : (data?.opportunities || []);
        const evts = [];

        oppsList.forEach((o) => {
          const findCustomDate = (terms) => {
            if (!Array.isArray(o.customFields)) return null;
            const found = o.customFields.find(f => 
              terms.some(t => f.id?.toLowerCase().includes(t) || f.label?.toLowerCase().includes(t)) && !f.hidden
            );
            if (found && found.value) {
              const d = new Date(found.value);
              return isNaN(d.getTime()) ? null : d;
            }
            return null;
          };

          // 1. Application Deadline
          if (o.deadline && !isNaN(new Date(o.deadline).getTime())) {
            const start = new Date(o.deadline);
            evts.push({
              id: `${o._id}_deadline`,
              oppId: o._id,
              title: `${o.company} — Application Deadline`,
              milestoneType: 'deadline',
              milestoneLabel: 'Application Deadline',
              start,
              end: new Date(start.getTime() + 60 * 60 * 1000),
              company: o.company,
              role: o.role,
              status: o.status || 'applied',
              location: o.location,
              ctc: o.ctc || o.stipend || o.ppo,
              shortlistInfo: o.shortlistInfo,
              googleCalendarEventId: o.googleCalendarEventIds?.deadline || o.googleCalendarEventId || null,
              color: '#2563EB',
            });
          }

          // 2. OA / Test Date
          const testDateVal = o.testDate ? new Date(o.testDate) : findCustomDate(['test', 'oa', 'assessment', 'exam']);
          if (testDateVal && !isNaN(testDateVal.getTime())) {
            evts.push({
              id: `${o._id}_test`,
              oppId: o._id,
              title: `${o.company} — OA Assessment Test`,
              milestoneType: 'test',
              milestoneLabel: 'OA / Assessment Test',
              start: testDateVal,
              end: new Date(testDateVal.getTime() + 90 * 60 * 1000),
              company: o.company,
              role: o.role,
              status: o.status || 'oa',
              location: o.location,
              ctc: o.ctc || o.stipend || o.ppo,
              shortlistInfo: o.shortlistInfo,
              googleCalendarEventId: o.googleCalendarEventIds?.test || null,
              color: '#F59E0B',
            });
          }

          // 3. Drive Date
          const driveDateVal = o.driveDate ? new Date(o.driveDate) : findCustomDate(['drive', 'campus drive', 'recruitment']);
          if (driveDateVal && !isNaN(driveDateVal.getTime())) {
            evts.push({
              id: `${o._id}_drive`,
              oppId: o._id,
              title: `${o.company} — Placement Drive`,
              milestoneType: 'drive',
              milestoneLabel: 'Placement Drive Date',
              start: driveDateVal,
              end: new Date(driveDateVal.getTime() + 3 * 60 * 60 * 1000),
              company: o.company,
              role: o.role,
              status: o.status || 'applied',
              location: o.location,
              ctc: o.ctc || o.stipend || o.ppo,
              shortlistInfo: o.shortlistInfo,
              googleCalendarEventId: o.googleCalendarEventIds?.drive || null,
              color: '#8B5CF6',
            });
          }

          // 4. Interview / Round 2 Date
          const interviewDateVal = o.interviewDate ? new Date(o.interviewDate) : findCustomDate(['interview', 'round 2', 'technical interview']);
          if (interviewDateVal && !isNaN(interviewDateVal.getTime())) {
            evts.push({
              id: `${o._id}_interview`,
              oppId: o._id,
              title: `${o.company} — Interview / Round 2`,
              milestoneType: 'interview',
              milestoneLabel: 'Interview / Round 2',
              start: interviewDateVal,
              end: new Date(interviewDateVal.getTime() + 60 * 60 * 1000),
              company: o.company,
              role: o.role,
              status: o.status || 'interview',
              location: o.location,
              ctc: o.ctc || o.stipend || o.ppo,
              shortlistInfo: o.shortlistInfo,
              googleCalendarEventId: o.googleCalendarEventIds?.interview || null,
              color: '#EA580C',
            });
          }
        });

        setEvents(evts);
      })
      .catch(() => toast.error('Failed to load calendar events'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    const toastId = toast.loading('Syncing all deadlines and test dates to Google Calendar…');
    try {
      const { data } = await calendarAPI.syncAll();
      toast.success(data.message || `Synced ${data.syncedCount || 0} dates to Google Calendar!`, { id: toastId });
      await fetchCalendarData();
    } catch (err) {
      if (err.response?.data?.isGoogleAuthMissing) {
        toast.error('Google Account not connected. Go to Settings to connect.', { id: toastId });
      } else {
        toast.error(err.response?.data?.message || 'Calendar sync failed', { id: toastId });
      }
    } finally {
      setSyncing(false);
    }
  };

  const eventStyle = (event) => ({
    style: {
      background: '#FFFFFF',
      border: '1px solid #E5EAF0',
      borderLeft: `4px solid ${event.color}`,
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 600,
      padding: '2px 6px',
      color: '#172033',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(11, 31, 58, 0.04)'
    },
  });

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const displayedEvents = events.filter(e => milestoneFilter === 'all' || e.milestoneType === milestoneFilter);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Header */}
      <div style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B1F3A', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Placement Calendar
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#667085' }}>
            Track application deadlines, OA assessment tests, drive schedules, and interview rounds
          </p>
        </div>

        {/* Legend & Google Calendar Sync Badge */}
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#667085', alignItems: 'center', flexWrap: 'wrap', fontWeight: 500 }}>
          {calendarSyncActive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#EAF2FF', border: '1px solid rgba(37, 99, 235, 0.25)',
              color: '#2563EB', padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700
            }}>
              <CalendarDays size={13} /> Google Calendar Active
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} /> Deadlines
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> OA Tests
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} /> Drives
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA580C' }} /> Interviews
          </span>
        </div>
      </div>

      {/* Control Bar: View Switcher & Milestone Filter Pills */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 10,
        padding: '10px 16px', marginBottom: 20, flexWrap: 'wrap', gap: 12,
        boxShadow: '0 1px 3px rgba(11, 31, 58, 0.03)'
      }}>
        {/* Left: Milestone Filter Pills */}
        <div style={{ display: 'flex', background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 6, padding: 3, gap: 4, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All Events (${events.length})` },
            { key: 'deadline', label: 'Deadlines' },
            { key: 'test', label: 'OA Tests' },
            { key: 'drive', label: 'Drives' },
            { key: 'interview', label: 'Interviews' },
          ].map(mf => (
            <button
              key={mf.key}
              type="button"
              onClick={() => setMilestoneFilter(mf.key)}
              style={{
                background: milestoneFilter === mf.key ? '#FFFFFF' : 'transparent',
                border: milestoneFilter === mf.key ? '1px solid #E5EAF0' : 'none',
                color: milestoneFilter === mf.key ? '#0B1F3A' : '#667085',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: milestoneFilter === mf.key ? 700 : 500,
                cursor: 'pointer',
                boxShadow: milestoneFilter === mf.key ? '0 1px 2px rgba(11, 31, 58, 0.04)' : 'none'
              }}
            >
              {mf.label}
            </button>
          ))}
        </div>

        {/* Center: Mode Toggle */}
        <div style={{ display: 'flex', background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 6, padding: 3, gap: 4 }}>
          <button
            type="button"
            onClick={() => setCalendarMode('opptrack')}
            style={{
              background: calendarMode === 'opptrack' ? '#E8F8F5' : 'transparent',
              border: calendarMode === 'opptrack' ? '1px solid rgba(24, 183, 160, 0.3)' : 'none',
              color: calendarMode === 'opptrack' ? '#087F71' : '#667085',
              padding: '6px 14px',
              borderRadius: 4,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <CalendarDays size={14} color={calendarMode === 'opptrack' ? '#18B7A0' : 'currentColor'} />
            OppTrack View
          </button>

          <button
            type="button"
            onClick={() => setCalendarMode('google')}
            style={{
              background: calendarMode === 'google' ? '#EAF2FF' : 'transparent',
              border: calendarMode === 'google' ? '1px solid rgba(37, 99, 235, 0.3)' : 'none',
              color: calendarMode === 'google' ? '#2563EB' : '#667085',
              padding: '6px 14px',
              borderRadius: 4,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Layers size={14} color={calendarMode === 'google' ? '#2563EB' : 'currentColor'} />
            Google Calendar
          </button>
        </div>

        {/* Right: Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            style={{
              background: '#EAF2FF',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              color: '#2563EB',
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw size={13} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing to Google Calendar…' : 'Sync to Google Calendar Now'}
          </button>

          <a
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#0B1F3A',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(11, 31, 58, 0.12)'
            }}
          >
            <ExternalLink size={13} /> Open in Google Calendar
          </a>
        </div>
      </div>

      {/* Calendar View (OppTrack Grid vs Embedded Google Calendar) */}
      {calendarMode === 'google' ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden', padding: 16, boxShadow: '0 2px 8px rgba(11, 31, 58, 0.04)' }}>
          {calendarSyncActive || googleEmail ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#0B1F3A', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                  <CalendarDays size={16} color="#2563EB" />
                  Google Calendar Account: <strong>{googleEmail || 'Primary Account'}</strong>
                </span>
                <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 700 }}>
                  ● Live Sync Active
                </span>
              </div>
              <iframe
                title="Google Calendar Web"
                src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(googleEmail || '')}&ctz=Asia%2FKolkata`}
                style={{
                  width: '100%',
                  height: 720,
                  border: '1px solid #E5EAF0',
                  borderRadius: 8,
                  background: '#ffffff',
                }}
              />
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <CalendarDays size={36} color="#2563EB" style={{ marginBottom: 12 }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#0B1F3A', fontWeight: 700 }}>Google Calendar Not Connected</h3>
              <p style={{ margin: '0 auto 20px auto', fontSize: 13.5, color: '#667085', maxWidth: 440 }}>
                To view and automatically synchronize your placement drive deadlines to Google Calendar, connect your Google account in Settings.
              </p>
              <Link
                to="/settings"
                style={{
                  background: '#0B1F3A',
                  color: '#fff',
                  padding: '9px 18px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Go to Settings & Connect Google Account
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Calendar Grid Container */
        <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(11, 31, 58, 0.04)' }}>
          <BigCalendar
            localizer={localizer}
            events={displayedEvents}
            date={date}
            view={view}
            onNavigate={(newDate) => setDate(newDate)}
            onView={(newView) => setView(newView)}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 720 }}
            eventPropGetter={eventStyle}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            components={{
              toolbar: CustomToolbar,
              event: ({ event }) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, width: '100%', overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.title}
                  </span>
                  {(event.googleCalendarEventId || calendarSyncActive) && (
                    <span
                      title="Also in Google Calendar"
                      style={{
                        background: '#EAF2FF',
                        border: '1px solid rgba(37, 99, 235, 0.3)',
                        borderRadius: 3,
                        padding: '0 3px',
                        color: '#2563EB',
                        fontSize: 9,
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      GCal
                    </span>
                  )}
                </div>
              )
            }}
            popup
          />
        </div>
      )}

      {/* Event Details Popover Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(11, 31, 58, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5EAF0',
              borderRadius: 12,
              width: '100%',
              maxWidth: 440,
              padding: 24,
              boxShadow: '0 16px 40px rgba(11, 31, 58, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: selectedEvent.color }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0B1F3A' }}>
                    {selectedEvent.company}
                  </h3>
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, color: selectedEvent.color,
                    background: `${selectedEvent.color}15`, padding: '2px 7px', borderRadius: 4, display: 'inline-block', marginTop: 3
                  }}>
                    {selectedEvent.milestoneLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'transparent', border: 'none', color: '#667085', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13.5, color: '#4B5563', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><strong>Role:</strong> {selectedEvent.role}</div>
              {selectedEvent.ctc && (
                <div><strong>Compensation:</strong> <span style={{ color: '#16A34A', fontWeight: 700 }}>{selectedEvent.ctc}</span></div>
              )}
              <div>
                <strong>Stage:</strong> <span style={{ textTransform: 'uppercase', color: selectedEvent.color, fontWeight: 700, fontSize: 12 }}>{selectedEvent.status}</span>
              </div>
              <div>
                <strong>Date & Time:</strong> {selectedEvent.start.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              {selectedEvent.shortlistInfo && (
                <div style={{
                  padding: '8px 12px', borderRadius: 6,
                  background: '#F9FAFB', border: '1px solid #E5EAF0',
                  fontSize: 12.5, color: '#1F2937'
                }}>
                  <strong>Shortlist / Notes:</strong> {selectedEvent.shortlistInfo}
                </div>
              )}

              {(selectedEvent.googleCalendarEventId || calendarSyncActive) && (
                <div style={{
                  marginTop: 6, padding: '8px 12px', borderRadius: 6,
                  background: '#EAF2FF', border: '1px solid rgba(37, 99, 235, 0.25)',
                  color: '#2563EB', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <CalendarDays size={14} />
                  <span>Synced to Google Calendar (Alerts: 24h & 1h prior)</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => navigate(`/opportunities/${selectedEvent.oppId || selectedEvent.id}`)}
                style={{
                  width: '100%',
                  background: '#0B1F3A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                View Opportunity Record →
              </button>
              {selectedEvent.start && (
                <a
                  href={`https://calendar.google.com/calendar/u/0/r/day/${selectedEvent.start.getFullYear()}/${selectedEvent.start.getMonth() + 1}/${selectedEvent.start.getDate()}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    background: '#EAF2FF',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    color: '#2563EB',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxSizing: 'border-box'
                  }}
                >
                  <ExternalLink size={13} /> Open Day in Google Calendar
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
