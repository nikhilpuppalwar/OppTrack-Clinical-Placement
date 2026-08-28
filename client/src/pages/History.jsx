import { useEffect, useState } from 'react';
import { historyAPI, formHistoryAPI } from '../api';
import { Filter, Clock, ChevronLeft, ChevronRight, Activity, Puzzle } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_BADGES = {
  created:                 { label: 'Created',        color: '#b7e34a', bg: 'rgba(183,227,74,0.1)' },
  status_changed:          { label: 'Status Update',  color: '#c7bfff', bg: 'rgba(199,191,255,0.1)' },
  edited:                  { label: 'Edited',          color: '#9A9F99', bg: 'rgba(154,159,153,0.1)' },
  deleted:                 { label: 'Deleted',         color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)' },
  reminder_sent:           { label: 'Reminder',        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  profile_updated:         { label: 'Profile Vault',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  sensitive_field_revealed:{ label: '🔒 Sensitive',    color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  applied_via_extension:   { label: '⚡ Applied',      color: '#b7e34a', bg: 'rgba(183,227,74,0.1)' },
};

const EVENT_TYPES = [
  { value: '', label: 'All Event Logs' },
  { value: 'created', label: 'Created' },
  { value: 'status_changed', label: 'Status Changes' },
  { value: 'edited', label: 'Edits' },
  { value: 'deleted', label: 'Deletions' },
  { value: 'reminder_sent', label: 'Reminders' },
  { value: 'profile_updated', label: 'Profile Vault Updates' },
  { value: 'sensitive_field_revealed', label: 'Sensitive Reveals' },
  { value: 'applied_via_extension', label: 'Extension Applies' },
];

const FORM_ACTION_BADGES = {
  autofilled: { label: 'Autofilled', color: '#b7e34a', bg: 'rgba(183,227,74,0.1)' },
  synced:     { label: 'Synced',     color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  opened:     { label: 'Opened',     color: '#9A9F99', bg: 'rgba(154,159,153,0.1)' },
};

export default function History() {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'extension'

  // Activity log state
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [eventType, setEventType] = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form history state
  const [formLogs, setFormLogs]       = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formPage, setFormPage]       = useState(1);
  const [formTotalPages, setFormTotalPages] = useState(1);

  // ─── Fetch activity logs ───────────────────────────────────────────────────
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

  // ─── Fetch form history (Extension Activity) ───────────────────────────────
  const fetchFormLogs = async () => {
    setFormLoading(true);
    try {
      const { data } = await formHistoryAPI.list({ limit: 15, page: formPage });
      setFormLogs(data.entries || []);
      setFormTotalPages(data.pages || 1);
    } catch {
      toast.error('Failed to load extension activity');
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity') fetchLogs();
  }, [eventType, page, activeTab]);

  useEffect(() => {
    if (activeTab === 'extension') fetchFormLogs();
  }, [formPage, activeTab]);

  // ─── Styles ────────────────────────────────────────────────────────────────
  const tabBase = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', border: 'none',
    transition: 'background 0.2s, color 0.2s', fontFamily: 'inherit',
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 24, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Activity Log
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'rgba(242,243,237,0.6)' }}>
            Audit trail of all placement events, status updates, and Chrome extension activity.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: '#171B18', border: '1px solid #2A302B', borderRadius: 10, padding: 4 }}>
          <button
            onClick={() => { setActiveTab('activity'); setPage(1); }}
            style={{
              ...tabBase,
              background: activeTab === 'activity' ? '#2A302B' : 'transparent',
              color: activeTab === 'activity' ? '#F2F3ED' : 'rgba(242,243,237,0.5)',
            }}
          >
            <Activity size={14} /> App Activity
          </button>
          <button
            onClick={() => { setActiveTab('extension'); setFormPage(1); }}
            style={{
              ...tabBase,
              background: activeTab === 'extension' ? '#2A302B' : 'transparent',
              color: activeTab === 'extension' ? '#b7e34a' : 'rgba(242,243,237,0.5)',
            }}
          >
            <Puzzle size={14} /> Extension Activity
          </button>
        </div>
      </header>

      {/* ── Activity Log Tab ──────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <>
          {/* Filter dropdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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
          </div>

          <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, overflow: 'hidden' }}>
            {loading ? (
              <div className="loading-center" style={{ padding: 60 }}><div className="spinner" /></div>
            ) : logs.length === 0 ? (
              <EmptyState icon={<Activity size={32} />} text="No logs found" sub="Activity events will appear here as you track applications." />
            ) : (
              <>
                {logs.map((log, index) => {
                  const badge = EVENT_BADGES[log.eventType] || { label: log.eventType, color: '#9A9F99', bg: '#2A302B' };
                  const formattedDate = fmtDate(log.createdAt);
                  return (
                    <LogRow
                      key={log._id || index}
                      isLast={index === logs.length - 1}
                      dot={{ color: badge.color }}
                    >
                      <div style={{ fontSize: 15, color: '#F2F3ED', fontWeight: 500, lineHeight: 1.4 }}>{log.description}</div>
                      {log.opportunityId && (
                        <div style={{ fontSize: 13, color: '#b7e34a', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>
                          {log.opportunityId.company} — {log.opportunityId.role}
                        </div>
                      )}
                      <BadgeAndTime badge={badge} time={formattedDate} />
                    </LogRow>
                  );
                })}
                <Pagination page={page} totalPages={totalPages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
              </>
            )}
          </div>
        </>
      )}

      {/* ── Extension Activity Tab ────────────────────────────────────────── */}
      {activeTab === 'extension' && (
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, overflow: 'hidden' }}>
          {formLoading ? (
            <div className="loading-center" style={{ padding: 60 }}><div className="spinner" /></div>
          ) : formLogs.length === 0 ? (
            <EmptyState
              icon={<Puzzle size={32} />}
              text="No extension activity yet"
              sub="Install the OppTrack Chrome Extension and start autofilling forms to see activity here."
            />
          ) : (
            <>
              {formLogs.map((entry, index) => {
                const badge = FORM_ACTION_BADGES[entry.action] || { label: entry.action, color: '#9A9F99', bg: '#2A302B' };
                const opp = entry.matchedOpportunityId;
                const title = entry.formTitle || shortenUrl(entry.formUrl);
                return (
                  <LogRow
                    key={entry._id || index}
                    isLast={index === formLogs.length - 1}
                    dot={{ color: badge.color }}
                  >
                    <div style={{ fontSize: 15, color: '#F2F3ED', fontWeight: 500, lineHeight: 1.4 }}>
                      {title}
                      {entry.fieldsFilledCount > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#b7e34a', fontFamily: 'DM Mono, monospace' }}>
                          {entry.fieldsFilledCount} fields filled
                        </span>
                      )}
                    </div>
                    {opp && (
                      <div style={{ fontSize: 13, color: '#b7e34a', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>
                        {opp.company} — {opp.role}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'rgba(242,243,237,0.4)', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
                      {entry.formUrl.length > 55 ? entry.formUrl.slice(0, 55) + '…' : entry.formUrl}
                    </div>
                    <BadgeAndTime badge={badge} time={fmtDate(entry.createdAt)} />
                  </LogRow>
                );
              })}
              <Pagination page={formPage} totalPages={formTotalPages} onPrev={() => setFormPage(p => p - 1)} onNext={() => setFormPage(p => p + 1)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function LogRow({ children, isLast, dot }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: isLast ? 'none' : '1px solid #2A302B', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot.color, flexShrink: 0, marginTop: 4 }} />
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function BadgeAndTime({ badge, time }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, color: badge.color, background: badge.bg, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {badge.label}
      </span>
      <span style={{ fontSize: 12, color: 'rgba(242,243,237,0.4)', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock size={12} /> {time}
      </span>
    </div>
  );
}

function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  const btnStyle = (disabled) => ({
    background: 'transparent', border: '1px solid #2A302B',
    color: disabled ? 'rgba(242,243,237,0.2)' : '#F2F3ED',
    padding: '6px 14px', borderRadius: 6, fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
    fontFamily: 'inherit',
  });
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#121413', borderTop: '1px solid #2A302B' }}>
      <button disabled={page <= 1} onClick={onPrev} style={btnStyle(page <= 1)}>
        <ChevronLeft size={14} /> Prev
      </button>
      <span style={{ fontSize: 13, color: 'rgba(242,243,237,0.5)', fontFamily: 'DM Mono, monospace' }}>
        Page {page} of {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={onNext} style={btnStyle(page >= totalPages)}>
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: 'rgba(242,243,237,0.5)' }}>
      <div style={{ opacity: 0.3, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#F2F3ED', marginBottom: 4 }}>{text}</div>
      <div style={{ fontSize: 13, color: 'rgba(242,243,237,0.5)' }}>{sub}</div>
    </div>
  );
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname.split('/')[3]?.slice(0, 40) || u.hostname;
  } catch {
    return url.slice(0, 50);
  }
}
