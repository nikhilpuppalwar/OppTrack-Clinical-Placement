import { useEffect, useState } from 'react';
import { historyAPI, formHistoryAPI } from '../api';
import { Filter, Clock, ChevronLeft, ChevronRight, Activity, Puzzle } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENT_BADGES = {
  created:                 { label: 'Created',        color: '#2563EB', bg: '#EAF2FF' },
  status_changed:          { label: 'Status Update',  color: '#087F71', bg: '#E8F8F5' },
  edited:                  { label: 'Edited',          color: '#475467', bg: '#F2F4F7' },
  deleted:                 { label: 'Deleted',         color: '#DC2626', bg: '#FEF0F0' },
  reminder_sent:           { label: 'Reminder',        color: '#B7791F', bg: '#FFF7E6' },
  profile_updated:         { label: 'Profile Vault',   color: '#123C73', bg: '#EBF2FB' },
  sensitive_field_revealed:{ label: '🔒 Sensitive',    color: '#C2410C', bg: '#FFEDD5' },
  applied_via_extension:   { label: '⚡ Applied',      color: '#15803D', bg: '#EAF8EF' },
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
  autofilled: { label: 'Autofilled', color: '#15803D', bg: '#EAF8EF' },
  synced:     { label: 'Synced',     color: '#2563EB', bg: '#EAF2FF' },
  opened:     { label: 'Opened',     color: '#475467', bg: '#F2F4F7' },
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
    padding: '8px 16px', borderRadius: 7, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', border: 'none',
    transition: 'all 0.15s ease', fontFamily: 'inherit',
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0B1F3A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Activity Log
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#667085' }}>
            Audit trail of all placement events, status updates, and Chrome extension activity.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: '#F0F4F8', border: '1px solid #E5EAF0', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => { setActiveTab('activity'); setPage(1); }}
            style={{
              ...tabBase,
              background: activeTab === 'activity' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'activity' ? '#0B1F3A' : '#667085',
              boxShadow: activeTab === 'activity' ? '0 1px 3px rgba(11,31,58,0.08)' : 'none',
            }}
          >
            <Activity size={14} /> App Activity
          </button>
          <button
            onClick={() => { setActiveTab('extension'); setFormPage(1); }}
            style={{
              ...tabBase,
              background: activeTab === 'extension' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'extension' ? '#087F71' : '#667085',
              boxShadow: activeTab === 'extension' ? '0 1px 3px rgba(11,31,58,0.08)' : 'none',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, padding: '6px 12px', boxShadow: '0 1px 2px rgba(11,31,58,0.04)' }}>
              <Filter size={14} color="#667085" />
              <select
                value={eventType}
                onChange={e => { setEventType(e.target.value); setPage(1); }}
                style={{ background: 'transparent', border: 'none', color: '#172033', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: '#FFFFFF', color: '#172033' }}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
            {loading ? (
              <div className="loading-center" style={{ padding: 60 }}><div className="spinner" /></div>
            ) : logs.length === 0 ? (
              <EmptyState icon={<Activity size={32} />} text="No logs found" sub="Activity events will appear here as you track applications." />
            ) : (
              <>
                {logs.map((log, index) => {
                  const badge = EVENT_BADGES[log.eventType] || { label: log.eventType, color: '#667085', bg: '#F2F4F7' };
                  const formattedDate = fmtDate(log.createdAt);
                  return (
                    <LogRow
                      key={log._id || index}
                      isLast={index === logs.length - 1}
                      dot={{ color: badge.color }}
                    >
                      <div style={{ fontSize: 14, color: '#172033', fontWeight: 600, lineHeight: 1.4 }}>{log.description}</div>
                      {log.opportunityId && (
                        <div style={{ fontSize: 13, color: '#087F71', fontFamily: 'ui-monospace, monospace', marginTop: 2, fontWeight: 500 }}>
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
        <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
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
                const badge = FORM_ACTION_BADGES[entry.action] || { label: entry.action, color: '#667085', bg: '#F2F4F7' };
                const opp = entry.matchedOpportunityId;
                const title = entry.formTitle || shortenUrl(entry.formUrl);
                return (
                  <LogRow
                    key={entry._id || index}
                    isLast={index === formLogs.length - 1}
                    dot={{ color: badge.color }}
                  >
                    <div style={{ fontSize: 14, color: '#172033', fontWeight: 600, lineHeight: 1.4 }}>
                      {title}
                      {entry.fieldsFilledCount > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#087F71', fontFamily: 'ui-monospace, monospace' }}>
                          {entry.fieldsFilledCount} fields filled
                        </span>
                      )}
                    </div>
                    {opp && (
                      <div style={{ fontSize: 13, color: '#087F71', fontFamily: 'ui-monospace, monospace', marginTop: 2, fontWeight: 500 }}>
                        {opp.company} — {opp.role}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#667085', marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
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
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: isLast ? 'none' : '1px solid #F0F4F8', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot.color, flexShrink: 0, marginTop: 5 }} />
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function BadgeAndTime({ badge, time }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: badge.color, background: badge.bg, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {badge.label}
      </span>
      <span style={{ fontSize: 12, color: '#667085', fontFamily: 'ui-monospace, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock size={12} /> {time}
      </span>
    </div>
  );
}

function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  const btnStyle = (disabled) => ({
    background: '#FFFFFF', border: '1px solid #E5EAF0',
    color: disabled ? '#D0D5DD' : '#172033',
    padding: '6px 14px', borderRadius: 6, fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
    fontFamily: 'inherit',
    fontWeight: 500,
  });
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#F8FAFD', borderTop: '1px solid #E5EAF0' }}>
      <button disabled={page <= 1} onClick={onPrev} style={btnStyle(page <= 1)}>
        <ChevronLeft size={14} /> Prev
      </button>
      <span style={{ fontSize: 13, color: '#667085', fontFamily: 'ui-monospace, monospace' }}>
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
    <div style={{ padding: 60, textAlign: 'center', color: '#667085' }}>
      <div style={{ opacity: 0.3, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#0B1F3A', marginBottom: 4 }}>{text}</div>
      <div style={{ fontSize: 13, color: '#667085' }}>{sub}</div>
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
