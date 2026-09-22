import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { opportunityAPI, gmailAPI } from '../api';
import DeadlineBadge from '../components/DeadlineBadge';
import { 
  Plus, Search, Trash2, Eye, Sparkles, Wand2, CalendarDays, X, Filter, 
  Mail, Check, ExternalLink, RefreshCw, AlertTriangle, Clock, CheckCircle2, 
  ChevronDown, ChevronUp, Edit3, Building2, Briefcase, GraduationCap, Zap, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

import MissingKeyModal from '../components/MissingKeyModal';

const STATUSES = ['', 'not_applied', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected'];
const EMP_TYPES = [
  { key: '', label: 'All Records' },
  { key: 'placement', label: 'Placements' },
  { key: 'internship', label: 'Internships' },
  { key: 'off-campus', label: 'Off-Campus' },
];

const PENDING_DATE_FILTERS = [
  { key: 'all', label: 'All Dates' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
];

const BRANCH_FILTERS = [
  { key: '', label: 'All Branches' },
  { key: 'cs_it', label: 'CS / IT / AI-DS' },
  { key: 'entc', label: 'E&TC / Electronics' },
  { key: 'mech', label: 'Mechanical' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'civil', label: 'Civil' },
];

const parseBranches = (raw) => {
  if (Array.isArray(raw)) return raw.map(b => String(b).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw.split(/[,;/|\n]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

const parseLinks = (raw) => {
  if (Array.isArray(raw)) return raw.filter(l => l && (l.url || typeof l === 'string')).map(l => typeof l === 'string' ? { url: l, label: 'Registration Link' } : l);
  if (typeof raw === 'string' && raw.trim()) return [{ url: raw.trim(), label: 'Registration Link' }];
  return [];
};

export default function Opportunities() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', employmentType: '', sortBy: 'newest' });
  const navigate = useNavigate();

  // Primary view tab: 'tracked' or 'pending'
  const [viewTab, setViewTab] = useState('tracked');
  const [pendingItems, setPendingItems] = useState([]);
  const [autoUpdates, setAutoUpdates] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [ignoringId, setIgnoringId] = useState(null);
  const [reExtractingId, setReExtractingId] = useState(null);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [showAutoUpdates, setShowAutoUpdates] = useState(true);
  const [pendingEdits, setPendingEdits] = useState({});

  // Pending Review Filters
  const [pendingDateFilter, setPendingDateFilter] = useState('all');
  const [pendingTypeFilter, setPendingTypeFilter] = useState('');
  const [pendingBranchFilter, setPendingBranchFilter] = useState('');

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

  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const [pendingRes, updatesRes] = await Promise.all([
        gmailAPI.getPending(),
        gmailAPI.getAutoUpdates().catch(() => ({ data: [] })),
      ]);
      setPendingItems(pendingRes.data || []);
      setAutoUpdates(updatesRes.data || []);

      // Initialize edit fields
      const edits = {};
      (pendingRes.data || []).forEach(item => {
        const ext = item.extractionResult?.extractedFields || {};
        edits[item._id] = {
          company: ext.company || '',
          role: ext.role || '',
          ctc: ext.ctc || '',
          stipend: ext.stipend || '',
          ppo: ext.ppo || '',
          employmentType: ext.employmentType || 'placement',
          location: ext.location || '',
          deadline: ext.deadline ? ext.deadline.substring(0, 16) : '',
          testDate: ext.testDate ? ext.testDate.substring(0, 16) : '',
          allowedBranches: Array.isArray(ext.eligibility?.allowedBranches)
            ? ext.eligibility.allowedBranches.join(', ')
            : (typeof ext.eligibility?.allowedBranches === 'string' ? ext.eligibility.allowedBranches : ''),
        };
      });
      setPendingEdits(edits);
    } catch (err) {
      console.warn('Failed to load pending reviews:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchOpps();
    fetchPending();
  }, [filters]);

  const handleSyncGmail = async () => {
    setSyncingGmail(true);
    const toastId = toast.loading('Fetching placement emails from trusted senders…');
    try {
      const { data } = await gmailAPI.sync();
      toast.success(data.message || 'Gmail sync complete!', { id: toastId });
      await fetchPending();
      await fetchOpps(); // In case some existing jobs were auto-updated!
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed. Connect Google Account in Settings.', { id: toastId });
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleReExtract = async (id) => {
    setReExtractingId(id);
    const toastId = toast.loading('AI extracting full details from email…');
    try {
      const { data } = await gmailAPI.reExtractPending(id);
      toast.success('Extracted details updated!', { id: toastId });
      setPendingItems(prev => prev.map(p => p._id === id ? data : p));
      const ext = data.extractionResult?.extractedFields || {};
      setPendingEdits(pe => ({
        ...pe,
        [id]: {
          company: ext.company || '',
          role: ext.role || '',
          ctc: ext.ctc || '',
          stipend: ext.stipend || '',
          ppo: ext.ppo || '',
          employmentType: ext.employmentType || 'placement',
          location: ext.location || '',
          deadline: ext.deadline ? ext.deadline.substring(0, 16) : '',
          testDate: ext.testDate ? ext.testDate.substring(0, 16) : '',
          allowedBranches: Array.isArray(ext.eligibility?.allowedBranches)
            ? ext.eligibility.allowedBranches.join(', ')
            : (typeof ext.eligibility?.allowedBranches === 'string' ? ext.eligibility.allowedBranches : ''),
        }
      }));
    } catch (err) {
      if (err.response?.data?.isKeyMissing) {
        toast.dismiss(toastId);
        setKeyModal({
          isOpen: true,
          keyType: 'AI',
          message: err.response.data.message || 'Configure your AI API Key in Settings to extract details.',
        });
      } else {
        toast.error(err.response?.data?.message || 'AI extraction failed', { id: toastId });
      }
    } finally {
      setReExtractingId(null);
    }
  };

  const handleConfirmPending = async (item) => {
    setConfirmingId(item._id);
    const toastId = toast.loading('Confirming opportunity & syncing to Google Calendar…');
    try {
      const ext = item.extractionResult?.extractedFields || {};
      const editData = pendingEdits[item._id] || {};

      let branchesArr = ext.eligibility?.allowedBranches || [];
      if (editData.allowedBranches) {
        branchesArr = editData.allowedBranches.split(',').map(s => s.trim()).filter(Boolean);
      }

      const payload = {
        company: editData.company || ext.company,
        role: editData.role || ext.role,
        ctc: editData.ctc || ext.ctc,
        stipend: editData.stipend || ext.stipend,
        ppo: editData.ppo || ext.ppo,
        employmentType: editData.employmentType || ext.employmentType || 'placement',
        location: editData.location || ext.location,
        deadline: editData.deadline || ext.deadline,
        testDate: editData.testDate || ext.testDate,
        driveDate: editData.driveDate || ext.driveDate,
        links: ext.links || [],
        eligibility: {
          ...(ext.eligibility || {}),
          allowedBranches: branchesArr,
        },
        allowedBranches: branchesArr,
        customFields: ext.sections?.flatMap(s => s.fields || []) || [],
      };

      const { data } = await gmailAPI.confirmPending(item._id, payload);
      toast.success('✅ Opportunity added and synced to Google Calendar!', { id: toastId });
      setPendingItems(prev => prev.filter(p => p._id !== item._id));
      fetchOpps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm opportunity', { id: toastId });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleIgnorePending = async (id) => {
    setIgnoringId(id);
    try {
      await gmailAPI.ignorePending(id);
      toast.success('Email ignored and dismissed.');
      setPendingItems(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error('Failed to ignore item');
    } finally {
      setIgnoringId(null);
    }
  };

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
    <div style={{ maxWidth: 1160, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 24, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B1F3A', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Opportunities
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#667085' }}>
            {opps.length} placement & internship opportunities tracked
          </p>
        </div>

        <Link
          to="/opportunities/new"
          style={{
            background: '#0B1F3A',
            color: '#FFFFFF',
            fontSize: 13.5,
            fontWeight: 600,
            padding: '9px 18px',
            textDecoration: 'none',
            borderRadius: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 2px 6px rgba(11, 31, 58, 0.12)',
            transition: 'background 0.15s ease'
          }}
        >
          <Plus size={16} /> Add Opportunity
        </Link>
      </header>

      {/* Primary View Switcher: Tracked Opportunities vs Pending Review */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, borderBottom: '1px solid #E5EAF0', paddingBottom: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setViewTab('tracked')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: viewTab === 'tracked' ? '#E8F8F5' : 'transparent',
              color: viewTab === 'tracked' ? '#087F71' : '#667085',
              border: viewTab === 'tracked' ? '1px solid rgba(24, 183, 160, 0.3)' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            <CalendarDays size={15} color={viewTab === 'tracked' ? '#18B7A0' : 'currentColor'} />
            Tracked Opportunities ({opps.length})
          </button>

          <button
            onClick={() => setViewTab('pending')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: viewTab === 'pending' ? '#FEF0F0' : 'transparent',
              color: viewTab === 'pending' ? '#DC3545' : '#667085',
              border: viewTab === 'pending' ? '1px solid rgba(220, 53, 69, 0.3)' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            <Mail size={15} color={viewTab === 'pending' ? '#DC3545' : 'currentColor'} />
            Pending Review (Gmail)
            {pendingItems.length > 0 && (
              <span style={{
                background: '#DC3545', color: '#fff', fontSize: 11, fontWeight: 800,
                padding: '2px 8px', borderRadius: 10, marginLeft: 4
              }}>
                {pendingItems.length}
              </span>
            )}
          </button>
        </div>

        {viewTab === 'pending' && (
          <button
            onClick={handleSyncGmail}
            disabled={syncingGmail}
            style={{
              background: '#FEF0F0', border: '1px solid rgba(220, 53, 69, 0.25)',
              color: '#DC3545', padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RefreshCw size={13} className={syncingGmail ? 'spin' : ''} />
            {syncingGmail ? 'Checking Gmail…' : 'Sync Gmail Now'}
          </button>
        )}
      </div>

      {viewTab === 'pending' ? (
        <div style={{ marginBottom: 40 }}>
          {/* Top Control & Filter Bar for Pending Review */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 10,
            padding: 16, marginBottom: 20, boxShadow: '0 1px 3px rgba(11, 31, 58, 0.03)',
            display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3A' }}>
                  Filter & Categorize Incoming Emails
                </span>
                <span style={{ fontSize: 12, color: '#667085', marginLeft: 8 }}>
                  ({pendingItems.length} pending review)
                </span>
              </div>

              {/* Date Filter Pills */}
              <div style={{ display: 'flex', background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 6, padding: 3, gap: 3 }}>
                {PENDING_DATE_FILTERS.map(df => (
                  <button
                    key={df.key}
                    type="button"
                    onClick={() => setPendingDateFilter(df.key)}
                    style={{
                      background: pendingDateFilter === df.key ? '#FFFFFF' : 'transparent',
                      color: pendingDateFilter === df.key ? '#0B1F3A' : '#667085',
                      border: pendingDateFilter === df.key ? '1px solid #E5EAF0' : 'none',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: pendingDateFilter === df.key ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: pendingDateFilter === df.key ? '0 1px 2px rgba(11, 31, 58, 0.04)' : 'none'
                    }}
                  >
                    {df.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category & Branch Selectors */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 6, padding: '5px 10px' }}>
                <Briefcase size={13} color="#667085" />
                <select
                  value={pendingTypeFilter}
                  onChange={e => setPendingTypeFilter(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#172033', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="">All Opportunity Types</option>
                  <option value="placement">Placements Only</option>
                  <option value="internship">Internships Only</option>
                  <option value="internship+ppo">Internship + PPO</option>
                  <option value="off-campus">Off-Campus</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 6, padding: '5px 10px' }}>
                <GraduationCap size={13} color="#667085" />
                <select
                  value={pendingBranchFilter}
                  onChange={e => setPendingBranchFilter(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#172033', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {BRANCH_FILTERS.map(bf => (
                    <option key={bf.key} value={bf.key}>{bf.label}</option>
                  ))}
                </select>
              </div>

              {(pendingDateFilter !== 'all' || pendingTypeFilter || pendingBranchFilter) && (
                <button
                  type="button"
                  onClick={() => { setPendingDateFilter('all'); setPendingTypeFilter(''); setPendingBranchFilter(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#DC3545', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Recent Automatic Updates from Gmail Section */}
          {autoUpdates.length > 0 && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5EAF0',
              borderLeft: '4px solid #10B981',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: showAutoUpdates ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#ECFDF5', color: '#059669', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={14} />
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0B1F3A' }}>
                      Auto-Updated Jobs from Gmail ({autoUpdates.length})
                    </h4>
                    <span style={{ fontSize: 11.5, color: '#667085' }}>
                      Shortlists, drive dates, and test schedules merged directly into your database
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAutoUpdates(!showAutoUpdates)}
                  style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {showAutoUpdates ? 'Hide Auto-Updates' : 'Show Auto-Updates'}
                  {showAutoUpdates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {showAutoUpdates && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {autoUpdates.map(u => {
                    const opp = u.opportunityId || {};
                    const details = u.autoUpdateDetails || {};
                    const changes = details.changesSummary || [];

                    return (
                      <div
                        key={u._id}
                        style={{
                          background: '#F9FAFB', border: '1px solid #E5EAF0', borderRadius: 8,
                          padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          flexWrap: 'wrap', gap: 10
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <strong style={{ fontSize: 13.5, color: '#0B1F3A' }}>
                              {details.existingCompany || opp.company || 'Job Record'}
                            </strong>
                            {opp.role && <span style={{ fontSize: 12, color: '#667085' }}>• {opp.role}</span>}
                            <span style={{ fontSize: 11, background: '#ECFDF5', color: '#059669', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                              Updated
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#374151' }}>
                            {changes.length > 0 ? changes.join(' | ') : 'Drive/Shortlist details synchronized'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                            {new Date(u.receivedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {opp._id && (
                            <Link
                              to={`/opportunities/${opp._id}`}
                              style={{
                                background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#1F2937',
                                padding: '5px 11px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              View Opportunity <ArrowRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pending Items List */}
          {loadingPending ? (
            <div className="loading-center" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : pendingItems.length === 0 ? (
            <div style={{
              background: '#FFFFFF', border: '1px dashed #E5EAF0', borderRadius: 12,
              padding: 48, textAlign: 'center'
            }}>
              <Mail size={36} color="#DC3545" style={{ marginBottom: 14, opacity: 0.8 }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#0B1F3A', fontWeight: 700 }}>No Pending Emails to Review</h3>
              <p style={{ margin: '0 auto 20px auto', fontSize: 13.5, color: '#667085', maxWidth: 460, lineHeight: 1.5 }}>
                When your trusted placement senders email you about new drives or internships, they will be automatically fetched, parsed via AI, and queued here for your confirmation.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={handleSyncGmail}
                  disabled={syncingGmail}
                  style={{
                    background: '#0B1F3A', color: '#fff', border: 'none', padding: '9px 18px',
                    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  <RefreshCw size={14} className={syncingGmail ? 'spin' : ''} /> Check Gmail Now
                </button>
                <Link
                  to="/settings"
                  style={{
                    background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#172033',
                    padding: '9px 16px', borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 500
                  }}
                >
                  Manage Trusted Senders
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {pendingItems
                .filter(item => {
                  const ext = item.extractionResult?.extractedFields || {};
                  const edits = pendingEdits[item._id] || {};
                  const empType = (edits.employmentType || ext.employmentType || 'placement').toLowerCase();

                  // Type filter
                  if (pendingTypeFilter && !empType.includes(pendingTypeFilter)) return false;

                  // Branch filter
                  if (pendingBranchFilter) {
                    const branches = parseBranches(ext.eligibility?.allowedBranches).map(b => b.toLowerCase());
                    const branchRaw = (ext.eligibility?.rawText || '').toLowerCase();
                    const checkBranch = (terms) => terms.some(t => branches.some(b => b.includes(t)) || branchRaw.includes(t));

                    if (pendingBranchFilter === 'cs_it' && !checkBranch(['cs', 'it', 'comp', 'aiml', 'data science', 'software'])) return false;
                    if (pendingBranchFilter === 'entc' && !checkBranch(['entc', 'etc', 'ece', 'electronics', 'telecom'])) return false;
                    if (pendingBranchFilter === 'mech' && !checkBranch(['mech', 'automobile', 'production'])) return false;
                    if (pendingBranchFilter === 'electrical' && !checkBranch(['elect', 'eee'])) return false;
                    if (pendingBranchFilter === 'civil' && !checkBranch(['civil'])) return false;
                  }

                  // Date filter
                  if (pendingDateFilter !== 'all') {
                    const recDate = new Date(item.receivedAt);
                    const now = new Date();
                    const isToday = recDate.toDateString() === now.toDateString();
                    const yesterday = new Date();
                    yesterday.setDate(now.getDate() - 1);
                    const isYesterday = recDate.toDateString() === yesterday.toDateString();
                    const diffDays = (now - recDate) / (1000 * 60 * 60 * 24);

                    if (pendingDateFilter === 'today' && !isToday) return false;
                    if (pendingDateFilter === 'yesterday' && !isYesterday) return false;
                    if (pendingDateFilter === 'week' && diffDays > 7) return false;
                  }

                  return true;
                })
                .map(item => {
                  const ext = item.extractionResult?.extractedFields || {};
                  const dup = item.extractionResult?.duplicateWarning;
                  const elig = item.extractionResult?.eligibilityCheckResult;
                  const edits = pendingEdits[item._id] || {};
                  const isExpanded = expandedReviewId === item._id;

                  const branches = parseBranches(ext.eligibility?.allowedBranches);
                  const empTypeStr = (edits.employmentType || ext.employmentType || 'placement').replace('-', ' ');
                  const payStr = edits.ctc || edits.stipend || edits.ppo || ext.ctc || ext.stipend || ext.ppo || 'Package Disclosed Soon';

                  return (
                    <div
                      key={item._id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5EAF0',
                        borderLeft: dup?.isDuplicate ? '4px solid #F59E0B' : '4px solid #DC3545',
                        borderRadius: 12,
                        padding: 24,
                        boxShadow: '0 2px 8px rgba(11, 31, 58, 0.04)'
                      }}
                    >
                      {/* Top Bar: Sender, Received Date, Type Badge & Duplicate status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11.5, background: '#FEF0F0', color: '#DC3545', border: '1px solid rgba(220, 53, 69, 0.25)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                              From: {item.from || 'Placement Cell'}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#667085', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> {new Date(item.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            <span style={{
                              fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                              background: empTypeStr.includes('intern') ? '#E8F8F5' : '#EAF2FF',
                              color: empTypeStr.includes('intern') ? '#087F71' : '#2563EB',
                              border: empTypeStr.includes('intern') ? '1px solid rgba(8, 127, 113, 0.25)' : '1px solid rgba(37, 99, 235, 0.25)',
                              padding: '2px 7px', borderRadius: 4
                            }}>
                              {empTypeStr}
                            </span>
                          </div>
                          <h3 style={{ fontSize: 16.5, fontWeight: 700, color: '#0B1F3A', margin: 0, lineHeight: 1.4 }}>
                            {item.subject}
                          </h3>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {dup?.isDuplicate && (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                              background: '#FFF7E6', color: '#B7791F', border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              <AlertTriangle size={12} /> Duplicate: {dup.existingCompany}
                            </span>
                          )}

                          {elig && (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                              background: elig.status === 'eligible' ? '#EAF8EF' : elig.status === 'not_eligible' ? '#FEF0F0' : '#FFF7E6',
                              color: elig.status === 'eligible' ? '#16A34A' : elig.status === 'not_eligible' ? '#DC3545' : '#B7791F',
                              border: `1px solid ${elig.status === 'eligible' ? 'rgba(22, 163, 74, 0.25)' : elig.status === 'not_eligible' ? 'rgba(220, 53, 69, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                            }}>
                              {elig.status === 'eligible' ? 'Eligible' : elig.status === 'not_eligible' ? 'Not Eligible' : 'Needs Review'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main Details Grid: Company, Role, Package, Deadline */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: 12, background: '#F8FAFD', padding: 14, borderRadius: 8, border: '1px solid #E5EAF0',
                        marginBottom: 14
                      }}>
                        <div>
                          <span style={{ fontSize: 11, color: '#667085', textTransform: 'uppercase', fontWeight: 600 }}>Company</span>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A', marginTop: 2 }}>
                            {edits.company || ext.company || '—'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 11, color: '#667085', textTransform: 'uppercase', fontWeight: 600 }}>Role</span>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#172033', marginTop: 2 }}>
                            {edits.role || ext.role || '—'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 11, color: '#667085', textTransform: 'uppercase', fontWeight: 600 }}>Package / Stipend</span>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
                            {payStr}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 11, color: '#667085', textTransform: 'uppercase', fontWeight: 600 }}>Deadline</span>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1F3A', marginTop: 2 }}>
                            {edits.deadline ? new Date(edits.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ext.deadline ? new Date(ext.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline stated'}
                          </div>
                        </div>
                      </div>

                      {/* Allowed Branches & Eligibility Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span style={{ fontSize: 11.5, color: '#4B5563', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <GraduationCap size={13} color="#2563EB" /> Allowed Branches:
                        </span>
                        {branches.length > 0 ? (
                          branches.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              style={{
                                background: '#EFF6FF', border: '1px solid rgba(37, 99, 235, 0.25)',
                                color: '#1D4ED8', padding: '2px 8px', borderRadius: 4,
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                              }}
                            >
                              {b}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#9CA3AF', fontStyle: 'italic' }}>
                            All branches eligible / Not restricted
                          </span>
                        )}

                        {ext.eligibility?.minCGPA && (
                          <span style={{ fontSize: 11, background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                            Min CGPA: {ext.eligibility.minCGPA}
                          </span>
                        )}

                        {ext.testDate && (
                          <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            OA Date: {new Date(ext.testDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}

                        {ext.driveDate && (
                          <span style={{ fontSize: 11, background: '#EDE9FE', color: '#5B21B6', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            Drive Date: {new Date(ext.driveDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Links Row */}
                      {(() => {
                        const links = parseLinks(ext.links);
                        if (links.length === 0) return null;
                        return (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                            {links.map((l, idx) => (
                              <a
                                key={idx}
                                href={l.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  fontSize: 12, color: '#2563EB', textDecoration: 'none',
                                  background: 'rgba(37, 99, 235, 0.08)', padding: '4px 10px',
                                  borderRadius: 6, border: '1px solid rgba(37, 99, 235, 0.2)',
                                  fontWeight: 600
                                }}
                              >
                                <ExternalLink size={12} /> {l.label || 'Registration Link'}
                              </a>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Expanded Edit Form */}
                      {isExpanded && (
                        <div style={{
                          background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 8,
                          padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12
                        }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#667085', display: 'block', marginBottom: 4, fontWeight: 600 }}>Company Name</label>
                            <input
                              type="text"
                              value={edits.company}
                              onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], company: e.target.value } }))}
                              style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#172033', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: '#667085', display: 'block', marginBottom: 4, fontWeight: 600 }}>Role</label>
                            <input
                              type="text"
                              value={edits.role}
                              onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], role: e.target.value } }))}
                              style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#172033', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: '#667085', display: 'block', marginBottom: 4, fontWeight: 600 }}>CTC / Package</label>
                            <input
                              type="text"
                              placeholder="e.g. 8.5 LPA"
                              value={edits.ctc}
                              onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], ctc: e.target.value } }))}
                              style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#172033', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: '#667085', display: 'block', marginBottom: 4, fontWeight: 600 }}>Stipend / PPO</label>
                            <input
                              type="text"
                              placeholder="e.g. 25,000 / month"
                              value={edits.stipend || edits.ppo}
                              onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], stipend: e.target.value } }))}
                              style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#172033', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: '#667085', display: 'block', marginBottom: 4, fontWeight: 600 }}>Allowed Branches (comma separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. CS, IT, ENTC, Mech"
                              value={edits.allowedBranches}
                              onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], allowedBranches: e.target.value } }))}
                              style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#172033', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, color: '#667085', display: 'block', marginBottom: 4, fontWeight: 600 }}>Deadline Date & Time</label>
                            <input
                              type="datetime-local"
                              value={edits.deadline}
                              onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], deadline: e.target.value } }))}
                              style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#172033', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer Actions: Re-extract, Edit toggle, Ignore, Confirm */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedReviewId(isExpanded ? null : item._id)}
                            style={{
                              background: 'transparent', border: 'none', color: '#18B7A0',
                              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Edit3 size={13} /> {isExpanded ? 'Hide Edit Fields' : 'Review & Edit Details'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReExtract(item._id)}
                            disabled={reExtractingId === item._id}
                            style={{
                              background: '#F0FDF4', border: '1px solid rgba(22, 163, 74, 0.25)', color: '#16A34A',
                              padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 5
                            }}
                          >
                            <Sparkles size={12} className={reExtractingId === item._id ? 'spin' : ''} />
                            {reExtractingId === item._id ? 'Re-extracting…' : 'Re-extract with AI'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => handleIgnorePending(item._id)}
                            disabled={ignoringId === item._id}
                            style={{
                              background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#667085',
                              padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            {ignoringId === item._id ? 'Ignoring…' : 'Ignore'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleConfirmPending(item)}
                            disabled={confirmingId === item._id}
                            style={{
                              background: '#0B1F3A', color: '#FFFFFF', border: 'none',
                              padding: '8px 20px', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                              boxShadow: '0 2px 6px rgba(11, 31, 58, 0.15)'
                            }}
                          >
                            <Check size={15} /> {confirmingId === item._id ? 'Saving & Syncing…' : 'Confirm & Add Opportunity'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Segmented Category Filter Bar & Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {/* Top bar: Category tabs + Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              {/* Category Segmented Control */}
              <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, padding: 3, gap: 3, boxShadow: '0 1px 3px rgba(11, 31, 58, 0.03)' }}>
                {EMP_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setFilters(f => ({ ...f, employmentType: t.key }))}
                    style={{
                      background: filters.employmentType === t.key ? '#E8F8F5' : 'transparent',
                      color: filters.employmentType === t.key ? '#087F71' : '#667085',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: filters.employmentType === t.key ? 700 : 500,
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
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search company or role..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    color: '#172033',
                    border: '1px solid #E5EAF0',
                    borderRadius: 6,
                    paddingLeft: 34,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    fontSize: 13,
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(11, 31, 58, 0.02)'
                  }}
                />
              </div>
            </div>

            {/* Secondary Filter Row: Status & Sort */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 6, padding: '6px 12px' }}>
                <Filter size={14} color="#667085" />
                <select
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  style={{ background: 'transparent', border: 'none', color: '#172033', fontSize: 12.5, outline: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="">Status: All Stages</option>
                  {STATUSES.filter(Boolean).map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 6, padding: '6px 12px' }}>
                <select
                  value={filters.sortBy}
                  onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                  style={{ background: 'transparent', border: 'none', color: '#172033', fontSize: 12.5, outline: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="company">Sort: Company Name</option>
                  <option value="deadline">Sort: Deadline Date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Table */}
          {loading ? (
            <div className="loading-center" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
          ) : opps.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 60, textAlign: 'center', color: '#667085' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
              <h3 style={{ fontSize: 18, color: '#0B1F3A', margin: '0 0 6px 0', fontWeight: 700 }}>No placement records found</h3>
              <p style={{ fontSize: 13.5, margin: '0 0 20px 0' }}>Add an opportunity manually or auto-fetch incoming recruitment emails with Gmail.</p>
              <Link to="/opportunities/new" style={{ background: '#0B1F3A', color: '#FFFFFF', padding: '9px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                + Add First Opportunity
              </Link>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(11, 31, 58, 0.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5EAF0', background: '#F8FAFD' }}>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compensation</th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
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
                          style={{ borderBottom: '1px solid #E5EAF0', transition: 'background 0.15s ease' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFD'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                        >
                          {/* Company Name & AI Tag */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: '#E8F8F5',
                                  border: '1px solid rgba(24, 183, 160, 0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontWeight: 700,
                                  color: '#087F71'
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <Link
                                  to={`/opportunities/${opp._id}`}
                                  style={{ fontWeight: 600, color: '#0B1F3A', textDecoration: 'none', fontSize: 13.5, display: 'block' }}
                                >
                                  {opp.company}
                                </Link>
                                {opp.source?.extractedViaAI && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      marginTop: 2,
                                      padding: '1px 6px',
                                      color: '#087F71',
                                      fontFamily: 'JetBrains Mono, monospace',
                                      fontSize: 10,
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                      background: '#E8F8F5',
                                      borderRadius: 4
                                    }}
                                  >
                                    AI Extracted
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '14px 18px', fontWeight: 500, color: '#172033', fontSize: 13.5 }}>
                            {opp.role}
                          </td>

                          {/* Compensation */}
                          <td style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: pay ? '#16A34A' : '#94A3B8', fontWeight: pay ? 600 : 400 }}>
                            {pay ? pay : <span>—</span>}
                          </td>

                          {/* Type */}
                          <td style={{ padding: '14px 18px', fontSize: 12.5, color: '#667085', textTransform: 'capitalize' }}>
                            {typeLabel}
                          </td>

                          {/* Deadline */}
                          <td style={{ padding: '14px 18px' }}>
                            <DeadlineBadge deadline={deadline} />
                          </td>

                          {/* Status Selector */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <select
                                value={opp.status || 'not_applied'}
                                onChange={(e) => handleStatusChange(opp._id, e.target.value)}
                                style={{
                                  background: '#F8FAFD',
                                  border: '1px solid #E5EAF0',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  color: '#172033',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  outline: 'none',
                                  fontFamily: 'Inter, sans-serif'
                                }}
                              >
                                <option value={opp.status}>
                                  {opp.status ? opp.status.replace('_', ' ').toUpperCase() : 'NOT APPLIED'}
                                </option>
                                {STATUSES.filter(Boolean).filter(s => s !== opp.status).map(s => (
                                  <option key={s} value={s}>
                                    {s.replace('_', ' ').toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Action Icons */}
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => { setActiveAiOpp(opp); setChangesSummary(null); setFollowUpText(''); }}
                                title="AI Merge Follow-up Email"
                                style={{ background: 'transparent', border: 'none', color: '#18B7A0', cursor: 'pointer', padding: 4 }}
                              >
                                <Sparkles size={16} />
                              </button>

                              <button
                                onClick={() => navigate(`/opportunities/${opp._id}`)}
                                title="View Details"
                                style={{ background: 'transparent', border: 'none', color: '#667085', cursor: 'pointer', padding: 4 }}
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(opp._id)}
                                title="Delete Record"
                                style={{ background: 'transparent', border: 'none', color: '#DC3545', cursor: 'pointer', padding: 4 }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#F8FAFD', borderTop: '1px solid #E5EAF0', fontSize: 12, color: '#667085' }}>
                <span>Showing {opps.length} placement & internship records</span>
                <span style={{ color: '#087F71', fontWeight: 600 }}>✦ OppTrack SaaS</span>
              </div>
            </div>
          )}
      </>
      )}

      {/* AI Merge Modal */}
      {activeAiOpp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 31, 58, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 16, width: '100%', maxWidth: 600, padding: 26, boxShadow: '0 20px 50px rgba(11, 31, 58, 0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E8F8F5', border: '1px solid rgba(24, 183, 160, 0.3)', color: '#0D7A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, color: '#0B1F3A', fontWeight: 700 }}>Merge Follow-up Email (AI)</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#667085', fontWeight: 500 }}>{activeAiOpp.company} — Paste test links, interview dates, or result emails</p>
                </div>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: '#667085', cursor: 'pointer', padding: 4 }} onClick={() => setActiveAiOpp(null)}><X size={18} /></button>
            </div>

            <textarea
              style={{ width: '100%', background: '#F8FAFD', border: '1px solid #CBD5E1', color: '#172033', padding: 14, borderRadius: 8, minHeight: 160, fontSize: 13, outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              placeholder="Paste follow-up email text, interview schedule, or test link here..."
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
            />

            {changesSummary && (
              <div style={{ background: '#EAF8EF', border: '1px solid #A3E5D9', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: '#16A34A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={14} /> Changes Merged & Calendar Updated!
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#172033', lineHeight: 1.6 }}>
                  {changesSummary.map((cs, i) => <li key={i}>{cs}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setActiveAiOpp(null)} style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#667085', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAiUpdateSubmit} disabled={aiUpdating} style={{ background: '#0B1F3A', color: '#FFFFFF', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
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
