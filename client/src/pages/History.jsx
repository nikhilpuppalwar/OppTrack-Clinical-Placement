import { useEffect, useState } from 'react';
import { historyAPI } from '../api';
import { Filter, Clock, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_BADGES = {
  created: { label: 'Created', color: '#b7e34a', bg: 'rgba(183,227,74,0.1)' },
  status_changed: { label: 'Status Update', color: '#c7bfff', bg: 'rgba(199,191,255,0.1)' },
  edited: { label: 'Edited', color: '#9A9F99', bg: 'rgba(154,159,153,0.1)' },
  deleted: { label: 'Deleted', color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)' },
  reminder_sent: { label: 'Reminder', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  profile_updated: { label: 'Profile Vault', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
};

const EVENT_TYPES = [
  { value: '', label: 'All Event Logs' },
  { value: 'created', label: 'Created' },
  { value: 'status_changed', label: 'Status Changes' },
  { value: 'edited', label: 'Edits' },
  { value: 'deleted', label: 'Deletions' },
  { value: 'reminder_sent', label: 'Reminders' },
  { value: 'profile_updated', label: 'Profile Vault Updates' },
];

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 15, page };
      if (eventType) params.eventType = eventType;
      const { data } = await historyAPI.list(params);
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventType, page]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Activity Log
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'rgba(242,243,237,0.6)' }}>
            Audit trail of all placement application events, status updates, and automated reminders.
          </p>
        </div>

        {/* Filter dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#171B18', border: '1px solid #2A302B', borderRadius: 6, padding: '6px 12px' }}>
          <Filter size={14} color="#9A9F99" />
          <select
            value={eventType}
            onChange={e => { setEventType(e.target.value); setPage(1); }}
            style={{ background: 'transparent', border: 'none', color: '#F2F3ED', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
          >
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value} style={{ background: '#171B18' }}>{t.label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Content Container */}
      <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center" style={{ padding: 60 }}><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(242,243,237,0.5)' }}>
            <Activity size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#F2F3ED', marginBottom: 4 }}>No logs found</div>
            <div style={{ fontSize: 13, color: 'rgba(242,243,237,0.5)' }}>Activity events will appear here as you track applications.</div>
          </div>
        ) : (
          <div>
            {logs.map((log, index) => {
              const badge = EVENT_BADGES[log.eventType] || { label: log.eventType, color: '#9A9F99', bg: '#2A302B' };
              const formattedDate = new Date(log.createdAt).toLocaleString('en-IN', {
                month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
              });

              return (
                <div
                  key={log._id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    borderBottom: index === logs.length - 1 ? 'none' : '1px solid #2A302B',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: badge.color,
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 15, color: '#F2F3ED', fontWeight: 500, lineHeight: 1.4 }}>
                        {log.description}
                      </div>
                      {log.opportunityId && (
                        <div style={{ fontSize: 13, color: '#b7e34a', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>
                          {log.opportunityId.company} — {log.opportunityId.role}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 4,
                        color: badge.color,
                        background: badge.bg,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(242,243,237,0.4)', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#121413', borderTop: '1px solid #2A302B' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2A302B',
                    color: page <= 1 ? 'rgba(242,243,237,0.2)' : '#F2F3ED',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: page <= 1 ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{ fontSize: 13, color: 'rgba(242,243,237,0.5)', fontFamily: 'DM Mono, monospace' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2A302B',
                    color: page >= totalPages ? 'rgba(242,243,237,0.2)' : '#F2F3ED',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: page >= totalPages ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
