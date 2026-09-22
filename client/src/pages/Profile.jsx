import { useEffect, useState } from 'react';
import { profileAPI } from '../api';
import { 
  Edit, Save, Plus, Trash2, Check, Copy, ExternalLink, X, RotateCcw, 
  Sparkles, Puzzle, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle, 
  RefreshCw, CheckCheck, Eye, HelpCircle, FileText
} from 'lucide-react';
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

  // 7. Skills
  { id: 'technicalSkills', section: 'skills', label: 'Technical Skills', fieldType: 'paragraph', value: '' },
  { id: 'programmingLanguages', section: 'skills', label: 'Programming Languages', fieldType: 'short_text', value: '' },
  { id: 'frameworks', section: 'skills', label: 'Frameworks & Libraries', fieldType: 'short_text', value: '' },
  { id: 'tools', section: 'skills', label: 'Tools & Technologies', fieldType: 'short_text', value: '' },
  { id: 'softSkills', section: 'skills', label: 'Soft Skills', fieldType: 'short_text', value: '' },
  { id: 'languages', section: 'skills', label: 'Languages Known', fieldType: 'short_text', value: '' },

  // 8. Technical Achievements
  { id: 'technicalAchievements', section: 'technical_achievements', label: 'Technical Achievements', fieldType: 'paragraph', value: '' },
  { id: 'hackathons', section: 'technical_achievements', label: 'Hackathons / Competitions', fieldType: 'paragraph', value: '' },
  { id: 'openSource', section: 'technical_achievements', label: 'Open Source Contributions', fieldType: 'paragraph', value: '' },
  { id: 'publications', section: 'technical_achievements', label: 'Research Papers / Publications', fieldType: 'paragraph', value: '' },

  // 9. Personal Achievements
  { id: 'personalAchievements', section: 'personal_achievements', label: 'Personal Achievements', fieldType: 'paragraph', value: '' },
  { id: 'extracurricular', section: 'personal_achievements', label: 'Extra-Curricular Activities', fieldType: 'paragraph', value: '' },
  { id: 'sportsAchievements', section: 'personal_achievements', label: 'Sports / NSS / NCC', fieldType: 'paragraph', value: '' },
  { id: 'hobby', section: 'personal_achievements', label: 'Hobbies & Interests', fieldType: 'short_text', value: '' },

  // 10. Current Address
  { id: 'currentAddressLine1', section: 'current_address', label: 'Address Line 1', fieldType: 'short_text', value: '' },
  { id: 'currentAddressLine2', section: 'current_address', label: 'Address Line 2', fieldType: 'short_text', value: '' },
  { id: 'currentCity', section: 'current_address', label: 'City', fieldType: 'short_text', value: '' },
  { id: 'currentState', section: 'current_address', label: 'State', fieldType: 'short_text', value: '' },
  { id: 'currentPincode', section: 'current_address', label: 'Pincode', fieldType: 'short_text', value: '' },
  { id: 'currentCountry', section: 'current_address', label: 'Country', fieldType: 'short_text', value: 'India' },

  // 11. Permanent Address
  { id: 'sameAsCurrentAddress', section: 'permanent_address', label: 'Same as Current Address', fieldType: 'select', options: ['Yes', 'No'], value: 'Yes' },
  { id: 'permanentAddressLine1', section: 'permanent_address', label: 'Address Line 1', fieldType: 'short_text', value: '' },
  { id: 'permanentAddressLine2', section: 'permanent_address', label: 'Address Line 2', fieldType: 'short_text', value: '' },
  { id: 'permanentCity', section: 'permanent_address', label: 'City', fieldType: 'short_text', value: '' },
  { id: 'permanentState', section: 'permanent_address', label: 'State', fieldType: 'short_text', value: '' },
  { id: 'permanentPincode', section: 'permanent_address', label: 'Pincode', fieldType: 'short_text', value: '' },
  { id: 'permanentCountry', section: 'permanent_address', label: 'Country', fieldType: 'short_text', value: 'India' },
];

function VaultField({ field, onEdit, onDelete, isMonospace }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const rawVal = field?.value !== undefined && field?.value !== null ? String(field.value) : '';
  const trimmed = rawVal.trim();
  const isWebUrl = Boolean(trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://')));

  const handleCopy = () => {
    if (!trimmed) return;
    navigator.clipboard.writeText(trimmed);
    setCopied(true);
    toast.success(`Copied ${field.label}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderBottom: '1px solid #F0F4F8',
        paddingBottom: 12,
        borderRadius: 8,
        padding: '8px 10px',
        backgroundColor: hovered ? '#F8FAFD' : 'transparent',
        transition: 'background-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#667085',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {field.label}
          </span>
          {field.isCustom && (
            <span style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 4,
              background: '#EEF2FF',
              color: '#4F46E5',
              border: '1px solid #C7D2FE',
            }}>
              Custom
            </span>
          )}
        </div>

        {/* Action icons: Copy, Edit, Delete */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          opacity: hovered ? 1 : 0.45,
          transition: 'opacity 0.15s',
        }}>
          {trimmed && (
            <button
              onClick={handleCopy}
              title={`Copy ${field.label}`}
              type="button"
              style={{
                background: copied ? '#E8F8F5' : '#FFFFFF',
                border: `1px solid ${copied ? '#A3E5D9' : '#E2E8F0'}`,
                borderRadius: 5,
                padding: '3px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: copied ? '#087F71' : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}

          <button
            onClick={() => onEdit(field)}
            title={`Edit ${field.label}`}
            type="button"
            style={{
              background: '#FFFFFF',
              border: '1px solid #BFDBFE',
              borderRadius: 5,
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              transition: 'all 0.15s ease',
            }}
          >
            <Edit size={12} />
          </button>

          <button
            onClick={() => onDelete(field.id, field.label)}
            title={`Delete ${field.label}`}
            type="button"
            style={{
              background: '#FFFFFF',
              border: '1px solid #FECACA',
              borderRadius: 5,
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isWebUrl ? (
            <a
              href={trimmed}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: '#2563EB',
                textDecoration: 'none',
                wordBreak: 'break-all',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>{trimmed}</span>
              <ExternalLink size={13} style={{ flexShrink: 0 }} />
            </a>
          ) : (
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: trimmed ? '#172033' : '#98A2B3',
              fontStyle: trimmed ? 'normal' : 'italic',
              fontFamily: isMonospace ? 'ui-monospace, monospace' : 'inherit',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5
            }}>
              {trimmed || 'Not provided'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const SECTIONS = [
  { key: 'personal', title: '1. Personal Details' },
  { key: 'contact', title: '2. Contact Details' },
  { key: 'academics', title: '3. Academic Credentials' },
  { key: 'courses', title: '4. Specializations & Certifications' },
  { key: 'internships', title: '5. Internships & Academic Projects' },
  { key: 'links', title: '6. Portfolios & Competitive Platforms' },
  { key: 'skills', title: '7. Technical & Soft Skills' },
  { key: 'technical_achievements', title: '8. Technical Achievements' },
  { key: 'personal_achievements', title: '9. Personal Achievements & Hobbies' },
  { key: 'current_address', title: '10. Current Residential Address' },
  { key: 'permanent_address', title: '11. Permanent Residential Address' },
];

export default function Profile() {
  const [fields, setFields] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Staged extension data review state
  const [pendingSyncs, setPendingSyncs] = useState([]);
  const [loadingSyncs, setLoadingSyncs] = useState(false);
  const [selectedSyncIndex, setSelectedSyncIndex] = useState(0);
  const [syncEdits, setSyncEdits] = useState({});
  const [verifyingSync, setVerifyingSync] = useState(false);
  const [dismissingSync, setDismissingSync] = useState(false);

  // AI manual text / form scan modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [analyzingText, setAnalyzingText] = useState(false);

  // Field CRUD state
  const [deletedFieldIds, setDeletedFieldIds] = useState([]);
  const [quickEditModal, setQuickEditModal] = useState(null);
  const [quickEditSaving, setQuickEditSaving] = useState(false);

  // New field modal state
  const [addingSection, setAddingSection] = useState(null);
  const [newField, setNewField] = useState({
    label: '',
    fieldType: 'short_text',
    optionsText: 'Option 1, Option 2',
    value: '',
  });

  const loadProfile = async () => {
    try {
      const { data } = await profileAPI.get();
      const rawFields = Array.isArray(data?.fields) ? data.fields : [];
      const deletedSet = new Set(Array.isArray(data?.deletedFieldIds) ? data.deletedFieldIds : []);
      setDeletedFieldIds(Array.from(deletedSet));
      const existingFieldMap = new Map();

      rawFields.forEach(f => {
        if (f && f.id) existingFieldMap.set(f.id, { ...f });
      });

      const mergedFields = DEFAULT_INITIAL_FIELDS
        .filter(def => !deletedSet.has(def.id))
        .map(def => {
          const existing = existingFieldMap.get(def.id);
          const topVal = data && data[def.id] !== undefined && data[def.id] !== null ? String(data[def.id]) : '';

          if (existing) {
            const effectiveVal = existing.value !== undefined && existing.value !== null && String(existing.value).trim() !== ''
              ? String(existing.value)
              : (topVal || def.value || '');

            return {
              ...def,
              ...existing,
              value: effectiveVal,
            };
          } else {
            return {
              ...def,
              value: topVal || def.value || '',
              hidden: false,
            };
          }
        });

      rawFields.forEach(f => {
        if (f && f.id && !deletedSet.has(f.id) && !DEFAULT_INITIAL_FIELDS.some(def => def.id === f.id)) {
          mergedFields.push({ ...f });
        }
      });

      if (Array.isArray(data?.customFields)) {
        data.customFields.forEach(cf => {
          if (cf && cf.id && !deletedSet.has(cf.id) && !mergedFields.some(f => f.id === cf.id)) {
            mergedFields.push({
              id: cf.id,
              section: cf.section || 'personal',
              label: cf.label || 'Custom Field',
              fieldType: cf.fieldType || 'short_text',
              options: cf.options || [],
              value: cf.value || '',
              hidden: false,
              isCustom: true,
            });
          }
        });
      }

      setFields(mergedFields);
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSyncs = async () => {
    try {
      setLoadingSyncs(true);
      const { data } = await profileAPI.getPendingSyncs();
      const syncs = data?.syncs || [];
      setPendingSyncs(syncs);

      // Initialize syncEdits
      if (syncs.length > 0) {
        const active = syncs[0];
        const initial = {};
        (active.analysis || []).forEach(item => {
          initial[item.fieldId] = {
            action: item.status === 'identical' ? 'keep' : 'accept',
            value: item.suggestedValue || item.incomingValue,
          };
        });
        setSyncEdits(initial);
      }
    } catch (err) {
      console.warn('Failed to fetch pending syncs:', err);
    } finally {
      setLoadingSyncs(false);
    }
  };

  useEffect(() => {
    loadProfile();
    fetchPendingSyncs();
  }, []);

  // When user changes selected sync item
  const handleSelectSync = (idx) => {
    setSelectedSyncIndex(idx);
    const active = pendingSyncs[idx];
    if (active) {
      const initial = {};
      (active.analysis || []).forEach(item => {
        initial[item.fieldId] = {
          action: item.status === 'identical' ? 'keep' : 'accept',
          value: item.suggestedValue || item.incomingValue,
        };
      });
      setSyncEdits(initial);
    }
  };

  // Toggle field action (accept vs keep vs append)
  const handleSetFieldAction = (fieldId, action) => {
    setSyncEdits(prev => ({
      ...prev,
      [fieldId]: {
        ...(prev[fieldId] || {}),
        action,
      }
    }));
  };

  // Change suggested value manually before merging
  const handleSetFieldValue = (fieldId, value) => {
    setSyncEdits(prev => ({
      ...prev,
      [fieldId]: {
        ...(prev[fieldId] || {}),
        value,
      }
    }));
  };

  // Verify and merge approved extension fields into the database Profile Vault
  const handleVerifyAndMerge = async () => {
    const currentSync = pendingSyncs[selectedSyncIndex];
    if (!currentSync) return;

    const approvedFields = (currentSync.analysis || [])
      .map(item => {
        const edit = syncEdits[item.fieldId] || {};
        const action = edit.action !== undefined ? edit.action : item.action;
        const val = edit.value !== undefined ? edit.value : (item.suggestedValue || item.incomingValue);
        return {
          fieldId: item.fieldId,
          label: item.label,
          value: val,
          section: item.section,
          fieldType: item.fieldType,
          action,
        };
      })
      .filter(f => f.action !== 'keep');

    if (approvedFields.length === 0) {
      return toast.error('All fields are set to "Keep Current". Select at least one field to merge.');
    }

    setVerifyingSync(true);
    const toastId = toast.loading('Merging verified fields into your Profile Vault…');
    try {
      const { data } = await profileAPI.verifySync(currentSync._id, { approvedFields });
      toast.success(data.message || 'Profile Vault updated with verified data!', { id: toastId });

      // Refresh profile view and remaining sync queue
      await loadProfile();
      await fetchPendingSyncs();
      setSelectedSyncIndex(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to merge profile data', { id: toastId });
    } finally {
      setVerifyingSync(false);
    }
  };

  // Dismiss / reject staged extension capture
  const handleRejectSync = async () => {
    const currentSync = pendingSyncs[selectedSyncIndex];
    if (!currentSync) return;

    if (!window.confirm('Dismiss this incoming data submission without updating your Profile Vault?')) return;

    setDismissingSync(true);
    try {
      await profileAPI.rejectSync(currentSync._id);
      toast.success('Incoming extension data dismissed.');
      await fetchPendingSyncs();
      setSelectedSyncIndex(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dismiss');
    } finally {
      setDismissingSync(false);
    }
  };

  // Handle AI Text / Form Scanner
  const handleAnalyzeText = async (e) => {
    if (e) e.preventDefault();
    if (!importText.trim()) return toast.error('Paste form text or placement questions to analyze.');

    setAnalyzingText(true);
    const toastId = toast.loading('AI analyzing form text against Profile Vault…');
    try {
      const { data } = await profileAPI.analyzeText({ rawText: importText });
      toast.success(data.message || 'AI analysis complete! Review fields below.', { id: toastId });
      setShowImportModal(false);
      setImportText('');
      await fetchPendingSyncs();
      setSelectedSyncIndex(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze text with AI', { id: toastId });
    } finally {
      setAnalyzingText(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { fields };
      fields.forEach(f => {
        if (!f.isCustom && f.id) payload[f.id] = f.value;
      });

      const { data } = await profileAPI.update(payload);
      if (data?.fields?.length) {
        setFields(fields);
      }
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

  const handleOpenQuickEdit = (field) => {
    setQuickEditModal({
      ...field,
      optionsText: Array.isArray(field.options) ? field.options.join(', ') : '',
    });
  };

  const handleSaveQuickEdit = async () => {
    if (!quickEditModal) return;
    if (!quickEditModal.label.trim()) return toast.error('Field label is required');

    setQuickEditSaving(true);
    try {
      let parsedOptions = quickEditModal.options || [];
      if (quickEditModal.fieldType === 'select' && quickEditModal.optionsText !== undefined) {
        parsedOptions = quickEditModal.optionsText.split(',').map(s => s.trim()).filter(Boolean);
      }

      const updateData = {
        label: quickEditModal.label.trim(),
        value: quickEditModal.value !== undefined ? String(quickEditModal.value) : '',
        fieldType: quickEditModal.fieldType,
        options: parsedOptions,
        section: quickEditModal.section,
      };

      await profileAPI.updateField(quickEditModal.id, updateData);

      setFields(prev => prev.map(f => {
        if (f.id !== quickEditModal.id) return f;
        return {
          ...f,
          ...updateData,
        };
      }));

      toast.success(`Updated "${updateData.label}"`);
      setQuickEditModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update field');
    } finally {
      setQuickEditSaving(false);
    }
  };

  const handleDeleteField = async (fieldId, label) => {
    const confirmName = label || fieldId;
    if (!window.confirm(`Are you sure you want to delete "${confirmName}"? This field will be permanently removed.`)) {
      return;
    }

    try {
      await profileAPI.deleteField(fieldId);
      setFields(prev => prev.filter(f => f.id !== fieldId));
      setDeletedFieldIds(prev => prev.includes(fieldId) ? prev : [...prev, fieldId]);
      toast.success(`Deleted "${confirmName}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm('Restore all default profile fields that were removed?')) return;
    try {
      await profileAPI.restoreDefaults();
      toast.success('Default fields restored!');
      await loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore default fields');
    }
  };

  const handleHideField = (id) => {
    handleDeleteField(id, id);
  };

  const handleOpenAddField = (sectionKey) => {
    setAddingSection(sectionKey);
    setNewField({ label: '', fieldType: 'short_text', optionsText: 'Option 1, Option 2', value: '' });
  };

  const handleConfirmAddField = async () => {
    if (!newField.label.trim()) return toast.error('Enter field title');

    let parsedOptions = [];
    if (newField.fieldType === 'select' && newField.optionsText) {
      parsedOptions = newField.optionsText.split(',').map(s => s.trim()).filter(Boolean);
    }

    const fieldData = {
      section: addingSection || 'personal',
      label: newField.label.trim(),
      fieldType: newField.fieldType,
      options: parsedOptions,
      value: newField.value.trim() || (parsedOptions.length > 0 ? parsedOptions[0] : ''),
      isCustom: true,
      sensitive: false,
    };

    try {
      const { data } = await profileAPI.createField(fieldData);
      const createdField = data.field || fieldData;
      setFields(prev => [...prev, createdField]);
      setAddingSection(null);
      setNewField({ label: '', fieldType: 'short_text', optionsText: 'Option 1, Option 2', value: '' });
      toast.success(`Field "${fieldData.label}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create field');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const currentSync = pendingSyncs[selectedSyncIndex];

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', paddingBottom: 80, fontFamily: 'Manrope, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B1F3A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Student Profile Vault
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#667085' }}>
              Central intelligence repository for your academic credentials, test ratings, and placement autofill data.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              style={{
                background: '#FFFFFF',
                color: '#087F71',
                border: '1px solid #A3E5D9',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 1px 2px rgba(8, 127, 113, 0.06)'
              }}
            >
              <Sparkles size={14} /> AI Form Import
            </button>

            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  style={{
                    background: '#FFFFFF',
                    color: '#667085',
                    border: '1px solid #E5EAF0',
                    padding: '9px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: '#0B1F3A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {deletedFieldIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    style={{
                      background: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FCD34D',
                      padding: '9px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    title="Restore all default fields that were removed"
                  >
                    <RotateCcw size={13} /> Restore Defaults ({deletedFieldIds.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{
                    background: '#0B1F3A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  boxShadow: '0 2px 6px rgba(11, 31, 58, 0.15)'
                }}
              >
                <Edit size={14} /> Edit Vault
              </button>
            </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ── PENDING EXTENSION REVIEW SECTION (STAGING & USER VERIFICATION) ── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {pendingSyncs.length > 0 && currentSync && (
        <div
          style={{
            background: '#FFFFFF',
            border: '2px solid #2563EB',
            borderRadius: 14,
            padding: 24,
            marginBottom: 28,
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.1)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: '#EAF2FF', border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB'
              }}>
                <Puzzle size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0B1F3A' }}>
                    Incoming Data from {currentSync.source || 'Chrome Extension'}
                  </h3>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                    background: '#E8F8F5', color: '#0D7A6B', border: '1px solid rgba(24,183,160,0.4)',
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    ✨ New data is present (comes from extension)
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                    background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D'
                  }}>
                    {pendingSyncs.length} Submission{pendingSyncs.length > 1 ? 's' : ''} Queued
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: '#667085' }}>
                  Captured from <strong>{currentSync.formTitle || currentSync.formUrl || 'External Form'}</strong> • {new Date(currentSync.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* If multiple pending submissions */}
            {pendingSyncs.length > 1 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#667085' }}>Submission:</span>
                {pendingSyncs.map((s, idx) => (
                  <button
                    key={s._id}
                    onClick={() => handleSelectSync(idx)}
                    style={{
                      background: selectedSyncIndex === idx ? '#2563EB' : '#F1F5F9',
                      color: selectedSyncIndex === idx ? '#FFFFFF' : '#475569',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Merge Explanation Box */}
          <div style={{
            background: '#F8FAFD',
            border: '1px solid #E5EAF0',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Sparkles size={16} color="#2563EB" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#172033', lineHeight: 1.5 }}>
              <strong>AI Analysis & Suggestions:</strong> We detected <strong>{currentSync.analysis?.length || 0} candidate field(s)</strong> from this form. Review the suggested actions below. Once you verify and merge, your <strong>AI Vector Database index will update automatically</strong> so the Chrome extension can use the new values on future forms. Previous data will <strong>never</strong> be removed unless you explicitly choose to replace it.
            </span>
          </div>

          {/* Side-by-Side Verification Diff Table */}
          <div style={{
            border: '1px solid #E5EAF0',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2.5fr 2.5fr 2fr',
              background: '#F1F5F9',
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              borderBottom: '1px solid #E5EAF0',
            }}>
              <div>FIELD & SECTION</div>
              <div>CURRENT VAULT VALUE</div>
              <div>INCOMING FORM VALUE</div>
              <div style={{ textAlign: 'right' }}>VERIFICATION ACTION</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid #F1F5F9' }}>
              {(currentSync.analysis || []).map(item => {
                const edit = syncEdits[item.fieldId] || {};
                const currentAction = edit.action !== undefined ? edit.action : item.action;
                const activeVal = edit.value !== undefined ? edit.value : (item.suggestedValue || item.incomingValue);

                const isNew = item.status === 'new';
                const isUpdated = item.status === 'updated';
                const isIdentical = item.status === 'identical';

                return (
                  <div
                    key={item.fieldId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 2.5fr 2.5fr 2fr',
                      padding: '14px 16px',
                      background: currentAction === 'accept' ? '#FFFFFF' : '#F8FAFD',
                      borderBottom: '1px solid #F1F5F9',
                      alignItems: 'center',
                      gap: 12,
                      opacity: currentAction === 'keep' ? 0.65 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Column 1: Field & Section */}
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1F3A' }}>
                        {item.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {item.section?.replace('_', ' ')}
                        </span>
                        {isNew && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#E8F8F5', color: '#087F71' }}>
                            NEW FIELD
                          </span>
                        )}
                        {isUpdated && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                            UPDATED VALUE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Current Vault Value */}
                    <div>
                      {item.currentValue ? (
                        <div style={{ fontSize: 13, color: '#172033', fontWeight: 500, wordBreak: 'break-word' }}>
                          {item.currentValue}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, fontStyle: 'italic', color: '#98A2B3' }}>
                          (Empty in Vault)
                        </span>
                      )}
                    </div>

                    {/* Column 3: Incoming Form Value / Editable */}
                    <div>
                      <input
                        type="text"
                        value={activeVal}
                        onChange={e => handleSetFieldValue(item.fieldId, e.target.value)}
                        placeholder="Incoming value…"
                        style={{
                          width: '100%',
                          fontSize: 13,
                          fontWeight: 600,
                          color: currentAction === 'accept' ? '#087F71' : '#667085',
                          background: currentAction === 'accept' ? '#E8F8F5' : '#F1F5F9',
                          border: `1px solid ${currentAction === 'accept' ? '#A3E5D9' : '#E2E8F0'}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      {item.reason && (
                        <div style={{ fontSize: 11, color: '#667085', marginTop: 4 }}>
                          💡 {item.reason}
                        </div>
                      )}
                    </div>

                    {/* Column 4: Verification Action Toggles */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleSetFieldAction(item.fieldId, 'accept')}
                        style={{
                          background: currentAction === 'accept' ? '#087F71' : '#FFFFFF',
                          color: currentAction === 'accept' ? '#FFFFFF' : '#087F71',
                          border: `1px solid ${currentAction === 'accept' ? '#087F71' : '#A3E5D9'}`,
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Check size={12} /> Accept
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetFieldAction(item.fieldId, 'keep')}
                        style={{
                          background: currentAction === 'keep' ? '#64748B' : '#FFFFFF',
                          color: currentAction === 'keep' ? '#FFFFFF' : '#64748B',
                          border: `1px solid ${currentAction === 'keep' ? '#64748B' : '#E2E8F0'}`,
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Keep DB
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 12.5, color: '#667085' }}>
              Only fields marked with <strong style={{ color: '#087F71' }}>"Accept"</strong> will be saved to your active database profile.
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleRejectSync}
                disabled={dismissingSync || verifyingSync}
                style={{
                  background: '#FFFFFF',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <X size={14} /> Dismiss Submission
              </button>

              <button
                type="button"
                onClick={handleVerifyAndMerge}
                disabled={verifyingSync || dismissingSync}
                style={{
                  background: '#0B1F3A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(11, 31, 58, 0.2)'
                }}
              >
                <CheckCheck size={15} />
                {verifyingSync ? 'Merging…' : 'Verify & Save to Main Profile Vault'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner when no pending review */}
      {pendingSyncs.length === 0 && (
        <div
          style={{
            background: '#E8F8F5',
            borderLeft: '4px solid #18B7A0',
            padding: '16px 20px',
            borderRadius: 8,
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: '1px solid #D1F2EB'
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#087F71', textTransform: 'uppercase', marginBottom: 4 }}>
            ✦ VERIFIED DATA VAULT
          </span>
          <span style={{ fontSize: 13, color: '#172033', lineHeight: 1.5 }}>
            Your Profile Vault is up to date and verified. When you autofill Google Forms or company portals via the OppTrack Chrome Extension, these verified values are automatically populated.
          </span>
        </div>
      )}

      {/* Sections Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {SECTIONS.map(sec => {
          const sectionFields = fields.filter(f => f.section === sec.key && !f.hidden);

          return (
            <div
              key={sec.key}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5EAF0',
                borderRadius: 14,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                boxShadow: '0 1px 3px rgba(11,31,58,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F4F8', paddingBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                  {sec.title}
                </h2>

                <button
                  type="button"
                  onClick={() => handleOpenAddField(sec.key)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Plus size={13} /> Add Field
                </button>
              </div>

              {sectionFields.length === 0 && !editing && (
                <div style={{ fontSize: 13, color: '#98A2B3', fontStyle: 'italic' }}>
                  No fields populated in this section yet. Click "+ Add Field" to create one.
                </div>
              )}

              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sectionFields.map(field => (
                    <div
                      key={field.id}
                      style={{
                        background: '#F8FAFD',
                        padding: 16,
                        borderRadius: 8,
                        border: '1px solid #E5EAF0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#172033' }}>
                            {field.label}
                          </span>
                          {field.isCustom && (
                            <span style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: '#EEF2FF',
                              color: '#4F46E5',
                              border: '1px solid #C7D2FE',
                            }}>
                              Custom
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickEdit(field)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              borderRadius: 5,
                              padding: '3px 8px',
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="Edit field settings"
                          >
                            <Edit size={12} /> Config
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id, field.label)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              borderRadius: 5,
                              padding: '3px 8px',
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title={`Delete field "${field.label}"`}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>

                      {field.fieldType === 'select' ? (
                        <select
                          value={field.value || ''}
                          onChange={e => handleUpdateField(field.id, 'value', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: 13,
                            background: '#FFFFFF',
                            outline: 'none',
                          }}
                        >
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.fieldType === 'paragraph' ? (
                        <textarea
                          rows={3}
                          value={field.value || ''}
                          onChange={e => handleUpdateField(field.id, 'value', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: 13,
                            background: '#FFFFFF',
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.value || ''}
                          onChange={e => handleUpdateField(field.id, 'value', e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: 13,
                            background: '#FFFFFF',
                            outline: 'none',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px 28px' }}>
                  {sectionFields.map(field => (
                    <VaultField
                      key={field.id}
                      field={field}
                      onEdit={handleOpenQuickEdit}
                      onDelete={handleDeleteField}
                      isMonospace={field.id === 'prn' || field.id === 'cgpa'}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── QUICK EDIT FIELD MODAL ── */}
      {quickEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 31, 58, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => !quickEditSaving && setQuickEditModal(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 40px rgba(11, 31, 58, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={16} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1F3A' }}>
                  Edit Field: {quickEditModal.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#667085', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#667085', display: 'block', marginBottom: 4 }}>
                  Field Label / Title
                </label>
                <input
                  type="text"
                  value={quickEditModal.label}
                  onChange={e => setQuickEditModal(prev => ({ ...prev, label: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#667085', display: 'block', marginBottom: 4 }}>
                  Field Value
                </label>
                {quickEditModal.fieldType === 'paragraph' ? (
                  <textarea
                    rows={4}
                    value={quickEditModal.value || ''}
                    onChange={e => setQuickEditModal(prev => ({ ...prev, value: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                ) : quickEditModal.fieldType === 'select' ? (
                  <div>
                    <select
                      value={quickEditModal.value || ''}
                      onChange={e => setQuickEditModal(prev => ({ ...prev, value: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF', boxSizing: 'border-box', marginBottom: 8 }}
                    >
                      {(quickEditModal.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>
                      Dropdown Options (comma separated)
                    </label>
                    <input
                      type="text"
                      value={quickEditModal.optionsText || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const opts = val.split(',').map(s => s.trim()).filter(Boolean);
                        setQuickEditModal(prev => ({ ...prev, optionsText: val, options: opts }));
                      }}
                      placeholder="Option 1, Option 2, Option 3"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={quickEditModal.value || ''}
                    onChange={e => setQuickEditModal(prev => ({ ...prev, value: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#667085', display: 'block', marginBottom: 4 }}>
                    Field Type
                  </label>
                  <select
                    value={quickEditModal.fieldType}
                    onChange={e => setQuickEditModal(prev => ({ ...prev, fieldType: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, background: '#FFFFFF', boxSizing: 'border-box' }}
                  >
                    {FIELD_TYPES.map(ft => (
                      <option key={ft.key} value={ft.key}>{ft.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#667085', display: 'block', marginBottom: 4 }}>
                    Section
                  </label>
                  <select
                    value={quickEditModal.section}
                    onChange={e => setQuickEditModal(prev => ({ ...prev, section: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, background: '#FFFFFF', boxSizing: 'border-box' }}
                  >
                    {SECTIONS.map(s => (
                      <option key={s.key} value={s.key}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
              <button
                type="button"
                onClick={() => {
                  const id = quickEditModal.id;
                  const lbl = quickEditModal.label;
                  setQuickEditModal(null);
                  handleDeleteField(id, lbl);
                }}
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  padding: '7px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Trash2 size={13} /> Delete Field
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setQuickEditModal(null)}
                  disabled={quickEditSaving}
                  style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', padding: '8px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: '#667085', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickEdit}
                  disabled={quickEditSaving}
                  style={{
                    background: '#0B1F3A',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    cursor: quickEditSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Save size={13} />
                  {quickEditSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CUSTOM FIELD MODAL ── */}
      {addingSection && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 31, 58, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setAddingSection(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 20px 40px rgba(11, 31, 58, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0B1F3A' }}>
              Add Custom Profile Field
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#667085', display: 'block', marginBottom: 4 }}>
                  Field Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master's Thesis Topic"
                  value={newField.label}
                  onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#667085', display: 'block', marginBottom: 4 }}>
                  Field Type
                </label>
                <select
                  value={newField.fieldType}
                  onChange={e => setNewField(f => ({ ...f, fieldType: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF' }}
                >
                  {FIELD_TYPES.map(ft => (
                    <option key={ft.key} value={ft.key}>{ft.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#667085', display: 'block', marginBottom: 4 }}>
                  Initial Value
                </label>
                <input
                  type="text"
                  placeholder="Enter initial value…"
                  value={newField.value}
                  onChange={e => setNewField(f => ({ ...f, value: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setAddingSection(null)}
                style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', padding: '7px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: '#667085', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddField}
                style={{ background: '#0B1F3A', border: 'none', padding: '7px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI FORM IMPORT MODAL ── */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 31, 58, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 540,
              boxShadow: '0 20px 40px rgba(11, 31, 58, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#087F71" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1F3A' }}>
                  Analyze External Form or Text with AI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#667085', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#667085', lineHeight: 1.5 }}>
              Paste questions or filled values from any company placement portal, Google Form, or resume snippet. AI will extract candidate fields and stage them for your verification before adding to your Profile Vault.
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste application form fields, questions, or resume details here (e.g. Name: John Doe, CGPA: 8.6, LeetCode: leetcode.com/u/john)..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', padding: '8px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: '#667085', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnalyzeText}
                disabled={analyzingText || !importText.trim()}
                style={{
                  background: '#0B1F3A',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: analyzingText || !importText.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Sparkles size={14} />
                {analyzingText ? 'AI Analyzing…' : 'Extract & Stage Fields'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
