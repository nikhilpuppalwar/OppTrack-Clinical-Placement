import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { opportunityAPI } from '../api';
import DeadlineBadge from '../components/DeadlineBadge';
import { Plus, Search, Trash2, Eye, Sparkles, Wand2, CalendarDays, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

import MissingKeyModal from '../components/MissingKeyModal';

const STATUSES = ['', 'not_applied', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];
const EMP_TYPES = [
  { key: '', label: 'All Records' },
  { key: 'placement', label: 'Placements' },
  { key: 'internship', label: 'Internships' },
  { key: 'off-campus', label: 'Off-Campus' },
];

export default function Opportunities() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', employmentType: '', sortBy: 'newest' });
  const navigate = useNavigate();

  // AI Follow-up Update modal state
  const [activeAiOpp, setActiveAiOpp] = useState(null);
  const [followUpText, setFollowUpText] = useState('');
  const [aiUpdating, setAiUpdating] = useState(false);
  const [changesSummary, setChangesSummary] = useState(null);
  const [keyModal, setKeyModal] = useState({ isOpen: false, keyType: 'AI', message: '' });

  const fetchOpps = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.employmentType) params.employmentType = filters.employmentType;
      const { data } = await opportunityAPI.list(params);

      let sorted = [...data];
      if (filters.sortBy === 'company') {
        sorted.sort((a, b) => a.company.localeCompare(b.company));
      } else if (filters.sortBy === 'deadline') {
        sorted.sort((a, b) => new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31'));
      }
      setOpps(sorted);
    } catch {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpps();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this opportunity? This cannot be undone.')) return;
    try {
      await opportunityAPI.delete(id);
      toast.success('Opportunity deleted');
      setOpps(o => o.filter(x => x._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await opportunityAPI.update(id, { status: newStatus });
      toast.success(`Status → ${newStatus.replace('_', ' ').toUpperCase()}`);
      setOpps(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAiUpdateSubmit = async () => {
    if (!activeAiOpp) return;
    if (!followUpText.trim()) return toast.error('Paste follow-up email text');

    setAiUpdating(true);
    const toastId = toast.loading('AI analyzing follow-up email & syncing calendar…');
    try {
      const { data } = await opportunityAPI.aiUpdate(activeAiOpp._id, followUpText);
      setChangesSummary(data.changesSummary);
      setFollowUpText('');
      toast.success(`✅ Updated! ${data.changesSummary?.length || 0} changes saved to calendar!`, { id: toastId });
      fetchOpps();
    } catch (err) {
      if (err.response?.data?.isKeyMissing) {
        toast.dismiss(toastId);
        setActiveAiOpp(null);
        setKeyModal({
          isOpen: true,
          keyType: err.response.data.keyType || 'AI',
          message: err.response.data.message || 'AI API Key is missing. Please add your key in Settings.',
        });
      } else {
        toast.error(err.response?.data?.message || 'AI Update failed', { id: toastId });
      }
    } finally {
      setAiUpdating(false);
    }
  };

  const getCompanyInitials = (name) => {
    if (!name) return 'OPP';
    const words = name.trim().split(' ');
    if (words.length >= 3) return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    return name.substring(0, 3).toUpperCase();
  };

  const getOppPay = (opp) => {
    if (opp.ctc) return opp.ctc;
    if (opp.stipend) return opp.stipend;
    if (opp.ppo) return `${opp.ppo} (PPO)`;
    if (opp.customFields?.length) {
      const ctcF = opp.customFields.find(f => (f.id === 'ctc' || f.label?.toLowerCase().includes('ctc')) && !f.hidden)?.value;
      if (ctcF) return ctcF;
      const stipendF = opp.customFields.find(f => (f.id === 'stipend' || f.label?.toLowerCase().includes('stipend')) && !f.hidden)?.value;
      if (stipendF) return stipendF;
    }
    return null;
  };

  const getOppDeadline = (opp) => {
    if (opp.deadline) return opp.deadline;
    if (opp.customFields?.length) {
      const dField = opp.customFields.find(f => (f.id === 'deadline' || f.fieldType === 'datetime-local' || f.label?.toLowerCase().includes('date') || f.label?.toLowerCase().includes('deadline')) && !f.hidden)?.value;
      if (dField && !isNaN(new Date(dField).getTime())) return dField;
    }
    return null;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60, fontFamily: 'Manrope, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 24, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Opportunities
          </h1>
          <p style={{ margin: 0, fontSize: 13, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.5)' }}>
            {opps.length} placement & internship records tracked
          </p>
        </div>

        <Link
          to="/opportunities/new"
          style={{
            background: '#b7e34a',
            color: '#101311',
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={16} /> Add Opportunity
        </Link>
      </header>

      {/* Segmented Category Filter Bar & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {/* Top bar: Category tabs + Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          {/* Category Segmented Control */}
          <div style={{ display: 'flex', background: '#171B18', border: '1px solid #2A302B', borderRadius: 8, padding: 4, gap: 4 }}>
            {EMP_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setFilters(f => ({ ...f, employmentType: t.key }))}
                style={{
                  background: filters.employmentType === t.key ? '#121413' : 'transparent',
                  color: filters.employmentType === t.key ? '#F2F3ED' : 'rgba(242,243,237,0.6)',
                  border: filters.employmentType === t.key ? '1px solid #2A302B' : '1px solid transparent',
                  borderBottom: filters.employmentType === t.key ? '2px solid #b7e34a' : '1px solid transparent',
                  padding: '6px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(242,243,237,0.4)' }} />
            <input
              type="text"
              placeholder="Search company or role..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{
                width: '100%',
                background: '#171B18',
                color: '#F2F3ED',
                border: '1px solid #2A302B',
                borderRadius: 6,
                paddingLeft: 34,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'DM Mono, monospace'
              }}
            />
          </div>
        </div>

        {/* Secondary Filter Row: Status & Sort */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#171B18', border: '1px solid #2A302B', borderRadius: 6, padding: '6px 12px' }}>
            <Filter size={14} color="rgba(242,243,237,0.4)" />
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              style={{ background: 'transparent', border: 'none', color: '#F2F3ED', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#171B18' }}>Status: All Stages</option>
              {STATUSES.filter(Boolean).map(s => (
                <option key={s} value={s} style={{ background: '#171B18' }}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#171B18', border: '1px solid #2A302B', borderRadius: 6, padding: '6px 12px' }}>
            <select
              value={filters.sortBy}
              onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
              style={{ background: 'transparent', border: 'none', color: '#F2F3ED', fontSize: 12, outline: 'none', cursor: 'pointer' }}
            >
              <option value="newest" style={{ background: '#171B18' }}>Sort: Newest First</option>
              <option value="company" style={{ background: '#171B18' }}>Sort: Company Name</option>
              <option value="deadline" style={{ background: '#171B18' }}>Sort: Deadline Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="loading-center" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
      ) : opps.length === 0 ? (
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, padding: 60, textAlign: 'center', color: 'rgba(242,243,237,0.5)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
          <h3 style={{ fontSize: 18, color: '#F2F3ED', margin: '0 0 6px 0', fontFamily: 'serif' }}>No placement records found</h3>
          <p style={{ fontSize: 13, margin: '0 0 20px 0' }}>Add an opportunity manually or paste a placement email with AI Smart Paste.</p>
          <Link to="/opportunities/new" style={{ background: '#b7e34a', color: '#101311', padding: '10px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            + Add First Opportunity
          </Link>
        </div>
      ) : (
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A302B', background: '#121413' }}>
                  <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</th>
                  <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</th>
                  <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compensation</th>
                  <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</th>
                  <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deadline</th>
                  <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {opps.map(opp => {
                  const pay = getOppPay(opp);
                  const deadline = getOppDeadline(opp);
                  const typeLabel = (opp.employmentType || 'placement').replace('-', ' ');
                  const initials = getCompanyInitials(opp.company);

                  return (
                    <tr
                      key={opp._id}
                      style={{ borderBottom: '1px solid #2A302B', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#121413'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Company Name & AI Tag */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: '#121413',
                              border: '1px solid #2A302B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontFamily: 'DM Mono, monospace',
                              fontWeight: 700,
                              color: '#F2F3ED'
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <Link
                              to={`/opportunities/${opp._id}`}
                              style={{ fontWeight: 600, color: '#F2F3ED', textDecoration: 'none', fontSize: 14, display: 'block' }}
                            >
                              {opp.company}
                            </Link>
                            {opp.source?.extractedViaAI && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  marginTop: 3,
                                  borderLeft: '2px solid #9A8CFF',
                                  paddingLeft: 6,
                                  paddingRight: 6,
                                  color: '#9A8CFF',
                                  fontFamily: 'DM Mono, monospace',
                                  fontSize: 10,
                                  textTransform: 'uppercase',
                                  background: 'rgba(154,140,255,0.08)'
                                }}
                              >
                                AI Extracted
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: '#F2F3ED', fontSize: 14 }}>
                        {opp.role}
                      </td>

                      {/* Compensation */}
                      <td style={{ padding: '16px 20px', fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'rgba(242,243,237,0.8)' }}>
                        {pay ? pay : <span style={{ color: 'rgba(242,243,237,0.3)', fontStyle: 'italic' }}>Not specified</span>}
                      </td>

                      {/* Type */}
                      <td style={{ padding: '16px 20px', fontSize: 12, color: 'rgba(242,243,237,0.7)', textTransform: 'capitalize' }}>
                        {typeLabel}
                      </td>

                      {/* Deadline */}
                      <td style={{ padding: '16px 20px' }}>
                        <DeadlineBadge deadline={deadline} />
                      </td>

                      {/* Status Selector */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: opp.status === 'offer' ? '#22c55e' : opp.status === 'rejected' ? '#ffb4ab' : opp.status === 'oa' || opp.status === 'interview' ? '#f59e0b' : '#b7e34a'
                            }}
                          />
                          <select
                            value={opp.status || 'not_applied'}
                            onChange={(e) => handleStatusChange(opp._id, e.target.value)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(242,243,237,0.8)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              outline: 'none',
                              fontFamily: 'Manrope, sans-serif'
                            }}
                          >
                            <option value={opp.status} style={{ background: '#171B18' }}>
                              {opp.status ? opp.status.replace('_', ' ').toUpperCase() : 'NOT APPLIED'}
                            </option>
                            {STATUSES.filter(Boolean).filter(s => s !== opp.status).map(s => (
                              <option key={s} value={s} style={{ background: '#171B18' }}>
                                {s.replace('_', ' ').toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Action Icons */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => { setActiveAiOpp(opp); setChangesSummary(null); setFollowUpText(''); }}
                            title="AI Merge Follow-up Email"
                            style={{ background: 'transparent', border: 'none', color: '#9A8CFF', cursor: 'pointer', padding: 4 }}
                          >
                            <Sparkles size={16} />
                          </button>

                          <button
                            onClick={() => navigate(`/opportunities/${opp._id}`)}
                            title="View Record Specs"
                            style={{ background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.6)', cursor: 'pointer', padding: 4 }}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(opp._id)}
                            title="Delete Record"
                            style={{ background: 'transparent', border: 'none', color: '#ffb4ab', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#121413', borderTop: '1px solid #2A302B', fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'rgba(242,243,237,0.45)' }}>
            <span>Showing {opps.length} placement & internship records</span>
            <span style={{ color: '#b7e34a', fontWeight: 600 }}>✦ OppTrack System</span>
          </div>
        </div>
      )}

      {/* AI Merge Modal */}
      {activeAiOpp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#171B18', border: '1px solid #9A8CFF', borderRadius: 16, width: '100%', maxWidth: 600, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#121413', border: '1px solid #9A8CFF', color: '#9A8CFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#9A8CFF', fontFamily: 'serif' }}>Merge Follow-up Email (AI)</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(242,243,237,0.5)', fontFamily: 'DM Mono, monospace' }}>{activeAiOpp.company}</p>
                </div>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: '#F2F3ED', cursor: 'pointer' }} onClick={() => setActiveAiOpp(null)}><X size={18} /></button>
            </div>

            <textarea
              style={{ width: '100%', background: '#121413', border: '1px solid #2A302B', color: '#F2F3ED', padding: 14, borderRadius: 8, minHeight: 160, fontFamily: 'DM Mono, monospace', fontSize: 13 }}
              placeholder="Paste follow-up email text here..."
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
            />

            {changesSummary && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e40', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#22c55e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={14} /> Changes Merged & Calendar Updated!
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#F2F3ED' }}>
                  {changesSummary.map((cs, i) => <li key={i}>{cs}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setActiveAiOpp(null)} style={{ background: 'transparent', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAiUpdateSubmit} disabled={aiUpdating} style={{ background: '#121413', color: '#9A8CFF', border: '1px solid #9A8CFF', padding: '8px 20px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                {aiUpdating ? 'Merging…' : 'Merge Info'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Key Modal */}
      <MissingKeyModal
        isOpen={keyModal.isOpen}
        onClose={() => setKeyModal(k => ({ ...k, isOpen: false }))}
        keyType={keyModal.keyType}
        message={keyModal.message}
      />
    </div>
  );
}
