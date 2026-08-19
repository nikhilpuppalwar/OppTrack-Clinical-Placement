import { useEffect, useState } from 'react';
import { profileAPI } from '../api';
import { Edit, Save, Plus, Trash2, Check, Copy, ExternalLink, X, RotateCcw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const FIELD_TYPES = [
  { key: 'short_text', label: 'Short answer' },
  { key: 'paragraph', label: 'Paragraph' },
  { key: 'date', label: 'Date' },
  { key: 'select', label: 'Multiple choice / Dropdown' },
  { key: 'file_path', label: 'File Path / Link' },
];

const DEFAULT_INITIAL_FIELDS = [
  // 1. Personal Information
  { id: 'candidateName', section: 'personal', label: 'Full Name', fieldType: 'short_text', value: '' },
  { id: 'preferredName', section: 'personal', label: 'Preferred Name', fieldType: 'short_text', value: '' },
  { id: 'prn', section: 'personal', label: 'PRN / Student ID', fieldType: 'short_text', value: '' },
  { id: 'gender', section: 'personal', label: 'Gender', fieldType: 'select', options: ['Male', 'Female', 'Other'], value: 'Male' },
  { id: 'collegeName', section: 'personal', label: 'College Name', fieldType: 'select', options: ["PCCOE, Pune", "PCCOE&R, Pune", "NMIET, Pune", "NCER, Pune", "PCU, Pune", "Other"], value: "PCCOE, Pune" },
  { id: 'stream', section: 'personal', label: 'Stream', fieldType: 'select', options: ['B.Tech', 'M.Tech', 'MCA', 'Other'], value: 'B.Tech' },
  { id: 'branch', section: 'personal', label: 'Branch', fieldType: 'select', options: ['CS', 'IT', 'CS AI-ML', 'CS AI-DS', 'ENTC', 'Mechanical', 'Civil', 'Other'], value: 'CS' },
  { id: 'passingYear', section: 'personal', label: 'Year of Passing', fieldType: 'select', options: ['2027', '2026', '2025', '2028'], value: '2027' },

  // 2. Contact Details
  { id: 'collegeEmail', section: 'contact', label: 'College Email ID', fieldType: 'short_text', value: '' },
  { id: 'personalEmail', section: 'contact', label: 'Personal Email ID', fieldType: 'short_text', value: '' },
  { id: 'phone', section: 'contact', label: 'Phone Number', fieldType: 'short_text', value: '' },

  // 3. Academics
  { id: 'cgpa', section: 'academics', label: 'CGPA', fieldType: 'short_text', value: '' },
  { id: 'tenthPercent', section: 'academics', label: '10th Percentage', fieldType: 'short_text', value: '' },
  { id: 'twelfthPercent', section: 'academics', label: '12th / Diploma Percentage', fieldType: 'short_text', value: '' },
  { id: 'hasBacklog', section: 'academics', label: 'Active Backlog', fieldType: 'select', options: ['No', 'Yes'], value: 'No' },
  { id: 'backlogDetails', section: 'academics', label: 'Backlog Details', fieldType: 'short_text', value: '' },

  // 4. Specializations & Courses
  { id: 'dsCourseDone', section: 'courses', label: 'DS / DE / BI Course Done', fieldType: 'select', options: ['No', 'Yes'], value: 'No' },
  { id: 'dsCourseName', section: 'courses', label: 'Course Name', fieldType: 'short_text', value: '' },
  { id: 'technicalCertifications', section: 'courses', label: 'Certifications', fieldType: 'paragraph', value: '' },

  // 5. Internships & Projects
  { id: 'previousInternships', section: 'internships', label: 'Previous Internships', fieldType: 'paragraph', value: '' },
  { id: 'roleApplied', section: 'internships', label: 'Preferred Role', fieldType: 'short_text', value: 'Software Engineer; Data Analyst' },
  { id: 'projectTitle', section: 'internships', label: 'Academic Project Title', fieldType: 'short_text', value: '' },
  { id: 'projectDetails', section: 'internships', label: 'Project Description', fieldType: 'paragraph', value: '' },

  // 6. Professional Links & Platforms
  { id: 'portfolioUrl', section: 'links', label: 'Portfolio URL', fieldType: 'file_path', value: '' },
  { id: 'linkedinLink', section: 'links', label: 'LinkedIn Profile', fieldType: 'file_path', value: '' },
  { id: 'githubLink', section: 'links', label: 'GitHub Profile', fieldType: 'file_path', value: '' },
  { id: 'leetcodeLink', section: 'links', label: 'LeetCode Rating / Profile', fieldType: 'file_path', value: '' },
  { id: 'codechefLink', section: 'links', label: 'CodeChef Rating / Profile', fieldType: 'file_path', value: '' },
  { id: 'resumeLink', section: 'links', label: 'Resume Link / Storage Path', fieldType: 'file_path', value: '' },
];

// Single Copyable Field Component styled for Stitch AI design
function VaultField({ label, value, isMonospace, isLink }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopied(false), 1500);
  };

  const isUrl = isLink || (value && (value.startsWith('http://') || value.startsWith('https://')));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderBottom: '1px solid #2A302B',
        paddingBottom: 12,
      }}
      className="group"
    >
      {/* Label */}
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(242,243,237,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em'
      }}>
        {label}
      </span>

      {/* Value row: text + copy button side by side, text wraps */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isUrl ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#c7bfff',
                fontSize: 14,
                fontFamily: 'DM Mono, monospace',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                overflow: 'hidden',
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              <span style={{ wordBreak: 'break-all', overflowWrap: 'anywhere', minWidth: 0, flex: 1 }}>{value}</span>
              <ExternalLink size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            </a>
          ) : (
            <span
              style={{
                color: '#F2F3ED',
                fontSize: 14,
                wordBreak: 'break-all',
                fontFamily: isMonospace || label.toLowerCase().includes('email') || label.toLowerCase().includes('phone') ? 'DM Mono, monospace' : 'inherit'
              }}
            >
              {value || <span style={{ color: 'rgba(242,243,237,0.25)', fontStyle: 'italic' }}>Not provided</span>}
            </span>
          )}
        </div>

        {/* Copy button — always visible and never overlaps */}
        <button
          onClick={handleCopy}
          title={`Copy ${label}`}
          style={{
            flexShrink: 0,
            background: copied ? 'rgba(183,227,74,0.12)' : 'rgba(242,243,237,0.05)',
            border: `1px solid ${copied ? '#b7e34a' : '#2A302B'}`,
            borderRadius: 6,
            color: copied ? '#b7e34a' : 'rgba(242,243,237,0.5)',
            cursor: value ? 'pointer' : 'default',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { if (value) { e.currentTarget.style.borderColor = '#b7e34a'; e.currentTarget.style.color = '#b7e34a'; } }}
          onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = '#2A302B'; e.currentTarget.style.color = 'rgba(242,243,237,0.5)'; } }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const [fields, setFields] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New field modal state
  const [addingSection, setAddingSection] = useState(null);
  const [newField, setNewField] = useState({
    label: '',
    fieldType: 'short_text',
    optionsText: 'Option 1, Option 2',
    value: '',
  });

  useEffect(() => {
    profileAPI.get()
      .then(({ data }) => {
        let loadedFields = data.fields || [];

        if (loadedFields.length === 0) {
          loadedFields = DEFAULT_INITIAL_FIELDS.map(def => ({
            ...def,
            value: data[def.id] !== undefined && data[def.id] !== null ? String(data[def.id]) : def.value,
            hidden: false,
          }));

          if (Array.isArray(data.customFields)) {
            data.customFields.forEach(cf => {
              loadedFields.push({
                id: cf.id || 'custom_' + Date.now(),
                section: cf.section || 'personal',
                label: cf.label || 'Custom Field',
                fieldType: cf.fieldType || 'short_text',
                options: cf.options || [],
                value: cf.value || '',
                hidden: false,
                isCustom: true,
              });
            });
          }
        }
        setFields(loadedFields);
      })
      .catch(() => toast.error('Failed to load profile details'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { fields };
      fields.forEach(f => {
        if (!f.isCustom && f.id) payload[f.id] = f.value;
      });

      const { data } = await profileAPI.update(payload);
      setFields(data.fields || fields);
      setEditing(false);
      toast.success('Profile Vault updated successfully!');
    } catch {
      toast.error('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateField = (id, key, val) => {
    setFields(list => list.map(f => {
      if (f.id !== id) return f;
      if (key === 'optionsText') {
        const opts = val.split(',').map(s => s.trim()).filter(Boolean);
        return { ...f, options: opts, optionsText: val };
      }
      return { ...f, [key]: val };
    }));
  };

  const handleHideField = (id) => {
    setFields(list => list.map(f => f.id === id ? { ...f, hidden: true } : f));
    toast.success('Field hidden');
  };

  const handleRestoreField = (id) => {
    setFields(list => list.map(f => f.id === id ? { ...f, hidden: false } : f));
    toast.success('Field restored');
  };

  const handleOpenAddField = (sectionKey) => {
    setAddingSection(sectionKey);
    setNewField({ label: '', fieldType: 'short_text', optionsText: 'Option 1, Option 2', value: '' });
  };

  const handleConfirmAddField = () => {
    if (!newField.label.trim()) return toast.error('Enter field title');

    let parsedOptions = [];
    if (newField.fieldType === 'select' && newField.optionsText) {
      parsedOptions = newField.optionsText.split(',').map(s => s.trim()).filter(Boolean);
    }

    const created = {
      id: 'field_' + Date.now(),
      section: addingSection,
      label: newField.label.trim(),
      fieldType: newField.fieldType,
      options: parsedOptions,
      value: newField.value.trim() || (parsedOptions.length > 0 ? parsedOptions[0] : ''),
      hidden: false,
      isCustom: true,
    };

    setFields(list => [...list, created]);
    setAddingSection(null);
    toast.success(`Added "${created.label}"!`);
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Section configuration list matching Stitch AI specs
  const SECTIONS = [
    { key: 'personal', title: '01. Personal Information' },
    { key: 'contact', title: '02. Contact Details' },
    { key: 'academics', title: '03. Academic Criteria' },
    { key: 'courses', title: '04. Specializations & Certifications' },
    { key: 'internships', title: '05. Internships & Projects' },
    { key: 'links', title: '06. Professional Links & Platforms' },
  ];

  const hiddenFields = fields.filter(f => f.hidden);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Profile Vault
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'rgba(242,243,237,0.6)' }}>
            Your reusable placement information.
          </p>
        </div>

        <div>
          {editing ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2A302B',
                  color: '#F2F3ED',
                  padding: '8px 18px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: '#171B18',
                  color: '#F2F3ED',
                  border: 'none',
                  borderBottom: '2px solid #B7E34A',
                  padding: '8px 20px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: '#171B18',
                color: '#F2F3ED',
                border: '1px solid #2A302B',
                padding: '8px 20px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>
      </header>

      {/* Info Banner matching Stitch AI design */}
      <div
        style={{
          background: '#1e201f',
          borderLeft: '4px solid #b7e34a',
          padding: '16px 24px',
          borderRadius: 8,
          marginBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#F2F3ED', textTransform: 'uppercase', marginBottom: 4 }}>
          ✦ FULL CONTROL
        </span>
        <span style={{ fontSize: 14, color: 'rgba(242,243,237,0.7)' }}>
          Your data is securely stored and ready to be used across all your opportunity applications. Click any field to copy.
        </span>
      </div>

      {/* Sections Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {SECTIONS.map(sec => {
          const sectionFields = fields.filter(f => f.section === sec.key && !f.hidden);

          return (
            <div
              key={sec.key}
              style={{
                background: '#171B18',
                border: '1px solid #2A302B',
                borderRadius: 16,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 24
              }}
            >
              <h2 style={{ fontSize: 22, fontFamily: 'serif', color: '#F2F3ED', margin: 0, paddingBottom: 16, borderBottom: '1px solid #2A302B' }}>
                {sec.title}
              </h2>

              {sectionFields.length === 0 && !editing && (
                <div style={{ fontSize: 13, color: 'rgba(242,243,237,0.4)', fontStyle: 'italic' }}>
                  No fields added to this section yet. Click "Edit Profile" to add fields.
                </div>
              )}

              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sectionFields.map(field => (
                    <div
                      key={field.id}
                      style={{
                        background: '#121413',
                        padding: 16,
                        borderRadius: 8,
                        border: '1px solid #2A302B',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                            Label Title
                          </label>
                          <input
                            value={field.label}
                            onChange={e => handleUpdateField(field.id, 'label', e.target.value)}
                            style={{ width: '100%', background: '#171B18', border: '1px solid #2A302B', color: '#F2F3ED', padding: '6px 10px', borderRadius: 4, fontSize: 13 }}
                          />
                        </div>
                        <button
                          onClick={() => handleHideField(field.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: 18, padding: 4 }}
                          title="Hide Field"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(242,243,237,0.5)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                          Field Value
                        </label>
                        <input
                          value={field.value || ''}
                          onChange={e => handleUpdateField(field.id, 'value', e.target.value)}
                          style={{ width: '100%', background: '#171B18', border: '1px solid #2A302B', color: '#F2F3ED', padding: '6px 10px', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                  {sectionFields.map(field => (
                    <div key={field.id} style={{ overflow: 'hidden', minWidth: 0 }}>
                      <VaultField
                        label={field.label}
                        value={field.value}
                        isLink={field.fieldType === 'file_path' || field.id.toLowerCase().includes('link') || field.id.toLowerCase().includes('url')}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Add field action button */}
              {addingSection === sec.key ? (
                <div style={{ background: '#121413', padding: 16, borderRadius: 8, border: '1px solid #b7e34a', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#b7e34a' }}>Add Field to {sec.title}</span>
                    <button style={{ background: 'transparent', border: 'none', color: '#9A9F99', cursor: 'pointer' }} onClick={() => setAddingSection(null)}><X size={16} /></button>
                  </div>
                  <input
                    placeholder="Field Label (e.g. Aadhaar Number)"
                    value={newField.label}
                    onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                    style={{ background: '#171B18', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 12px', borderRadius: 4, fontSize: 13 }}
                  />
                  <input
                    placeholder="Value (e.g. 1234-5678-9012)"
                    value={newField.value}
                    onChange={e => setNewField(f => ({ ...f, value: e.target.value }))}
                    style={{ background: '#171B18', border: '1px solid #2A302B', color: '#F2F3ED', padding: '8px 12px', borderRadius: 4, fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={{ background: '#b7e34a', color: '#151f00', border: 'none', padding: '6px 14px', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer' }} onClick={handleConfirmAddField}>
                      Add Field
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenAddField(sec.key)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'transparent',
                    border: '1px border #2A302B',
                    color: 'rgba(242,243,237,0.5)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 4
                  }}
                >
                  <Plus size={14} /> Add Field
                </button>
              )}
            </div>
          );
        })}

        {/* Deleted / Hidden Fields Restore Box */}
        {editing && hiddenFields.length > 0 && (
          <div style={{ background: '#171B18', border: '1px dashed #2A302B', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(242,243,237,0.6)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={16} /> Hidden Fields ({hiddenFields.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {hiddenFields.map(hf => (
                <div key={hf.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#121413', padding: '4px 10px', borderRadius: 4, border: '1px solid #2A302B', fontSize: 12 }}>
                  <span>{hf.label}</span>
                  <button style={{ background: 'transparent', border: 'none', color: '#b7e34a', cursor: 'pointer', fontSize: 12 }} onClick={() => handleRestoreField(hf.id)}>
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
