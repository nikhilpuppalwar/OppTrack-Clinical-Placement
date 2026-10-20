import { useEffect, useState } from 'react';
import { historyAPI, formHistoryAPI } from '../api';
import { Filter, Clock, Activity, Puzzle } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';

const EVENT_BADGES = {
  created:                  { label: 'Created',           color: '#3B82F6',                bg: 'rgba(59, 130, 246, 0.12)' },
  status_changed:           { label: 'Status Update',     color: 'var(--primary-brand)',   bg: 'rgba(24, 183, 160, 0.12)' },
  edited:                   { label: 'Edited',            color: 'var(--text-secondary)',  bg: 'var(--card-subtle)' },
  deleted:                  { label: 'Deleted',           color: '#EF4444',                bg: 'rgba(239, 68, 68, 0.12)' },
  reminder_sent:            { label: 'Reminder',          color: '#F59E0B',                bg: 'rgba(245, 158, 11, 0.12)' },
  profile_updated:          { label: 'Profile Vault',     color: '#8B5CF6',                bg: 'rgba(139, 92, 246, 0.12)' },
  sensitive_field_revealed: { label: 'Sensitive Reveal',  color: '#F97316',                bg: 'rgba(249, 115, 22, 0.12)' },
  applied_via_extension:    { label: 'Extension Applied', color: '#10B981',                bg: 'rgba(16, 185, 129, 0.12)' },
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
  autofilled: { label: 'Autofilled', color: '#10B981',                bg: 'rgba(16, 185, 129, 0.12)' },
  synced:     { label: 'Synced',     color: '#3B82F6',                bg: 'rgba(59, 130, 246, 0.12)' },
  opened:     { label: 'Opened',     color: 'var(--text-secondary)',  bg: 'var(--card-subtle)' },
};

export default function History() {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'extension'

  // Activity log state
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [eventType, setEventType] = useState('');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);

  // Form history state
  const [formLogs, setFormLogs]       = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formPage, setFormPage]       = useState(1);
  const [formPageSize, setFormPageSize] = useState(15);
  const [formTotal, setFormTotal]     = useState(0);

  // ─── Fetch activity logs ───────────────────────────────────────────────────
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: pageSize, page };
      if (eventType) params.eventType = eventType;
      const { data } = await historyAPI.list(params);
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
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
      const { data } = await formHistoryAPI.list({ limit: formPageSize, page: formPage });
      setFormLogs(data.entries || []);
      setFormTotal(data.total || 0);
    } catch {
      toast.error('Failed to load extension activity');
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity') fetchLogs();
  }, [eventType, page, pageSize, activeTab]);

  useEffect(() => {
    if (activeTab === 'extension') fetchFormLogs();
  }, [formPage, formPageSize, activeTab]);

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
      <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Activity Log
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
            Audit trail of all placement events, status updates, and Chrome extension activity.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => { setActiveTab('activity'); setPage(1); }}
            style={{
              ...tabBase,
              background: activeTab === 'activity' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'activity' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'activity' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Activity size={14} color={activeTab === 'activity' ? 'var(--primary-brand)' : 'currentColor'} /> App Activity
          </button>
          <button
            onClick={() => { setActiveTab('extension'); setFormPage(1); }}
            style={{
              ...tabBase,
              background: activeTab === 'extension' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'extension' ? 'var(--primary-brand)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'extension' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Puzzle size={14} color={activeTab === 'extension' ? 'var(--primary-brand)' : 'currentColor'} /> Extension Activity
          </button>
        </div>
      </header>

      {/* ── Activity Log Tab ──────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <>
          {/* Filter dropdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', boxShadow: 'var(--shadow-sm)' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={eventType}
                onChange={e => { setEventType(e.target.value); setPage(1); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {loading ? (
              <div className="loading-center" style={{ padding: 60 }}><div className="spinner" /></div>
            ) : logs.length === 0 ? (
              <EmptyState icon={<Activity size={32} />} text="No logs found" sub="Activity events will appear here as you track applications." />
            ) : (
              <>
                {logs.map((log, index) => {
                  const badge = EVENT_BADGES[log.eventType] || { label: log.eventType, color: 'var(--text-secondary)', bg: 'var(--card-subtle)' };
                  const formattedDate = fmtDate(log.createdAt);
                  return (
                    <LogRow
                      key={log._id || index}
                      isLast={index === logs.length - 1}
                      dot={{ color: badge.color }}
                    >
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{log.description}</div>
                      {log.opportunityId && (
                        <div style={{ fontSize: 13, color: 'var(--primary-brand)', fontFamily: 'ui-monospace, monospace', marginTop: 2, fontWeight: 500 }}>
                          {log.opportunityId.company} — {log.opportunityId.role}
                        </div>
                      )}
                      <BadgeAndTime badge={badge} time={formattedDate} />
                    </LogRow>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <Pagination
                    currentPage={page}
                    totalItems={totalLogs}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(1); }}
                    pageSizeOptions={[10, 15, 25, 50]}
                    itemName="activity logs"
                    accentColor="var(--primary-brand)"
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Extension Activity Tab ────────────────────────────────────────── */}
      {activeTab === 'extension' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
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
                const badge = FORM_ACTION_BADGES[entry.action] || { label: entry.action, color: 'var(--text-secondary)', bg: 'var(--card-subtle)' };
                const opp = entry.matchedOpportunityId;
                const title = entry.formTitle || shortenUrl(entry.formUrl);
                return (
                  <LogRow
                    key={entry._id || index}
                    isLast={index === formLogs.length - 1}
                    dot={{ color: badge.color }}
                  >
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                      {title}
                      {entry.fieldsFilledCount > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--primary-brand)', fontFamily: 'ui-monospace, monospace' }}>
                          {entry.fieldsFilledCount} fields filled
                        </span>
                      )}
                    </div>
                    {opp && (
                      <div style={{ fontSize: 13, color: 'var(--primary-brand)', fontFamily: 'ui-monospace, monospace', marginTop: 2, fontWeight: 500 }}>
                        {opp.company} — {opp.role}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
                      {entry.formUrl.length > 55 ? entry.formUrl.slice(0, 55) + '…' : entry.formUrl}
                    </div>
                    <BadgeAndTime badge={badge} time={fmtDate(entry.createdAt)} />
                  </LogRow>
                );
              })}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <Pagination
                  currentPage={formPage}
                  totalItems={formTotal}
                  pageSize={formPageSize}
                  onPageChange={setFormPage}
                  onPageSizeChange={(newSize) => { setFormPageSize(newSize); setFormPage(1); }}
                  pageSizeOptions={[10, 15, 25, 50]}
                  itemName="extension logs"
                  accentColor="var(--primary-brand)"
                />
              </div>
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
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border)', gap: 16 }}>
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
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock size={12} /> {time}
      </span>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ opacity: 0.3, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{text}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>
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
