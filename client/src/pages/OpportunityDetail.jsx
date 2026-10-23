import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { opportunityAPI } from '../api';
import DeadlineBadge from '../components/DeadlineBadge';
import { 
  ArrowLeft, Edit, Trash2, ExternalLink, Plus, X, Sparkles, Wand2, CalendarDays, 
  Save, FolderPlus, Building2, Briefcase, MapPin, DollarSign, Calendar, Clock, 
  CheckCircle2, AlertCircle, AlertTriangle, Hash, User, Shield, Check, Copy, 
  FileText, ChevronDown, ChevronUp, Layers, GraduationCap, CheckCheck, Phone, Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import MissingKeyModal from '../components/MissingKeyModal';

const PIPELINE_STAGES = [
  { key: 'not_applied', label: 'Not Applied', order: 1 },
  { key: 'applied', label: 'Applied', order: 2 },
  { key: 'oa', label: 'OA / Test', order: 3 },
  { key: 'interview', label: 'Interview', order: 4 },
  { key: 'hr', label: 'HR Round', order: 5 },
  { key: 'offer', label: 'Offer', order: 6 },
];

const STAGE_LABELS = { 
  not_applied: 'Not Applied', 
  applied: 'Applied', 
  oa: 'OA / Test', 
  interview: 'Interview', 
  hr: 'HR Round', 
  offer: 'Offer', 
  rejected: 'Rejected' 
};

const inpStyle = { 
  background: 'var(--surface)', 
  border: '1px solid var(--border)', 
  color: 'var(--text-primary)', 
  padding: '9px 12px', 
  borderRadius: 8, 
  fontSize: 13, 
  outline: 'none', 
  width: '100%', 
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

const labelStyle = { 
  fontSize: 11.5, 
  color: 'var(--text-secondary)', 
  marginBottom: 5, 
  fontWeight: 600, 
  display: 'block' 
};

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showGmailSource, setShowGmailSource] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [aiUpdating, setAiUpdating] = useState(false);
  const [changesSummary, setChangesSummary] = useState(null);
  const [addingToSection, setAddingToSection] = useState(null);
  const [addingNewSection, setAddingNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newField, setNewField] = useState({ label: '', value: '' });
  const [keyModal, setKeyModal] = useState({ isOpen: false, keyType: 'AI', message: '' });

  useEffect(() => {
    opportunityAPI.get(id)
      .then(o => { 
        setOpp(o.data); 
        setEditForm(o.data); 
      })
      .catch(() => toast.error('Failed to load opportunity'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusClick = async (status) => {
    try {
      const { data } = await opportunityAPI.updateStatus(id, status);
      setOpp(data);
      setEditForm(data);
      toast.success(`Pipeline Stage → ${STAGE_LABELS[status]}`);
    } catch { 
      toast.error('Status update failed'); 
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete opportunity for ${opp?.company || 'this company'}?`)) return;
    try { 
      await opportunityAPI.delete(id); 
      toast.success('Opportunity deleted'); 
      navigate('/opportunities'); 
    } catch { 
      toast.error('Delete failed'); 
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await opportunityAPI.update(id, editForm);
      setOpp(data); 
      setEditForm(data);
      setEditing(false);
      toast.success('Opportunity updated successfully!');
    } catch { 
      toast.error('Save failed'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleAiUpdate = async () => {
    if (!followUpText.trim()) return toast.error('Please paste follow-up email text');
    setAiUpdating(true);
    const tid = toast.loading('AI merging follow-up email…');
    try {
      const { data } = await opportunityAPI.aiUpdate(id, followUpText);
      setOpp(data.opportunity); 
      setEditForm(data.opportunity);
      setChangesSummary(data.changesSummary); 
      setFollowUpText('');
      toast.success(`✅ ${data.changesSummary?.length || 0} changes merged & calendar synced!`, { id: tid });
    } catch (err) {
      if (err.response?.data?.isKeyMissing) {
        toast.dismiss(tid);
        setShowAiModal(false);
        setKeyModal({
          isOpen: true,
          keyType: err.response.data.keyType || 'AI',
          message: err.response.data.message || 'AI API Key is missing. Please add your key in Settings.',
        });
      } else {
        toast.error(err.response?.data?.message || 'AI Update failed', { id: tid });
      }
    } finally { 
      setAiUpdating(false); 
    }
  };

  const updateCF = (fid, key, val) => {
    setEditForm(f => ({
      ...f,
      customFields: (f.customFields || []).map(cf => 
        (cf.id === fid || cf._id === fid) ? { ...cf, [key]: val } : cf
      )
    }));
  };

  const hideCF = (fid) => {
    setEditForm(f => ({
      ...f,
      customFields: (f.customFields || []).map(cf => 
        (cf.id === fid || cf._id === fid) ? { ...cf, hidden: true } : cf
      )
    }));
    toast.success('Field removed');
  };

  const addFieldToSection = (secName) => {
    if (!newField.label.trim()) return toast.error('Enter field label');
    const created = { 
      id: 'f_' + Date.now(), 
      section: secName, 
      label: newField.label.trim(), 
      value: newField.value.trim(), 
      fieldType: 'short_text', 
      hidden: false 
    };
    setEditForm(f => ({ ...f, customFields: [...(f.customFields || []), created] }));
    setAddingToSection(null); 
    setNewField({ label: '', value: '' });
    toast.success(`"${created.label}" added`);
  };

  const addSection = () => {
    if (!newSectionName.trim()) return toast.error('Enter section name');
    const seed = { 
      id: 'f_' + Date.now(), 
      section: newSectionName.trim(), 
      label: 'New Field', 
      value: '', 
      fieldType: 'short_text', 
      hidden: false 
    };
    setEditForm(f => ({ ...f, customFields: [...(f.customFields || []), seed] }));
    setAddingNewSection(false); 
    setNewSectionName('');
    toast.success(`Section "${newSectionName.trim()}" created`);
  };

  const getCompanyInitials = (name) => {
    if (!name) return 'OPP';
    const words = name.trim().split(' ');
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (d) => {
    if (!d) return null;
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!opp) return (
    <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', background: 'var(--surface)', padding: 40, borderRadius: 12, border: '1px solid var(--border)' }}>
      <AlertCircle size={36} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
      <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Opportunity Not Found</h3>
      <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>The opportunity you are looking for does not exist or has been removed.</p>
      <button onClick={() => navigate('/opportunities')} style={{ background: 'var(--primary-brand)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
        Back to Opportunities
      </button>
    </div>
  );

  const allFields = (editing ? editForm.customFields : opp.customFields) || [];
  const sectionsMap = {};
  allFields.forEach(f => {
    const s = f.section || 'General & Job Details';
    if (!sectionsMap[s]) sectionsMap[s] = [];
    sectionsMap[s].push(f);
  });

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === opp.status);
  const isRejected = opp.status === 'rejected';

  const payDisplay = opp.ctc || (opp.stipend ? `${opp.stipend}${opp.ppo ? ` (PPO: ${opp.ppo})` : ''}` : null);
  const eligStatus = opp.eligibilityCheckResult?.status || 'needs_review';

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── TOP ACTION BAR & NAVIGATION ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button 
          onClick={() => navigate('/opportunities')} 
          style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            color: 'var(--text-primary)', 
            padding: '7px 14px', 
            borderRadius: 8, 
            cursor: 'pointer', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 7, 
            fontSize: 13, 
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={15} /> Back to Opportunities
        </button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAiModal(true)} 
            style={{ 
              background: 'rgba(24, 183, 160, 0.12)', 
              color: 'var(--primary-brand)', 
              border: '1px solid rgba(24, 183, 160, 0.3)', 
              padding: '8px 15px', 
              borderRadius: 8, 
              fontSize: 12.5, 
              fontWeight: 700, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              boxShadow: '0 1px 3px rgba(24, 183, 160, 0.1)'
            }}
          >
            <Sparkles size={14} /> Merge Follow-up (AI)
          </button>

          {editing ? (
            <>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                style={{ 
                  background: 'var(--primary-brand)', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  padding: '8px 18px', 
                  borderRadius: 8, 
                  fontSize: 12.5, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  boxShadow: '0 2px 8px var(--primary-brand-glow)'
                }}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button 
                onClick={() => { setEditing(false); setEditForm(opp); }} 
                style={{ 
                  background: 'var(--card-subtle)', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text-secondary)', 
                  padding: '8px 14px', 
                  borderRadius: 8, 
                  fontSize: 12.5, 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditing(true)} 
              style={{ 
                background: 'var(--surface)', 
                border: '1px solid var(--border)', 
                color: 'var(--text-primary)', 
                padding: '8px 16px', 
                borderRadius: 8, 
                fontSize: 12.5, 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' 
              }}
            >
              <Edit size={14} /> Edit Opportunity
            </button>
          )}

          <button 
            onClick={handleDelete} 
            title="Delete Opportunity"
            style={{ 
              background: 'rgba(220, 53, 69, 0.1)', 
              border: '1px solid rgba(220, 53, 69, 0.25)', 
              color: 'var(--danger, #DC3545)', 
              padding: '8px 12px', 
              borderRadius: 8, 
              cursor: 'pointer', 
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── HERO BANNER CARD ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          {/* Company Avatar Badge */}
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(24, 183, 160, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
            border: '1px solid rgba(24, 183, 160, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            color: 'var(--primary-brand)',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(24, 183, 160, 0.12)'
          }}>
            {getCompanyInitials(opp.company)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {opp.company}
              </h1>

              {/* Employment Type Badge */}
              <span style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '3px 9px',
                borderRadius: 6,
                background: 'var(--card-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}>
                {(opp.employmentType || 'placement').replace('-', ' ')}
              </span>

              {/* Gmail Sync Indicator */}
              {opp.source?.extractedViaAI && (
                <span style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 6,
                  background: 'rgba(24, 183, 160, 0.15)',
                  color: 'var(--primary-brand)',
                  border: '1px solid rgba(24, 183, 160, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Sparkles size={11} /> Gmail Synced
                </span>
              )}

              {/* Status Badge */}
              <span style={{
                fontSize: 11.5,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 20,
                background: isRejected 
                  ? 'rgba(220, 53, 69, 0.15)' 
                  : opp.status === 'offer' 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'rgba(24, 183, 160, 0.15)',
                color: isRejected 
                  ? 'var(--danger, #DC3545)' 
                  : opp.status === 'offer' 
                  ? '#10B981' 
                  : 'var(--primary-brand)',
                border: `1px solid ${isRejected ? 'rgba(220, 53, 69, 0.3)' : opp.status === 'offer' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(24, 183, 160, 0.3)'}`
              }}>
                {STAGE_LABELS[opp.status] || opp.status?.toUpperCase()}
              </span>
            </div>

            {/* Role & Location Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 13.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Briefcase size={14} color="var(--primary-brand)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{opp.role}</span>
              </div>
              {opp.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={14} color="var(--text-muted)" />
                  <span>{opp.location}</span>
                </div>
              )}
              {opp.applicationNo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Hash size={14} color="var(--text-muted)" />
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}>App ID: {opp.applicationNo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Deadline Indicator in Hero */}
        {opp.deadline && (
          <div style={{ background: 'var(--card-subtle)', padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              Application Deadline
            </div>
            <DeadlineBadge deadline={opp.deadline} />
          </div>
        )}
      </div>

      {/* ── INTERACTIVE HORIZONTAL PIPELINE STEPPER ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Application Pipeline Stage
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Click any stage below to update your status instantly
            </span>
          </div>

          {/* Rejected Toggle Pill */}
          <button
            onClick={() => handleStatusClick(isRejected ? 'not_applied' : 'rejected')}
            style={{
              background: isRejected ? 'rgba(220, 53, 69, 0.15)' : 'transparent',
              border: `1px solid ${isRejected ? 'rgba(220, 53, 69, 0.4)' : 'var(--border)'}`,
              color: isRejected ? 'var(--danger, #DC3545)' : 'var(--text-secondary)',
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: 13 }}>{isRejected ? '✕' : '•'}</span>
            <span>{isRejected ? 'Application Rejected' : 'Mark as Rejected'}</span>
          </button>
        </div>

        {/* Connected Horizontal Stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`, gap: 8, position: 'relative' }}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = opp.status === stage.key;
            const isPassed = !isRejected && currentStageIndex >= 0 && currentStageIndex > idx;
            const isPending = !isCurrent && !isPassed;

            return (
              <button
                key={stage.key}
                onClick={() => handleStatusClick(stage.key)}
                style={{
                  background: isCurrent 
                    ? 'var(--primary-brand-light)' 
                    : isPassed 
                    ? 'rgba(24, 183, 160, 0.06)' 
                    : 'var(--card-subtle)',
                  border: isCurrent 
                    ? '1.5px solid var(--primary-brand)' 
                    : isPassed 
                    ? '1px solid rgba(24, 183, 160, 0.25)' 
                    : '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isCurrent ? '0 2px 8px var(--primary-brand-glow)' : 'none'
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isCurrent 
                    ? 'var(--primary-brand)' 
                    : isPassed 
                    ? 'rgba(24, 183, 160, 0.2)' 
                    : 'var(--surface)',
                  border: isCurrent 
                    ? 'none' 
                    : isPassed 
                    ? '1px solid var(--primary-brand)' 
                    : '1px solid var(--border)',
                  color: isCurrent 
                    ? '#FFFFFF' 
                    : isPassed 
                    ? 'var(--primary-brand)' 
                    : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isPassed ? <Check size={13} /> : stage.order}
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: isCurrent ? 800 : isPassed ? 700 : 500,
                  color: isCurrent 
                    ? 'var(--primary-brand-text)' 
                    : isPassed 
                    ? 'var(--text-primary)' 
                    : 'var(--text-secondary)',
                  lineHeight: 1.2
                }}>
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4-CARD KEY HIGHLIGHT METRICS GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Metric 1: Compensation */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(22, 163, 74, 0.12)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Compensation
            </span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: payDisplay ? '#16A34A' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {payDisplay || 'Not specified'}
          </div>
          {opp.ppo && opp.stipend && (
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
              PPO Package: <strong style={{ color: 'var(--text-primary)' }}>{opp.ppo}</strong>
            </div>
          )}
        </div>

        {/* Metric 2: Application Deadline */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(24, 183, 160, 0.12)', color: 'var(--primary-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Application Deadline
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatDate(opp.deadline) || <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No deadline set</span>}
          </div>
          {opp.deadline && (
            <div style={{ marginTop: 6 }}>
              <DeadlineBadge deadline={opp.deadline} />
            </div>
          )}
        </div>

        {/* Metric 3: OA / Test Date */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              OA / Test Date
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: opp.testDate ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {formatDate(opp.testDate) || 'Not scheduled yet'}
          </div>
          {opp.driveDate && (
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
              Drive Date: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(opp.driveDate)}</strong>
            </div>
          )}
        </div>

        {/* Metric 4: Eligibility Status */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ 
              width: 28, height: 28, borderRadius: 6, 
              background: eligStatus === 'eligible' 
                ? 'rgba(16, 185, 129, 0.12)' 
                : eligStatus === 'not_eligible' 
                ? 'rgba(220, 53, 69, 0.12)' 
                : 'rgba(245, 158, 11, 0.12)', 
              color: eligStatus === 'eligible' 
                ? '#10B981' 
                : eligStatus === 'not_eligible' 
                ? '#DC2626' 
                : '#F59E0B', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <Shield size={16} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Profile Match
            </span>
          </div>
          <div style={{ 
            fontSize: 15, 
            fontWeight: 800, 
            color: eligStatus === 'eligible' 
              ? '#10B981' 
              : eligStatus === 'not_eligible' 
              ? '#DC2626' 
              : '#F59E0B', 
            textTransform: 'capitalize' 
          }}>
            {eligStatus === 'eligible' ? 'Eligible Candidate' : eligStatus === 'not_eligible' ? 'Not Eligible' : 'Criteria Review Needed'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {opp.eligibility?.minCGPA != null ? `Min CGPA: ${opp.eligibility.minCGPA}` : 'No CGPA cut-off specified'}
          </div>
        </div>
      </div>

      {/* ── EDIT FORM BANNER (WHEN EDITING) ── */}
      {editing && (
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--primary-brand)',
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(24, 183, 160, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit size={16} color="var(--primary-brand)" /> Edit Core Opportunity Details
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Changes are saved directly to database</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Company Name</label>
              <input value={editForm.company || ''} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} style={inpStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role / Title</label>
              <input value={editForm.role || ''} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={inpStyle} />
            </div>
            <div>
              <label style={labelStyle}>Employment Type</label>
              <select value={editForm.employmentType || 'placement'} onChange={e => setEditForm(f => ({ ...f, employmentType: e.target.value }))} style={inpStyle}>
                <option value="placement">Placement (Full-Time)</option>
                <option value="internship">Internship</option>
                <option value="internship+ppo">Internship + PPO</option>
                <option value="off-campus">Off-Campus</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input value={editForm.location || ''} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} style={inpStyle} placeholder="e.g. Bangalore, Pune, Remote" />
            </div>
            <div>
              <label style={labelStyle}>CTC / Compensation</label>
              <input value={editForm.ctc || ''} onChange={e => setEditForm(f => ({ ...f, ctc: e.target.value }))} style={inpStyle} placeholder="e.g. 14 LPA" />
            </div>
            <div>
              <label style={labelStyle}>Stipend (Monthly)</label>
              <input value={editForm.stipend || ''} onChange={e => setEditForm(f => ({ ...f, stipend: e.target.value }))} style={inpStyle} placeholder="e.g. ₹50,000/month" />
            </div>
            <div>
              <label style={labelStyle}>PPO Package</label>
              <input value={editForm.ppo || ''} onChange={e => setEditForm(f => ({ ...f, ppo: e.target.value }))} style={inpStyle} placeholder="e.g. 18 LPA" />
            </div>
            <div>
              <label style={labelStyle}>Application / Reference ID</label>
              <input value={editForm.applicationNo || ''} onChange={e => setEditForm(f => ({ ...f, applicationNo: e.target.value }))} style={inpStyle} placeholder="e.g. APP-94821" />
            </div>

            <div>
              <label style={labelStyle}>Application Deadline</label>
              <input 
                type="datetime-local" 
                value={editForm.deadline ? editForm.deadline.substring(0, 16) : ''} 
                onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} 
                style={inpStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>OA / Test Date & Time</label>
              <input 
                type="datetime-local" 
                value={editForm.testDate ? editForm.testDate.substring(0, 16) : ''} 
                onChange={e => setEditForm(f => ({ ...f, testDate: e.target.value }))} 
                style={inpStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>Interview Date & Time</label>
              <input 
                type="datetime-local" 
                value={editForm.interviewDate ? editForm.interviewDate.substring(0, 16) : ''} 
                onChange={e => setEditForm(f => ({ ...f, interviewDate: e.target.value }))} 
                style={inpStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>Drive Date & Time</label>
              <input 
                type="datetime-local" 
                value={editForm.driveDate ? editForm.driveDate.substring(0, 16) : ''} 
                onChange={e => setEditForm(f => ({ ...f, driveDate: e.target.value }))} 
                style={inpStyle} 
              />
            </div>

            <div>
              <label style={labelStyle}>Minimum CGPA</label>
              <input 
                type="number" 
                step="0.1" 
                value={editForm.eligibility?.minCGPA != null ? editForm.eligibility.minCGPA : ''} 
                onChange={e => setEditForm(f => ({ 
                  ...f, 
                  eligibility: { ...f.eligibility, minCGPA: e.target.value === '' ? null : parseFloat(e.target.value) } 
                }))} 
                style={inpStyle} 
                placeholder="e.g. 7.0" 
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Shortlist & Round Notes</label>
              <textarea 
                rows={2} 
                value={editForm.shortlistInfo || ''} 
                onChange={e => setEditForm(f => ({ ...f, shortlistInfo: e.target.value }))} 
                style={inpStyle} 
                placeholder="e.g. 90-minute online coding round on HackerEarth followed by Technical Interview." 
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Candidate Notes / Checklist</label>
              <textarea 
                rows={2} 
                value={editForm.notes || ''} 
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} 
                style={inpStyle} 
                placeholder="Add any private notes, questions asked, or follow-up tasks..." 
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TWO-COLUMN DETAIL CARDS: ELIGIBILITY & SCHEDULE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Card 1: Eligibility & Academic Criteria */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 22,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <GraduationCap size={18} color="var(--primary-brand)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Eligibility Criteria
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Minimum CGPA</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {opp.eligibility?.minCGPA != null ? `${opp.eligibility.minCGPA} CGPA` : 'No CGPA Barrier'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>10th & 12th Cut-off</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {opp.eligibility?.minTenthPercent ? `${opp.eligibility.minTenthPercent}%` : '—'} / {opp.eligibility?.minTwelfthPercent ? `${opp.eligibility.minTwelfthPercent}%` : '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Active Backlogs</span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 4, 
                background: opp.eligibility?.backlogAllowed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(220, 53, 69, 0.1)', 
                color: opp.eligibility?.backlogAllowed ? '#10B981' : '#DC2626' 
              }}>
                {opp.eligibility?.backlogAllowed ? 'Allowed' : 'No Active Backlogs'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Eligible Branches:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {opp.eligibility?.allowedBranches?.length > 0 ? (
                  opp.eligibility.allowedBranches.map((b, i) => (
                    <span key={i} style={{
                      background: 'var(--card-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6
                    }}>
                      {b}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>All disciplines / Open for all</span>
                )}
              </div>
            </div>

            {opp.eligibility?.rawText && (
              <div style={{ marginTop: 8, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>Eligibility Note:</strong>
                {opp.eligibility.rawText}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recruitment Schedule & Drive Dates */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 22,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CalendarDays size={18} color="#3B82F6" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recruitment Schedule
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Application Deadline</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                {formatDate(opp.deadline) || <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Online Assessment (OA)</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                {formatDate(opp.testDate) || <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Interview Date</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                {formatDate(opp.interviewDate) || <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Campus Drive Date</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                {formatDate(opp.driveDate) || <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </span>
            </div>

            {opp.shortlistInfo && (
              <div style={{ marginTop: 4, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>Round / Shortlist Information:</strong>
                {opp.shortlistInfo}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── REGISTRATION LINKS & APPLICATION PORTALS ── */}
      {opp.links?.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--primary-brand)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-brand)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon size={14} /> Application Portals & Important Links ({opp.links.length})
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {opp.links.map((link, i) => (
              <div 
                key={i} 
                style={{
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {link.label || `Registration Link ${i + 1}`}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {link.url}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(link.url);
                      toast.success('Link copied to clipboard!');
                    }}
                    title="Copy Link"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '5px 8px',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Copy size={13} />
                  </button>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'var(--primary-brand)',
                      color: '#FFFFFF',
                      borderRadius: 6,
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>Open</span> <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BOND, CONTACT PERSON & CANDIDATE NOTES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Contact & Agreement */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <User size={15} color="var(--primary-brand)" /> Contact Person & Bond Agreement
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Contact Person</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                {opp.contactPerson?.name || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Phone / Extension</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {opp.contactPerson?.phone || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Service Agreement / Bond</span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 4, 
                background: opp.bond?.required ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.1)', 
                color: opp.bond?.required ? '#D97706' : '#10B981' 
              }}>
                {opp.bond?.required ? `${opp.bond.durationMonths || 12} Months Bond` : 'No Bond Required'}
              </span>
            </div>

            {opp.bond?.breachAmount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>Breach Amount</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                  ₹{opp.bond.breachAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Notes Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <FileText size={15} color="var(--primary-brand)" /> Candidate Notes & Checklist
          </div>

          {opp.notes ? (
            <div style={{ 
              background: 'var(--card-subtle)', 
              border: '1px solid var(--border)', 
              borderRadius: 8, 
              padding: 12, 
              fontSize: 13, 
              color: 'var(--text-primary)', 
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {opp.notes}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No notes added yet. Click &quot;Edit Opportunity&quot; to add your own prep notes or checklist items.
            </div>
          )}
        </div>
      </div>

      {/* ── DYNAMIC SECTIONS & CUSTOM FIELDS ── */}
      {editing && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {addingNewSection ? (
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              <input autoFocus value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="New section name…" style={inpStyle} />
              <button onClick={addSection} style={{ background: 'var(--primary-brand)', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Create</button>
              <button onClick={() => setAddingNewSection(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setAddingNewSection(true)} style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderPlus size={14} /> Add Custom Section
            </button>
          )}
        </div>
      )}

      {Object.entries(sectionsMap).map(([secName, secFields]) => {
        const visible = secFields.filter(f => !f.hidden);
        return (
          <div key={secName} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 700 }}>{secName}</h3>
              {editing && (
                <button onClick={() => setAddingToSection(secName)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-brand)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add Field</button>
              )}
            </div>

            <div style={{ padding: 20 }}>
              {editing && addingToSection === secName && (
                <div style={{ background: 'var(--card-subtle)', border: '1px solid var(--primary-brand)', borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-brand)' }}>Add Custom Field to {secName}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input placeholder="Field Label (e.g. Work Location)" value={newField.label} onChange={e => setNewField(f => ({ ...f, label: e.target.value }))} style={inpStyle} autoFocus />
                    <input placeholder="Field Value" value={newField.value} onChange={e => setNewField(f => ({ ...f, value: e.target.value }))} style={inpStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => addFieldToSection(secName)} style={{ background: 'var(--primary-brand)', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add Field</button>
                    <button onClick={() => setAddingToSection(null)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              {visible.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>No fields in this section.</div>
              ) : editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visible.map(f => (
                    <div key={f.id || f._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 10, alignItems: 'center' }}>
                      <input value={f.label} onChange={e => updateCF(f.id || f._id, 'label', e.target.value)} style={{ ...inpStyle, color: 'var(--text-secondary)', fontWeight: 600 }} />
                      <input value={f.value || ''} onChange={e => updateCF(f.id || f._id, 'value', e.target.value)} style={inpStyle} />
                      <button onClick={() => hideCF(f.id || f._id)} style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', padding: 4 }}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {visible.map((f) => {
                    const isUrl = f.value && (f.value.startsWith('http://') || f.value.startsWith('https://') || f.fieldType === 'url');
                    return (
                      <div key={f.id || f._id} style={{ background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>{f.label}</span>
                        {isUrl ? (
                          <a href={f.value} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--primary-brand)', fontFamily: 'ui-monospace, monospace', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}>
                            Open <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 600 }}>
                            {f.value || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── GMAIL SOURCE VIEWER (IF IMPORTED FROM GMAIL) ── */}
      {opp.source?.rawEmailText && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid #EA4335',
          borderRadius: 14,
          padding: '18px 22px',
          marginTop: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#EA4335', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                Gmail Ingestion Source
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Original placement notification email received from training and placement office.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(opp.source.rawEmailText || '');
                  toast.success('Raw email text copied!');
                }}
                style={{
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Copy size={12} /> Copy Email
              </button>
              <button
                onClick={() => setShowGmailSource(!showGmailSource)}
                style={{
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {showGmailSource ? 'Hide Raw Email' : 'View Raw Email'}
                {showGmailSource ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {showGmailSource && (
            <div style={{
              marginTop: 14,
              background: 'var(--card-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              maxHeight: 280,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: 12.5,
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              {opp.source.rawEmailText}
            </div>
          )}
        </div>
      )}

      {/* ── AI MERGE MODAL (PORTALED TO DOCUMENT.BODY) ── */}
      {showAiModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 20
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 580,
            padding: 26,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(24, 183, 160, 0.15)',
                  border: '1px solid rgba(24, 183, 160, 0.3)',
                  color: 'var(--primary-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', fontWeight: 700 }}>
                    Merge Follow-up Email with AI
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Updating: {opp.company} ({opp.role})
                  </span>
                </div>
              </div>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} 
                onClick={() => { setShowAiModal(false); setChangesSummary(null); }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Paste any follow-up email with updated test schedules, OA links, shortlist notices, or interview venues. AI will update this opportunity and sync all dates to your Google Calendar.
            </p>

            <textarea 
              style={{
                background: 'var(--card-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: 14,
                borderRadius: 8,
                minHeight: 160,
                fontSize: 13,
                width: '100%',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.5
              }}
              placeholder="Paste follow-up email text, test instructions, or results here…" 
              value={followUpText} 
              onChange={e => setFollowUpText(e.target.value)} 
            />

            {changesSummary && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#10B981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={14} /> Changes Merged & Google Calendar Updated!
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {changesSummary.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button 
                onClick={() => { setShowAiModal(false); setChangesSummary(null); }} 
                style={{ background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={handleAiUpdate} 
                disabled={aiUpdating || !followUpText.trim()} 
                style={{ 
                  background: 'var(--primary-brand)', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  padding: '8px 20px', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  boxShadow: '0 2px 8px var(--primary-brand-glow)'
                }}
              >
                <Sparkles size={14} /> {aiUpdating ? 'Merging…' : 'Merge & Sync Calendar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
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
