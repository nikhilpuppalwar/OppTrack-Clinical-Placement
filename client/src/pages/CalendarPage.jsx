import { useEffect, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { opportunityAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
        justify: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: '#171B18',
        borderBottom: '1px solid #2A302B',
        flexWrap: 'wrap',
        gap: 16
      }}
    >
      {/* Left controls */}
      <div style={{ display: 'flex', items: 'center', gap: 16 }}>
        <button
          onClick={goToToday}
          type="button"
          style={{
            background: 'transparent',
            border: '1px solid #2A302B',
            color: '#F2F3ED',
            padding: '6px 16px',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Today
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={goToBack}
            title="Previous"
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9A9F99',
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
              color: '#9A9F99',
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

        <h2 style={{ fontSize: 18, fontFamily: 'DM Mono, monospace', color: '#F2F3ED', margin: 0, fontWeight: 500, letterSpacing: '0.02em' }}>
          {toolbar.label}
        </h2>
      </div>

      {/* View Switcher Tabs (Month, Week, Day, Agenda) */}
      <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid #2A302B' }}>
        {['month', 'week', 'day', 'agenda'].map(viewMode => {
          const isActive = toolbar.view === viewMode;
          return (
            <button
              key={viewMode}
              type="button"
              onClick={() => toolbar.onView(viewMode)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #B7E34A' : '2px solid transparent',
                color: isActive ? '#F2F3ED' : '#9A9F99',
                paddingBottom: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {viewMode}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    opportunityAPI.list({ fields: 'company,role,ctc,deadline,status,location,_id' })
      .then(({ data }) => {
        const evts = data
          .filter(o => o.deadline)
          .map(o => ({
            id: o._id,
            title: `${o.company} — ${o.role}`,
            company: o.company,
            role: o.role,
            ctc: o.ctc,
            status: o.status,
            location: o.location,
            start: new Date(o.deadline),
            end: new Date(o.deadline),
            allDay: false,
            color: STATUS_COLORS[o.status] || '#b7e34a',
          }));
        setEvents(evts);
      })
      .catch(() => toast.error('Failed to load calendar events'))
      .finally(() => setLoading(false));
  }, []);

  const eventStyle = (event) => ({
    style: {
      background: 'rgba(23, 27, 24, 0.9)',
      border: `1px solid ${event.color}`,
      borderLeft: `4px solid ${event.color}`,
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 600,
      padding: '2px 6px',
      color: '#F2F3ED',
      cursor: 'pointer',
    },
  });

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Header */}
      <div style={{ borderBottom: '1px solid #2A302B', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Placement Calendar
          </h1>
          <p style={{ margin: 0, fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#9A9F99' }}>
            View registration deadlines, OA assessment dates, and interview schedules
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#9A9F99', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Applied
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> OA
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} /> Interview
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} /> Offer
          </span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
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
          }}
          popup
        />

        {/* Event Details Popover Modal */}
        {selectedEvent && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
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
                background: '#171B18',
                border: '1px solid #2A302B',
                borderRadius: 8,
                width: '100%',
                maxWidth: 400,
                padding: 24,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedEvent.color }} />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F2F3ED' }}>
                    {selectedEvent.company}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  style={{ background: 'transparent', border: 'none', color: '#9A9F99', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: 14, color: '#9A9F99', marginBottom: 16 }}>
                <div><strong>Role:</strong> {selectedEvent.role}</div>
                <div style={{ marginTop: 4 }}>
                  <strong>Stage:</strong> <span style={{ textTransform: 'uppercase', color: selectedEvent.color, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{selectedEvent.status}</span>
                </div>
                <div style={{ marginTop: 4, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                  <strong>Date:</strong> {selectedEvent.start.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/opportunities/${selectedEvent.id}`)}
                style={{
                  width: '100%',
                  background: '#B7E34A',
                  color: '#151f00',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                View Full Details →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
