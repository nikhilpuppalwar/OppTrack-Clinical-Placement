import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { opportunityAPI } from '../api';
import {
  Sparkles, Plus, AlertTriangle, Trash2, X,
  Wand2, ChevronDown, ChevronUp, Check, ExternalLink, ArrowRight, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SECTIONS = [
  {
    name: '1. General & Job Details', icon: '🏢', color: '#b7e34a',
    fields: [
      { id: 'company', label: 'Company Name', value: '', fieldType: 'short_text', hidden: false },
      { id: 'role', label: 'Role / Profile', value: '', fieldType: 'short_text', hidden: false },
      { id: 'ctc', label: 'CTC / Package', value: '', fieldType: 'short_text', hidden: false },
      { id: 'employmentType', label: 'Employment Type', value: 'placement', fieldType: 'select', options: ['placement', 'internship', 'off-campus'], hidden: false },
      { id: 'location', label: 'Work Location', value: '', fieldType: 'short_text', hidden: false },
      { id: 'deadline', label: 'Application Deadline', value: '', fieldType: 'datetime-local', hidden: false },
      { id: 'applicationNo', label: 'Registration ID', value: '', fieldType: 'short_text', hidden: false },
    ],
  },
  {
    name: '2. Eligibility Criteria', icon: '🎓', color: '#9A8CFF',
    fields: [
      { id: 'majorBranch', label: 'Allowed Branches', value: 'CS, IT, CS AI-ML, CS AI-DS', fieldType: 'short_text', hidden: false },
      { id: 'minCGPA', label: 'Min CGPA', value: '6.0', fieldType: 'short_text', hidden: false },
      { id: 'minTenthPercent', label: 'Min 10th %', value: '60', fieldType: 'short_text', hidden: false },
      { id: 'minTwelfthPercent', label: 'Min 12th / Diploma %', value: '60', fieldType: 'short_text', hidden: false },
      { id: 'backlogAllowed', label: 'Active Backlogs Allowed', value: 'No', fieldType: 'select', options: ['No', 'Yes'], hidden: false },
    ],
  },
  {
    name: '3. Bond & Legal Details', icon: '⚖️', color: '#f59e0b',
    fields: [
      { id: 'bondRequired', label: 'Service Bond Required', value: 'No', fieldType: 'select', options: ['No', 'Yes'], hidden: false },
      { id: 'bondDuration', label: 'Bond Duration (Months)', value: '', fieldType: 'short_text', hidden: false },
      { id: 'bondPenalty', label: 'Breach Penalty Amount', value: '', fieldType: 'short_text', hidden: false },
    ],
  },
  {
    name: '4. Contact & HR Details', icon: '📞', color: '#3b82f6',
    fields: [
      { id: 'hrName', label: 'HR / Contact Person', value: '', fieldType: 'short_text', hidden: false },
      { id: 'hrPhone', label: 'HR Phone / Email', value: '', fieldType: 'short_text', hidden: false },
    ],
  },
];

const inputStyle = {
  width: '100%', background: '#121413', border: '1px solid #2A302B',
  color: '#F2F3ED', padding: '9px 12px', borderRadius: 6, fontSize: 13,
  outline: 'none', fontFamily: 'Manrope, sans-serif',
};

const selectStyle = {
  ...{}, background: '#121413', border: '1px solid #2A302B',
  color: '#F2F3ED', padding: '9px 12px', borderRadius: 6, fontSize: 13,
  outline: 'none', cursor: 'pointer', width: '100%',
};

export default function NewOpportunity() {
  const [tab, setTab] = useState('manual');
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [rawEmail, setRawEmail] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [addingToSection, setAddingToSection] = useState(null);
  const [newField, setNewField] = useState({ label: '', value: '' });
  const navigate = useNavigate();

  const toggleSection = (i) => setCollapsedSections(p => ({ ...p, [i]: !p[i] }));

  const handleUpdateSectionName = (i, name) =>
    setSections(p => { const c = [...p]; c[i] = { ...c[i], name }; return c; });

  const handleUpdateField = (si, fid, key, val) =>
    setSections(p => {
      const c = JSON.parse(JSON.stringify(p));
      const f = c[si].fields.find(f => f.id === fid);
      if (f) f[key] = val;
      return c;
    });

  const handleHideField = (si, fid) => {
    setSections(p => {
      const c = JSON.parse(JSON.stringify(p));
      const f = c[si].fields.find(f => f.id === fid);
      if (f) f.hidden = true;
      return c;
    });
    toast.success('Field removed');
  };

  const handleAddField = (si) => {
    if (!newField.label.trim()) return toast.error('Enter a field label');
    const created = { id: 'f_' + Date.now(), label: newField.label.trim(), value: newField.value.trim(), fieldType: 'short_text', hidden: false };
    setSections(p => {
      const c = JSON.parse(JSON.stringify(p));
      c[si].fields.push(created);
      return c;
    });
    setAddingToSection(null);
    setNewField({ label: '', value: '' });
    toast.success(`"${created.label}" added`);
  };

  const handleExtract = async () => {
    if (!rawEmail.trim()) return toast.error('Paste email text first');
    setExtracting(true);
    const id = toast.loading('AI parsing email…');
    try {
      const { data } = await opportunityAPI.extract(rawEmail);
      const f = data.extractedFields;
      setDuplicate(data.duplicateWarning);
      setExtracted(f);

      if (f.sections?.length > 0) {
        if (Array.isArray(f.links) && f.links.length > 0) {
          let ls = f.sections.find(s => s.name.includes('Links') || s.name.includes('5.'));
          if (!ls) { ls = { name: '5. Registration & Important Links', fields: [] }; f.sections.push(ls); }
          f.links.forEach((l, idx) => {
            if (!ls.fields.some(e => e.value === l.url))
              ls.fields.push({ id: `link_${idx}_${Date.now()}`, label: l.label || `Link ${idx + 1}`, value: l.url, fieldType: 'url', hidden: false });
          });
        }
        const STYLES = [
          { icon: '🏢', color: '#b7e34a' }, { icon: '🎓', color: '#9A8CFF' },
          { icon: '⚖️', color: '#f59e0b' }, { icon: '📞', color: '#3b82f6' }, { icon: '🔗', color: '#ec4899' },
        ];
        setSections(f.sections.map((s, i) => ({ ...s, icon: STYLES[i]?.icon || '📋', color: STYLES[i]?.color || '#b7e34a', fields: (s.fields || []).map(fld => ({ ...fld, hidden: false })) })));
      }
      toast.success('✅ Fields extracted & form filled!', { id });
      setTab('manual');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Extraction failed', { id });
    } finally { setExtracting(false); }
  };

  const handleSave = async () => {
    const customFields = sections.flatMap(s => s.fields.map(f => ({ ...f, section: s.name })));
    const gv = (fid) => customFields.find(f => f.id === fid && !f.hidden)?.value || null;
    const company = gv('company'), role = gv('role');
    if (!company || !role) return toast.error('Company Name and Role are required');
    setSaving(true);
    try {
      let deadline = gv('deadline') || extracted?.deadline || null;
      if (deadline && !isNaN(new Date(deadline).getTime())) deadline = new Date(deadline).toISOString();
      else deadline = null;
      const { data } = await opportunityAPI.create({
        company, role,
        ctc: gv('ctc'), stipend: gv('stipend'), ppo: gv('ppo'),
        employmentType: gv('employmentType') || extracted?.employmentType || 'placement',
        location: gv('location') || extracted?.location || null,
        deadline, customFields,
        links: extracted?.links || [],
        source: extracted ? { rawEmailText: rawEmail, extractedViaAI: true } : undefined,
      });
      toast.success('✅ Opportunity saved & synced to Calendar!');
      navigate(`/opportunities/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60, fontFamily: 'Manrope, sans-serif' }}>

      {/* Page Header */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 24, marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 6px 0' }}>
          New Opportunity
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(242,243,237,0.55)' }}>
          Fill in placement record details manually, or use AI Smart Paste to extract from email.
        </p>
      </header>

      {/* Mode Toggle Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#171B18', border: '1px solid #2A302B', borderRadius: 8, padding: 4 }}>
        {[
          { key: 'manual', label: '✏️  Manual Form', accentColor: '#b7e34a' },
          { key: 'smart', label: '✦  AI Smart Paste', accentColor: '#9A8CFF' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '9px 0', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: tab === t.key ? '#121413' : 'transparent',
            color: tab === t.key ? t.accentColor : 'rgba(242,243,237,0.5)',
            border: tab === t.key ? `1px solid #2A302B` : '1px solid transparent',
            borderBottom: tab === t.key ? `2px solid ${t.accentColor}` : '1px solid transparent',
            transition: 'all 0.15s ease',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── AI SMART PASTE TAB ── */}
      {tab === 'smart' && (
        <div style={{ background: '#171B18', border: '1px solid #9A8CFF', borderTop: '3px solid #9A8CFF', borderRadius: 16, padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Wand2 size={18} color="#9A8CFF" />
            <span style={{ fontSize: 16, fontFamily: 'serif', color: '#9A8CFF' }}>AI Email Auto-Ingestion</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(242,243,237,0.55)', marginBottom: 20, lineHeight: 1.6 }}>
            Paste the full placement notification email below. AI will extract Company, Role, Eligibility, Bond, HR Contact and Important Links — then auto-fill the form for you to review.
          </p>
          <textarea
            style={{ ...inputStyle, minHeight: 220, resize: 'vertical', fontFamily: 'DM Mono, monospace', lineHeight: 1.6, marginBottom: 16 }}
            placeholder="Paste full placement email text here…"
            value={rawEmail}
            onChange={e => setRawEmail(e.target.value)}
          />
          <button
            onClick={handleExtract}
            disabled={extracting || !rawEmail.trim()}
            style={{
              width: '100%', background: extracting ? '#121413' : '#9A8CFF',
              color: '#101311', border: 'none', borderRadius: 6, padding: '12px 0',
              fontSize: 14, fontWeight: 700, cursor: extracting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Sparkles size={16} /> {extracting ? 'Extracting fields…' : 'Extract & Fill All Sections'}
          </button>
          {extracted && (
            <div style={{ marginTop: 16, background: 'rgba(183,227,74,0.08)', border: '1px solid rgba(183,227,74,0.3)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#b7e34a', fontWeight: 600 }}>✅ Fields extracted — review & save in Manual Form</span>
              <button onClick={() => setTab('manual')} style={{ background: 'transparent', border: 'none', color: '#b7e34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
                Review <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL FORM TAB ── */}
      {tab === 'manual' && (
        <div>
          {/* Duplicate warning */}
          {duplicate?.isDuplicate && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.4)', borderLeft: '3px solid #f59e0b', color: '#f59e0b', padding: '12px 16px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} />
              <span style={{ fontSize: 13 }}>Possible duplicate: <strong>{duplicate.existingCompany} — {duplicate.existingRole}</strong></span>
            </div>
          )}

          {/* Extracted Links Banner */}
          {extracted?.links?.length > 0 && (
            <div style={{ background: '#171B18', border: '1px solid rgba(154,140,255,0.4)', borderLeft: '3px solid #9A8CFF', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9A8CFF', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink size={13} /> AI Extracted Links ({extracted.links.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {extracted.links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{
                    background: '#121413', border: '1px solid #9A8CFF', color: '#9A8CFF',
                    padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    {l.label || `Link ${i + 1}`} <ExternalLink size={11} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Section Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sections.map((sec, si) => {
              const visible = sec.fields.filter(f => !f.hidden);
              const hidden = sec.fields.filter(f => f.hidden);
              const collapsed = collapsedSections[si];

              return (
                <div key={si} style={{ background: '#171B18', border: '1px solid #2A302B', borderLeft: `3px solid ${sec.color}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Section header */}
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: collapsed ? 'none' : '1px solid #2A302B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span style={{ fontSize: 16 }}>{sec.icon}</span>
                      <input
                        value={sec.name}
                        onChange={e => handleUpdateSectionName(si, e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 700, fontSize: 14, color: '#F2F3ED', flex: 1 }}
                        title="Click to rename section"
                      />
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.4)' }}>
                        {visible.length} field{visible.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginLeft: 12 }}>
                      <button onClick={() => setAddingToSection(si)} style={{ background: 'transparent', border: 'none', color: sec.color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        + Field
                      </button>
                      <button onClick={() => toggleSection(si)} style={{ background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.4)', cursor: 'pointer' }}>
                        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                    </div>
                  </div>

                  {!collapsed && (
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Add-field inline form */}
                      {addingToSection === si && (
                        <div style={{ background: '#121413', border: `1px solid ${sec.color}`, borderRadius: 8, padding: 14, marginBottom: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: sec.color, marginBottom: 10, letterSpacing: '0.04em' }}>
                            Add Field to {sec.name}
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <input
                              placeholder="Field label (e.g. Joining Date)"
                              value={newField.label}
                              onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                              style={{ ...inputStyle, flex: 1 }}
                              autoFocus
                            />
                            <input
                              placeholder="Default value"
                              value={newField.value}
                              onChange={e => setNewField(f => ({ ...f, value: e.target.value }))}
                              style={{ ...inputStyle, flex: 1 }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button onClick={() => handleAddField(si)} style={{ background: sec.color, color: '#101311', border: 'none', padding: '7px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Add Field
                            </button>
                            <button onClick={() => setAddingToSection(null)} style={{ background: 'transparent', border: '1px solid #2A302B', color: 'rgba(242,243,237,0.6)', padding: '7px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Field rows */}
                      {visible.length === 0 && addingToSection !== si ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(242,243,237,0.35)', fontSize: 13 }}>
                          No fields yet.{' '}
                          <button onClick={() => setAddingToSection(si)} style={{ background: 'transparent', border: 'none', color: sec.color, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>+ Add one</button>
                        </div>
                      ) : (
                        visible.map(field => (
                          <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 32px', gap: 10, alignItems: 'center' }}>
                            {/* Label */}
                            <div>
                              <input
                                value={field.label}
                                onChange={e => handleUpdateField(si, field.id, 'label', e.target.value)}
                                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'rgba(242,243,237,0.6)', fontSize: 12, fontWeight: 600, width: '100%' }}
                              />
                            </div>
                            {/* Value */}
                            {field.fieldType === 'select' ? (
                              <select value={field.value} onChange={e => handleUpdateField(si, field.id, 'value', e.target.value)} style={selectStyle}>
                                {(field.options || ['No', 'Yes']).map(o => <option key={o} value={o} style={{ background: '#121413' }}>{o}</option>)}
                              </select>
                            ) : (
                              <input
                                type={field.fieldType === 'datetime-local' ? 'datetime-local' : 'text'}
                                value={field.value}
                                onChange={e => handleUpdateField(si, field.id, 'value', e.target.value)}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                style={inputStyle}
                              />
                            )}
                            {/* Delete */}
                            <button onClick={() => handleHideField(si, field.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,180,171,0.6)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}

                      {/* Removed fields restore bar */}
                      {hidden.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'rgba(242,243,237,0.35)' }}>Removed:</span>
                          {hidden.map(hf => (
                            <button key={hf.id} onClick={() => {
                              setSections(p => {
                                const c = JSON.parse(JSON.stringify(p));
                                const f = c[si].fields.find(f => f.id === hf.id);
                                if (f) f.hidden = false;
                                return c;
                              });
                            }} style={{ fontSize: 11, padding: '2px 10px', background: '#121413', border: '1px dashed #2A302B', borderRadius: 20, color: 'rgba(242,243,237,0.5)', cursor: 'pointer' }}>
                              ↩ {hf.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Bar */}
          <div style={{ marginTop: 28, background: '#171B18', border: '1px solid #2A302B', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(242,243,237,0.5)' }}>
              {sections.reduce((t, s) => t + s.fields.filter(f => !f.hidden).length, 0)} fields across {sections.length} sections
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#b7e34a', color: '#101311', border: 'none',
                borderRadius: 6, padding: '10px 28px', fontSize: 14, fontWeight: 700,
                cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Save size={15} /> {saving ? 'Saving…' : 'Save Opportunity'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
