import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { opportunityAPI } from '../api';
import DeadlineBadge from '../components/DeadlineBadge';
import { ArrowLeft, Edit, Trash2, ExternalLink, Plus, X, Sparkles, Wand2, CalendarDays, Save, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import MissingKeyModal from '../components/MissingKeyModal';

const PIPELINE = ['not_applied', 'applied', 'oa', 'interview', 'hr', 'offer'];
const STAGE_LABELS = { not_applied: 'Not Applied', applied: 'Applied', oa: 'OA / Test', interview: 'Interview', hr: 'HR Round', offer: 'Offer', rejected: 'Rejected' };

const inp = { background: '#121413', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 12px', borderRadius: 6, fontSize: 13, outline: 'none', width: '100%', fontFamily: 'Manrope, sans-serif' };

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
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
      .then(o => { setOpp(o.data); setEditForm(o.data); })
      .catch(() => toast.error('Failed to load opportunity'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusClick = async (status) => {
    try {
      const { data } = await opportunityAPI.updateStatus(id, status);
      setOpp(data);
      toast.success(`Status → ${STAGE_LABELS[status]}`);
    } catch { toast.error('Status update failed'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this opportunity?')) return;
    try { await opportunityAPI.delete(id); toast.success('Deleted'); navigate('/opportunities'); }
    catch { toast.error('Delete failed'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await opportunityAPI.update(id, editForm);
      setOpp(data); setEditing(false);
      toast.success('Opportunity updated!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleAiUpdate = async () => {
    if (!followUpText.trim()) return toast.error('Paste follow-up email text');
    setAiUpdating(true);
    const tid = toast.loading('AI merging follow-up email…');
    try {
      const { data } = await opportunityAPI.aiUpdate(id, followUpText);
      setOpp(data.opportunity); setEditForm(data.opportunity);
      setChangesSummary(data.changesSummary); setFollowUpText('');
      toast.success(`✅ ${data.changesSummary?.length || 0} changes merged & calendar synced.`, { id: tid });
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
    } finally { setAiUpdating(false); }
  };

  const updateCF = (fid, key, val) => setEditForm(f => ({ ...f, customFields: (f.customFields || []).map(cf => (cf.id === fid || cf._id === fid) ? { ...cf, [key]: val } : cf) }));
  const hideCF = (fid) => { setEditForm(f => ({ ...f, customFields: (f.customFields || []).map(cf => (cf.id === fid || cf._id === fid) ? { ...cf, hidden: true } : cf) })); toast.success('Field hidden'); };

  const addFieldToSection = (secName) => {
    if (!newField.label.trim()) return toast.error('Enter field label');
    const created = { id: 'f_' + Date.now(), section: secName, label: newField.label.trim(), value: newField.value.trim(), fieldType: 'short_text', hidden: false };
    setEditForm(f => ({ ...f, customFields: [...(f.customFields || []), created] }));
    setAddingToSection(null); setNewField({ label: '', value: '' });
    toast.success(`"${created.label}" added`);
  };

  const addSection = () => {
    if (!newSectionName.trim()) return toast.error('Enter section name');
    const seed = { id: 'f_' + Date.now(), section: newSectionName.trim(), label: 'New Field', value: '', fieldType: 'short_text', hidden: false };
    setEditForm(f => ({ ...f, customFields: [...(f.customFields || []), seed] }));
    setAddingNewSection(false); setNewSectionName('');
    toast.success(`Section "${newSectionName.trim()}" created`);
  };

  if (loading) return <div className="loading-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!opp) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(242,243,237,0.5)' }}>Opportunity not found</div>;

  const allFields = (editing ? editForm.customFields : opp.customFields) || [];
  const sectionsMap = {};
  allFields.forEach(f => {
    const s = f.section || 'General Details';
    if (!sectionsMap[s]) sectionsMap[s] = [];
    sectionsMap[s].push(f);
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60, fontFamily: 'Manrope, sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 24, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate(-1)} style={{ background: '#171B18', border: '1px solid #2A302B', color: '#F2F3ED', padding: 8, borderRadius: 6, cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>{opp.company}</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(242,243,237,0.55)', fontFamily: 'DM Mono, monospace' }}>
              {opp.role}{opp.employmentType ? ` · ${opp.employmentType}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowAiModal(true)} style={{ background: '#171B18', color: '#9A8CFF', border: '1px solid rgba(154,140,255,0.35)', borderTop: '2px solid #9A8CFF', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} /> AI Merge Email
          </button>
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} style={{ background: '#b7e34a', color: '#101311', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditing(false); setEditForm(opp); }} style={{ background: 'transparent', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={{ background: '#171B18', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit size={13} /> Edit
            </button>
          )}
          <button onClick={handleDelete} style={{ background: 'transparent', border: '1px solid rgba(255,180,171,0.4)', color: '#ffb4ab', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* ── TWO-COLUMN OVERVIEW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Pipeline card */}
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(242,243,237,0.45)', marginBottom: 14 }}>Application Pipeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PIPELINE.map((stage, i) => {
              const idx = PIPELINE.indexOf(opp.status);
              const done = idx >= i;
              const cur = opp.status === stage;
              return (
                <button key={stage} onClick={() => handleStatusClick(stage)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', textAlign: 'left' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: cur ? '#b7e34a' : done ? 'rgba(183,227,74,0.15)' : '#121413', border: `1px solid ${done ? '#b7e34a' : '#2A302B'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: cur ? '#101311' : done ? '#b7e34a' : 'rgba(242,243,237,0.35)', flexShrink: 0 }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: cur ? 700 : 500, color: cur ? '#b7e34a' : done ? 'rgba(183,227,74,0.8)' : 'rgba(242,243,237,0.5)' }}>{STAGE_LABELS[stage]}</span>
                </button>
              );
            })}
            <button onClick={() => handleStatusClick('rejected')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', textAlign: 'left' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: opp.status === 'rejected' ? 'rgba(255,180,171,0.2)' : '#121413', border: `1px solid ${opp.status === 'rejected' ? '#ffb4ab' : '#2A302B'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: opp.status === 'rejected' ? '#ffb4ab' : 'rgba(242,243,237,0.35)', flexShrink: 0 }}>✕</div>
              <span style={{ fontSize: 13, fontWeight: opp.status === 'rejected' ? 700 : 500, color: opp.status === 'rejected' ? '#ffb4ab' : 'rgba(242,243,237,0.45)' }}>Rejected</span>
            </button>
          </div>
        </div>

        {/* Key Specs card */}
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(242,243,237,0.45)', marginBottom: 4 }}>Key Specs</div>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['company', 'Company'], ['role', 'Role'], ['ctc', 'CTC / Package'], ['location', 'Location']].map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: 'rgba(242,243,237,0.45)', marginBottom: 4 }}>{label}</div>
                  <input value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['CTC / Salary', opp.ctc], ['Location', opp.location], ['Employment', opp.employmentType], ['App No.', opp.applicationNo]].map(([l, v]) =>
                v ? (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #2A302B' }}>
                    <span style={{ fontSize: 12, color: 'rgba(242,243,237,0.5)', fontWeight: 600 }}>{l}</span>
                    <span style={{ fontSize: 13, color: '#F2F3ED', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>{v}</span>
                  </div>
                ) : null
              )}
              <DeadlineBadge deadline={opp.deadline} />
            </div>
          )}
        </div>
      </div>

      {/* ── AI EXTRACTED LINKS ── */}
      {opp.links?.length > 0 && (
        <div style={{ background: '#171B18', border: '1px solid rgba(154,140,255,0.35)', borderLeft: '3px solid #9A8CFF', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9A8CFF', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ExternalLink size={12} /> AI Extracted Portals & Links
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {opp.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{ background: '#121413', border: '1px solid #9A8CFF', color: '#9A8CFF', padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {link.label || `Link ${i + 1}`} <ExternalLink size={11} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── DYNAMIC SECTIONS ── */}
      {editing && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {addingNewSection ? (
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              <input autoFocus value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="New section name…" style={inp} />
              <button onClick={addSection} style={{ background: '#b7e34a', color: '#101311', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Create</button>
              <button onClick={() => setAddingNewSection(false)} style={{ background: 'transparent', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setAddingNewSection(true)} style={{ background: 'transparent', border: '1px dashed #2A302B', color: 'rgba(242,243,237,0.5)', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderPlus size={14} /> Add Custom Section
            </button>
          )}
        </div>
      )}

      {Object.entries(sectionsMap).map(([secName, secFields]) => {
        const visible = secFields.filter(f => !f.hidden);
        return (
          <div key={secName} style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2A302B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'serif', color: '#F2F3ED', fontWeight: 400 }}>{secName}</h3>
              {editing && (
                <button onClick={() => setAddingToSection(secName)} style={{ background: 'transparent', border: 'none', color: '#b7e34a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Field</button>
              )}
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {editing && addingToSection === secName && (
                <div style={{ background: '#121413', border: '1px solid #b7e34a', borderRadius: 8, padding: 14, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b7e34a' }}>Add Field</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input placeholder="Label" value={newField.label} onChange={e => setNewField(f => ({ ...f, label: e.target.value }))} style={inp} autoFocus />
                    <input placeholder="Value" value={newField.value} onChange={e => setNewField(f => ({ ...f, value: e.target.value }))} style={inp} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => addFieldToSection(secName)} style={{ background: '#b7e34a', color: '#101311', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
                    <button onClick={() => setAddingToSection(null)} style={{ background: 'transparent', border: '1px solid #2A302B', color: '#F2F3ED', padding: '6px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              {visible.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(242,243,237,0.35)', fontStyle: 'italic', padding: '8px 0' }}>No fields in this section.</div>
              ) : editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visible.map(f => (
                    <div key={f.id || f._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 10, alignItems: 'center' }}>
                      <input value={f.label} onChange={e => updateCF(f.id || f._id, 'label', e.target.value)} style={{ ...inp, color: 'rgba(242,243,237,0.65)', fontWeight: 600 }} />
                      <input value={f.value || ''} onChange={e => updateCF(f.id || f._id, 'value', e.target.value)} style={inp} />
                      <button onClick={() => hideCF(f.id || f._id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,180,171,0.6)', cursor: 'pointer', display: 'flex', padding: 4 }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                visible.map((f, idx) => {
                  const isUrl = f.value && (f.value.startsWith('http://') || f.value.startsWith('https://') || f.fieldType === 'url');
                  return (
                    <div key={f.id || f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: idx < visible.length - 1 ? '1px solid #2A302B' : 'none' }}>
                      <span style={{ fontSize: 13, color: 'rgba(242,243,237,0.55)', fontWeight: 600 }}>{f.label}</span>
                      {isUrl ? (
                        <a href={f.value} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#9A8CFF', fontFamily: 'DM Mono, monospace', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                          Open Link <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 13, color: '#F2F3ED', fontFamily: 'DM Mono, monospace', textAlign: 'right', maxWidth: '55%' }}>{f.value || <span style={{ color: 'rgba(242,243,237,0.3)' }}>—</span>}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      {/* ── AI MERGE MODAL ── */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#171B18', border: '1px solid #9A8CFF', borderTop: '3px solid #9A8CFF', borderRadius: 16, width: '100%', maxWidth: 580, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wand2 size={18} color="#9A8CFF" />
                <h3 style={{ margin: 0, fontSize: 18, color: '#9A8CFF', fontFamily: 'serif', fontWeight: 400 }}>Merge Follow-up Email</h3>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.5)', cursor: 'pointer' }} onClick={() => { setShowAiModal(false); setChangesSummary(null); }}><X size={18} /></button>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(242,243,237,0.55)', lineHeight: 1.5 }}>
              Paste a follow-up email with updated test dates, OA links, exam venue, or dress code. AI will merge new info and sync dates to your Calendar automatically.
            </p>
            <textarea style={{ background: '#121413', border: '1px solid #2A302B', color: '#F2F3ED', padding: 14, borderRadius: 8, minHeight: 160, fontFamily: 'DM Mono, monospace', fontSize: 13, width: '100%', resize: 'vertical', outline: 'none' }}
              placeholder="Paste follow-up email text here…" value={followUpText} onChange={e => setFollowUpText(e.target.value)} />
            {changesSummary && (
              <div style={{ background: 'rgba(183,227,74,0.06)', border: '1px solid rgba(183,227,74,0.25)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#b7e34a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><CalendarDays size={13} /> Changes merged & calendar updated!</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'rgba(242,243,237,0.7)' }}>
                  {changesSummary.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => { setShowAiModal(false); setChangesSummary(null); }} style={{ background: 'transparent', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Close</button>
              <button onClick={handleAiUpdate} disabled={aiUpdating || !followUpText.trim()} style={{ background: aiUpdating ? '#121413' : '#9A8CFF', color: '#101311', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> {aiUpdating ? 'Merging…' : 'Merge & Sync Calendar'}
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
