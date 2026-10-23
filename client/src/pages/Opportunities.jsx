import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { opportunityAPI, gmailAPI, settingsAPI } from '../api';
import DeadlineBadge from '../components/DeadlineBadge';
import Pagination from '../components/Pagination';
import MissingKeyModal from '../components/MissingKeyModal';
import { 
  Plus, Search, Trash2, Eye, Sparkles, Wand2, CalendarDays, X, Filter, 
  Mail, Check, ExternalLink, RefreshCw, AlertTriangle, Clock, CheckCircle2, 
  ChevronDown, ChevronUp, Edit3, Building2, Briefcase, GraduationCap, Zap, ArrowRight,
  Copy, FileText, CheckCheck, Save, KeyRound, MapPin, DollarSign, Calendar,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const parseNumericCompensation = (str) => {
  if (!str) return 0;
  const s = String(str).toLowerCase().replace(/,/g, '');
  const numMatch = s.match(/[\d.]+/);
  if (!numMatch) return 0;
  let val = parseFloat(numMatch[0]);
  if (s.includes('lpa') || s.includes('lac') || s.includes('lakh')) {
    val *= 100000;
  } else if (s.includes('k')) {
    val *= 1000;
  } else if (s.includes('month') || s.includes('pm') || s.includes('stipend')) {
    val *= 12;
  }
  return val;
};

const STATUS_ORDER = {
  not_applied: 1,
  applied: 2,
  oa: 3,
  interview: 4,
  hr: 5,
  offer: 6,
  rejected: 7,
};

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
  const [allOpps, setAllOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    search: '', 
    status: '', 
    employmentType: '', 
    sortBy: 'newest', 
    sortOrder: 'desc' 
  });
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

  // User Settings & API Key state
  const [userSettings, setUserSettings] = useState({ llmApiKey: '' });
  const [hasApiKey, setHasApiKey] = useState(true);

  // Email Body expanded states & Auto update edit states
  const [showEmailBody, setShowEmailBody] = useState({});
  const [editingAutoUpdateId, setEditingAutoUpdateId] = useState(null);
  const [autoUpdateEdits, setAutoUpdateEdits] = useState({});
  const [showAutoEmail, setShowAutoEmail] = useState({});
  const [updatingAutoId, setUpdatingAutoId] = useState(null);
  const [deletingAutoId, setDeletingAutoId] = useState(null);

  // Pending Review Filters & Sort
  const [pendingDateFilter, setPendingDateFilter] = useState('all');
  const [pendingTypeFilter, setPendingTypeFilter] = useState('');
  const [pendingBranchFilter, setPendingBranchFilter] = useState('');
  const [pendingEligibilityFilter, setPendingEligibilityFilter] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSortBy, setPendingSortBy] = useState('receivedAt');
  const [pendingSortOrder, setPendingSortOrder] = useState('desc');

  // ─── Pagination states ───────────────────────────────────────────────────
  const [trackedPage, setTrackedPage] = useState(1);
  const [trackedPageSize, setTrackedPageSize] = useState(10);

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);

  const [autoUpdatePage, setAutoUpdatePage] = useState(1);
  const [autoUpdatePageSize, setAutoUpdatePageSize] = useState(5);

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

  // Filtered & Sorted Tracked Opportunities
  const filteredOpps = useMemo(() => {
    return allOpps.filter(opp => {
      // 1. Search filter
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const c = (opp.company || '').toLowerCase();
        const r = (opp.role || '').toLowerCase();
        const l = (opp.location || '').toLowerCase();
        const pay = (getOppPay(opp) || '').toLowerCase();
        const notes = (opp.notes || '').toLowerCase();
        if (!c.includes(q) && !r.includes(q) && !l.includes(q) && !pay.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      // 2. Status filter
      if (filters.status) {
        const oppStatus = (opp.status || 'not_applied').toLowerCase();
        if (oppStatus !== filters.status.toLowerCase()) {
          return false;
        }
      }

      // 3. Employment Type filter
      if (filters.employmentType) {
        const oppType = (opp.employmentType || 'placement').toLowerCase();
        if (!oppType.includes(filters.employmentType.toLowerCase())) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let diff = 0;
      const order = filters.sortOrder === 'asc' ? 1 : -1;

      switch (filters.sortBy) {
        case 'company':
          diff = (a.company || '').localeCompare(b.company || '', undefined, { sensitivity: 'base' });
          break;
        case 'role':
          diff = (a.role || '').localeCompare(b.role || '', undefined, { sensitivity: 'base' });
          break;
        case 'deadline': {
          const dlA = getOppDeadline(a);
          const dlB = getOppDeadline(b);
          const tA = dlA ? new Date(dlA).getTime() : (filters.sortOrder === 'asc' ? 9999999999999 : -1);
          const tB = dlB ? new Date(dlB).getTime() : (filters.sortOrder === 'asc' ? 9999999999999 : -1);
          diff = tA - tB;
          break;
        }
        case 'compensation':
        case 'ctc':
          diff = parseNumericCompensation(getOppPay(a)) - parseNumericCompensation(getOppPay(b));
          break;
        case 'status':
          diff = (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0);
          break;
        case 'newest':
        case 'date':
        default: {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          diff = tA - tB;
          break;
        }
      }

      return diff * order;
    });
  }, [allOpps, filters]);

  // Tracked Opportunities pagination
  const paginatedOpps = useMemo(() => {
    const start = (trackedPage - 1) * trackedPageSize;
    return filteredOpps.slice(start, start + trackedPageSize);
  }, [filteredOpps, trackedPage, trackedPageSize]);

  // Reset trackedPage if filters change
  useEffect(() => {
    setTrackedPage(1);
  }, [filters]);

  // Adjust trackedPage if opps shrink
  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(filteredOpps.length / trackedPageSize));
    if (trackedPage > maxP) setTrackedPage(maxP);
  }, [filteredOpps.length, trackedPageSize, trackedPage]);

  // Handle table column header sorting
  const handleColumnSort = (columnKey) => {
    setFilters(f => {
      if (f.sortBy === columnKey) {
        return { ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      return { 
        ...f, 
        sortBy: columnKey, 
        sortOrder: columnKey === 'deadline' || columnKey === 'newest' ? 'desc' : 'asc' 
      };
    });
  };

  // Filtered Pending Review items
  const filteredPending = useMemo(() => {
    return pendingItems.filter(item => {
      const ext = item.extractionResult?.extractedFields || {};
      const edits = pendingEdits[item._id] || {};
      const empType = (edits.employmentType || ext.employmentType || 'placement').toLowerCase();
      const elig = item.extractionResult?.eligibility;
      const dup = item.duplicateWarning;

      // Search filter
      if (pendingSearch.trim()) {
        const query = pendingSearch.toLowerCase().trim();
        const comp = (edits.company || ext.company || '').toLowerCase();
        const role = (edits.role || ext.role || '').toLowerCase();
        const loc = (edits.location || ext.location || '').toLowerCase();
        const snippet = (item.rawEmailSnippet || '').toLowerCase();
        const subj = (item.subject || '').toLowerCase();
        if (!comp.includes(query) && !role.includes(query) && !loc.includes(query) && !snippet.includes(query) && !subj.includes(query)) {
          return false;
        }
      }

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

      // Eligibility filter
      if (pendingEligibilityFilter) {
        if (pendingEligibilityFilter === 'duplicate') {
          if (!dup?.isDuplicate) return false;
        } else if (elig?.status !== pendingEligibilityFilter) {
          return false;
        }
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
    }).sort((a, b) => {
      let diff = 0;
      const order = pendingSortOrder === 'asc' ? 1 : -1;
      const extA = a.extractionResult?.extractedFields || {};
      const extB = b.extractionResult?.extractedFields || {};
      const editsA = pendingEdits[a._id] || {};
      const editsB = pendingEdits[b._id] || {};

      switch (pendingSortBy) {
        case 'company': {
          const cA = editsA.company || extA.company || '';
          const cB = editsB.company || extB.company || '';
          diff = cA.localeCompare(cB, undefined, { sensitivity: 'base' });
          break;
        }
        case 'deadline': {
          const dA = editsA.deadline || extA.deadline;
          const dB = editsB.deadline || extB.deadline;
          const tA = dA ? new Date(dA).getTime() : (pendingSortOrder === 'asc' ? 9999999999999 : -1);
          const tB = dB ? new Date(dB).getTime() : (pendingSortOrder === 'asc' ? 9999999999999 : -1);
          diff = tA - tB;
          break;
        }
        case 'pay': {
          const pA = editsA.ctc || editsA.stipend || extA.ctc || extA.stipend || '';
          const pB = editsB.ctc || editsB.stipend || extB.ctc || extB.stipend || '';
          diff = parseNumericCompensation(pA) - parseNumericCompensation(pB);
          break;
        }
        case 'receivedAt':
        default: {
          const tA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
          const tB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
          diff = tA - tB;
          break;
        }
      }

      return diff * order;
    });
  }, [pendingItems, pendingEdits, pendingSearch, pendingTypeFilter, pendingBranchFilter, pendingEligibilityFilter, pendingDateFilter, pendingSortBy, pendingSortOrder]);

  // Paginated Pending Review items
  const paginatedPending = useMemo(() => {
    const start = (pendingPage - 1) * pendingPageSize;
    return filteredPending.slice(start, start + pendingPageSize);
  }, [filteredPending, pendingPage, pendingPageSize]);

  // Adjust pendingPage if list shrinks
  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(filteredPending.length / pendingPageSize));
    if (pendingPage > maxP) setPendingPage(maxP);
  }, [filteredPending.length, pendingPageSize, pendingPage]);

  // Paginated Auto Updates
  const paginatedAutoUpdates = useMemo(() => {
    const start = (autoUpdatePage - 1) * autoUpdatePageSize;
    return autoUpdates.slice(start, start + autoUpdatePageSize);
  }, [autoUpdates, autoUpdatePage, autoUpdatePageSize]);

  // AI Follow-up Update modal state
  const [activeAiOpp, setActiveAiOpp] = useState(null);
  const [followUpText, setFollowUpText] = useState('');
  const [aiUpdating, setAiUpdating] = useState(false);
  const [changesSummary, setChangesSummary] = useState(null);
  const [keyModal, setKeyModal] = useState({ isOpen: false, keyType: 'AI', message: '' });

  const fetchSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setUserSettings(data || {});
      setHasApiKey(Boolean(data?.llmApiKey?.trim()));
    } catch (err) {
      console.warn('Failed to load user settings:', err);
    }
  };

  const fetchOpps = async () => {
    setLoading(true);
    try {
      const { data } = await opportunityAPI.list({});
      const rawList = Array.isArray(data) ? data : (data?.opportunities || []);
      setAllOpps(rawList);
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
      const pList = Array.isArray(pendingRes.data) ? pendingRes.data : (pendingRes.data?.items || []);
      const uList = Array.isArray(updatesRes.data) ? updatesRes.data : (updatesRes.data?.updates || []);
      setPendingItems(pList);
      setAutoUpdates(uList);

      // Initialize edit fields for pending items
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
          driveDate: ext.driveDate ? ext.driveDate.substring(0, 16) : '',
          interviewDate: ext.interviewDate ? ext.interviewDate.substring(0, 16) : '',
          shortlistInfo: ext.shortlistInfo || '',
          minCGPA: ext.eligibility?.minCGPA != null ? String(ext.eligibility.minCGPA) : '',
          allowedBranches: Array.isArray(ext.eligibility?.allowedBranches)
            ? ext.eligibility.allowedBranches.join(', ')
            : (typeof ext.eligibility?.allowedBranches === 'string' ? ext.eligibility.allowedBranches : ''),
          links: Array.isArray(ext.links)
            ? ext.links.map(l => typeof l === 'string' ? l : l?.url || '').filter(Boolean).join(', ')
            : (typeof ext.links === 'string' ? ext.links : ''),
        };
      });
      setPendingEdits(edits);

      // Initialize edit fields for auto updates
      const aEdits = {};
      (updatesRes.data || []).forEach(u => {
        const opp = u.opportunityId || {};
        aEdits[u._id] = {
          status: opp.status || 'applied',
          testDate: opp.testDate ? opp.testDate.substring(0, 16) : '',
          driveDate: opp.driveDate ? opp.driveDate.substring(0, 16) : '',
          interviewDate: opp.interviewDate ? opp.interviewDate.substring(0, 16) : '',
          deadline: opp.deadline ? opp.deadline.substring(0, 16) : '',
          shortlistInfo: opp.shortlistInfo || '',
        };
      });
      setAutoUpdateEdits(aEdits);
    } catch (err) {
      console.warn('Failed to load pending reviews:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchOpps();
    fetchPending();
  }, []);

  const handleSyncGmail = async () => {
    if (!hasApiKey) {
      setKeyModal({
        isOpen: true,
        keyType: 'AI',
        message: 'Please enter your API key to automatically extract job details, dates, and packages during Gmail sync.',
      });
      return;
    }
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

  const handleRemoveAutoUpdate = async (id) => {
    if (!window.confirm('Remove this auto-update suggestion from the list?')) return;
    setDeletingAutoId(id);
    try {
      await gmailAPI.dismissAutoUpdate(id);
      toast.success('Suggestion removed');
      setAutoUpdates(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove suggestion');
    } finally {
      setDeletingAutoId(null);
    }
  };

  const handleSaveAutoUpdate = async (u) => {
    setUpdatingAutoId(u._id);
    const toastId = toast.loading('Saving updates to opportunity…');
    try {
      const editData = autoUpdateEdits[u._id] || {};
      const payload = {
        status: editData.status,
        testDate: editData.testDate || null,
        driveDate: editData.driveDate || null,
        interviewDate: editData.interviewDate || null,
        deadline: editData.deadline || null,
        shortlistInfo: editData.shortlistInfo || null,
      };
      await gmailAPI.updateAutoUpdate(u._id, payload);
      toast.success('Opportunity updated successfully!', { id: toastId });
      setEditingAutoUpdateId(null);
      await fetchPending();
      await fetchOpps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update suggestion', { id: toastId });
    } finally {
      setUpdatingAutoId(null);
    }
  };

  const handleReExtract = async (id) => {
    if (!hasApiKey) {
      setKeyModal({
        isOpen: true,
        keyType: 'AI',
        message: 'Please enter your API key to extract important details with AI.',
      });
      return;
    }
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
          driveDate: ext.driveDate ? ext.driveDate.substring(0, 16) : '',
          interviewDate: ext.interviewDate ? ext.interviewDate.substring(0, 16) : '',
          shortlistInfo: ext.shortlistInfo || '',
          minCGPA: ext.eligibility?.minCGPA != null ? String(ext.eligibility.minCGPA) : '',
          allowedBranches: Array.isArray(ext.eligibility?.allowedBranches)
            ? ext.eligibility.allowedBranches.join(', ')
            : (typeof ext.eligibility?.allowedBranches === 'string' ? ext.eligibility.allowedBranches : ''),
          links: Array.isArray(ext.links)
            ? ext.links.map(l => typeof l === 'string' ? l : l?.url || '').filter(Boolean).join(', ')
            : (typeof ext.links === 'string' ? ext.links : ''),
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
        branchesArr = editData.allowedBranches.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
      }

      let linksArr = ext.links || [];
      if (editData.links) {
        linksArr = editData.links.split(/[,;\s]+/).map(u => u.trim()).filter(Boolean).map(url => ({ url, label: 'Registration Link' }));
      }

      const payload = {
        company: (editData.company || ext.company || 'New Opportunity').trim(),
        role: (editData.role || ext.role || 'Graduate Trainee').trim(),
        ctc: editData.ctc || ext.ctc || null,
        stipend: editData.stipend || ext.stipend || null,
        ppo: editData.ppo || ext.ppo || null,
        employmentType: editData.employmentType || ext.employmentType || 'placement',
        location: editData.location || ext.location || null,
        deadline: editData.deadline || ext.deadline || null,
        testDate: editData.testDate || ext.testDate || null,
        driveDate: editData.driveDate || ext.driveDate || null,
        interviewDate: editData.interviewDate || ext.interviewDate || null,
        shortlistInfo: editData.shortlistInfo || ext.shortlistInfo || null,
        links: linksArr,
        eligibility: {
          ...(ext.eligibility || {}),
          allowedBranches: branchesArr,
          minCGPA: editData.minCGPA ? Number(editData.minCGPA) : ext.eligibility?.minCGPA || null,
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

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Opportunities
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
            {allOpps.length} placement & internship opportunities tracked
          </p>
        </div>

        <Link
          to="/opportunities/new"
          style={{
            background: 'var(--primary-brand)',
            color: '#FFFFFF',
            fontSize: 13.5,
            fontWeight: 600,
            padding: '9px 18px',
            textDecoration: 'none',
            borderRadius: 6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 2px 8px var(--primary-brand-glow)',
            transition: 'background 0.15s ease'
          }}
        >
          <Plus size={16} /> Add Opportunity
        </Link>
      </header>

      {/* Primary View Switcher: Tracked Opportunities vs Pending Review */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setViewTab('tracked')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: viewTab === 'tracked' ? 'var(--primary-brand-light)' : 'transparent',
              color: viewTab === 'tracked' ? 'var(--primary-brand-text)' : 'var(--text-secondary)',
              border: viewTab === 'tracked' ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            <CalendarDays size={15} color={viewTab === 'tracked' ? 'var(--primary-brand)' : 'currentColor'} />
            Tracked Opportunities ({allOpps.length})
          </button>

          <button
            onClick={() => setViewTab('pending')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: viewTab === 'pending' ? 'var(--danger-bg)' : 'transparent',
              color: viewTab === 'pending' ? 'var(--danger)' : 'var(--text-secondary)',
              border: viewTab === 'pending' ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            <Mail size={15} color={viewTab === 'pending' ? 'var(--danger)' : 'currentColor'} />
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
              background: 'rgba(220, 53, 69, 0.12)', border: '1px solid rgba(220, 53, 69, 0.25)',
              color: 'var(--danger, #DC3545)', padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
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
          {/* Missing API Key Warning Banner */}
          {!hasApiKey && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderLeft: '4px solid #F59E0B',
              borderRadius: 10,
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              boxShadow: '0 1px 3px rgba(245, 158, 11, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={20} color="#F59E0B" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Please enter your API key to enable AI extraction
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    An LLM API key (Groq, Gemini, OpenAI, etc.) is required to parse company details, packages, drive dates, and eligibility from incoming Gmail emails.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setKeyModal({
                  isOpen: true,
                  keyType: 'AI',
                  message: 'Please enter your API key to automatically parse emails and extract important job details.',
                })}
                style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)',
                }}
              >
                <KeyRound size={14} /> Enter API Key
              </button>
            </div>
          )}

          {/* Top Control & Filter Bar for Pending Review */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
            padding: 16, marginBottom: 20, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Filter & Categorize Incoming Emails
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                  ({pendingItems.length} pending review)
                </span>
              </div>

              {/* Date Filter Pills */}
              <div style={{ display: 'flex', background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, gap: 3 }}>
                {PENDING_DATE_FILTERS.map(df => (
                  <button
                    key={df.key}
                    type="button"
                    onClick={() => { setPendingDateFilter(df.key); setPendingPage(1); }}
                    style={{
                      background: pendingDateFilter === df.key ? 'var(--surface)' : 'transparent',
                      color: pendingDateFilter === df.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: pendingDateFilter === df.key ? '1px solid var(--border)' : '1px solid transparent',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: pendingDateFilter === df.key ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: pendingDateFilter === df.key ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {df.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category & Branch Selectors + Search */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Quick Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', flex: '1 1 200px' }}>
                <Search size={13} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Filter pending by company, role, or text..."
                  value={pendingSearch}
                  onChange={e => { setPendingSearch(e.target.value); setPendingPage(1); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: '100%', fontFamily: 'inherit' }}
                />
                {pendingSearch && (
                  <button
                    type="button"
                    onClick={() => { setPendingSearch(''); setPendingPage(1); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px' }}>
                <Briefcase size={13} color="var(--text-muted)" />
                <select
                  value={pendingTypeFilter}
                  onChange={e => { setPendingTypeFilter(e.target.value); setPendingPage(1); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>All Opportunity Types</option>
                  <option value="placement" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Placements Only</option>
                  <option value="internship" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Internships Only</option>
                  <option value="internship+ppo" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Internship + PPO</option>
                  <option value="off-campus" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Off-Campus</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px' }}>
                <GraduationCap size={13} color="var(--text-muted)" />
                <select
                  value={pendingBranchFilter}
                  onChange={e => { setPendingBranchFilter(e.target.value); setPendingPage(1); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {BRANCH_FILTERS.map(bf => (
                    <option key={bf.key} value={bf.key} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>{bf.label}</option>
                  ))}
                </select>
              </div>

              {/* Eligibility Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px' }}>
                <CheckCircle2 size={13} color="var(--text-muted)" />
                <select
                  value={pendingEligibilityFilter}
                  onChange={e => { setPendingEligibilityFilter(e.target.value); setPendingPage(1); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>All Eligibility</option>
                  <option value="eligible" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Eligible Only</option>
                  <option value="not_eligible" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Not Eligible</option>
                  <option value="review_needed" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Review Needed</option>
                  <option value="duplicate" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Duplicate Warnings</option>
                </select>
              </div>

              {/* Sort By */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px' }}>
                <ArrowUpDown size={13} color="var(--text-muted)" />
                <select
                  value={pendingSortBy}
                  onChange={e => { setPendingSortBy(e.target.value); setPendingPage(1); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="receivedAt" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Received Date</option>
                  <option value="company" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Company Name</option>
                  <option value="deadline" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Deadline Date</option>
                  <option value="pay" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: CTC / Stipend</option>
                </select>
              </div>

              {/* Ascending / Descending Toggle */}
              <button
                type="button"
                onClick={() => setPendingSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                title={`Current order: ${pendingSortOrder === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'var(--card-subtle)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '6px 11px',
                  color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                {pendingSortOrder === 'asc' ? <ArrowUp size={13} color="var(--primary-brand)" /> : <ArrowDown size={13} color="var(--primary-brand)" />}
                <span>{pendingSortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
              </button>

              {(pendingDateFilter !== 'all' || pendingTypeFilter || pendingBranchFilter || pendingEligibilityFilter || pendingSearch || pendingSortBy !== 'receivedAt' || pendingSortOrder !== 'desc') && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingDateFilter('all');
                    setPendingTypeFilter('');
                    setPendingBranchFilter('');
                    setPendingEligibilityFilter('');
                    setPendingSearch('');
                    setPendingSortBy('receivedAt');
                    setPendingSortOrder('desc');
                    setPendingPage(1);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger, #DC3545)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Recent Automatic Updates from Gmail Section */}
          {autoUpdates.length > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid #10B981',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 20,
              boxShadow: '0 1px 4px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: showAutoUpdates ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={14} />
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Auto-Updated Jobs from Gmail ({autoUpdates.length})
                    </h4>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      Updates detected from emails. You can review, update, or remove any suggestion here.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAutoUpdates(!showAutoUpdates)}
                  style={{ background: 'transparent', border: 'none', color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {showAutoUpdates ? 'Hide Auto-Updates' : 'Show Auto-Updates'}
                  {showAutoUpdates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {showAutoUpdates && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {paginatedAutoUpdates.map(u => {
                    const opp = u.opportunityId || {};
                    const details = u.autoUpdateDetails || {};
                    const changes = details.changesSummary || [];
                    const isEditing = editingAutoUpdateId === u._id;
                    const aEdit = autoUpdateEdits[u._id] || {};
                    const isEmailOpen = Boolean(showAutoEmail[u._id]);

                    return (
                      <div
                        key={u._id}
                        style={{
                          background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 8,
                          padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                                {details.existingCompany || opp.company || 'Job Record'}
                              </strong>
                              {opp.role && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>• {opp.role}</span>}
                              <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                                Auto-Suggested
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {new Date(u.receivedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>Changes:</strong> {changes.length > 0 ? changes.join(' | ') : 'Drive/Shortlist details synchronized'}
                            </div>
                          </div>

                          {/* Action Buttons: View Email, Update Suggestion, Remove, View Opportunity */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setShowAutoEmail(prev => ({ ...prev, [u._id]: !prev[u._id] }))}
                              style={{
                                background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                                padding: '5px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <FileText size={12} /> {isEmailOpen ? 'Hide Email' : 'View Email'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingAutoUpdateId(isEditing ? null : u._id)}
                              style={{
                                background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', color: '#0284C7',
                                padding: '5px 11px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Edit3 size={12} /> {isEditing ? 'Cancel Edit' : 'Update Suggestion'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveAutoUpdate(u._id)}
                              disabled={deletingAutoId === u._id}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger, #DC3545)',
                                padding: '5px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Trash2 size={12} /> {deletingAutoId === u._id ? 'Removing…' : 'Remove'}
                            </button>

                            {opp._id && (
                              <Link
                                to={`/opportunities/${opp._id}`}
                                style={{
                                  background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                                  padding: '5px 11px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
                                }}
                              >
                                View Opportunity <ArrowRight size={12} />
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Raw Email Display for Auto-Update */}
                        {isEmailOpen && (
                          <div style={{
                            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
                            padding: 12, marginTop: 4
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                Original Email: {u.subject} (From: {u.from})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(u.rawText || '');
                                  toast.success('Email copied!');
                                }}
                                style={{
                                  background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 4,
                                  padding: '2px 7px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Copy size={11} /> Copy
                              </button>
                            </div>
                            <div style={{
                              whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5,
                              maxHeight: 200, overflowY: 'auto', background: 'var(--card-subtle)', padding: 10, borderRadius: 4, border: '1px solid var(--border)'
                            }}>
                              {u.rawText || 'No email content available.'}
                            </div>
                          </div>
                        )}

                        {/* Inline Edit Form for Auto-Update */}
                        {isEditing && (
                          <div style={{
                            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                            padding: 14, marginTop: 4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10
                          }}>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                Status
                              </label>
                              <select
                                value={aEdit.status || 'applied'}
                                onChange={e => setAutoUpdateEdits(ae => ({ ...ae, [u._id]: { ...ae[u._id], status: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                              >
                                <option value="not_applied" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Not Applied</option>
                                <option value="applied" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Applied</option>
                                <option value="oa" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>OA / Test</option>
                                <option value="interview" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Interview</option>
                                <option value="hr" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>HR Round</option>
                                <option value="offer" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Offer Received</option>
                                <option value="rejected" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Rejected</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                OA / Test Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                value={aEdit.testDate || ''}
                                onChange={e => setAutoUpdateEdits(ae => ({ ...ae, [u._id]: { ...ae[u._id], testDate: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                Campus Drive Date
                              </label>
                              <input
                                type="date"
                                value={aEdit.driveDate ? aEdit.driveDate.substring(0, 10) : ''}
                                onChange={e => setAutoUpdateEdits(ae => ({ ...ae, [u._id]: { ...ae[u._id], driveDate: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                Interview Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                value={aEdit.interviewDate || ''}
                                onChange={e => setAutoUpdateEdits(ae => ({ ...ae, [u._id]: { ...ae[u._id], interviewDate: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                Application Deadline
                              </label>
                              <input
                                type="datetime-local"
                                value={aEdit.deadline || ''}
                                onChange={e => setAutoUpdateEdits(ae => ({ ...ae, [u._id]: { ...ae[u._id], deadline: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                Shortlist / Results Note
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 15 candidates shortlisted"
                                value={aEdit.shortlistInfo || ''}
                                onChange={e => setAutoUpdateEdits(ae => ({ ...ae, [u._id]: { ...ae[u._id], shortlistInfo: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
                              />
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => setEditingAutoUpdateId(null)}
                                style={{
                                  background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveAutoUpdate(u)}
                                disabled={updatingAutoId === u._id}
                                style={{
                                  background: '#10B981', color: '#FFFFFF', border: 'none',
                                  padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                                }}
                              >
                                <Save size={13} /> {updatingAutoId === u._id ? 'Saving…' : 'Save Suggestion Updates'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {autoUpdates.length > autoUpdatePageSize && (
                    <Pagination
                      currentPage={autoUpdatePage}
                      totalItems={autoUpdates.length}
                      pageSize={autoUpdatePageSize}
                      onPageChange={setAutoUpdatePage}
                      onPageSizeChange={setAutoUpdatePageSize}
                      pageSizeOptions={[5, 10, 20]}
                      itemName="auto-update suggestions"
                      accentColor="#10B981"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pending Items List */}
          {loadingPending ? (
            <div className="loading-center" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : pendingItems.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 12,
              padding: 48, textAlign: 'center'
            }}>
              <Mail size={36} color="var(--danger, #DC3545)" style={{ marginBottom: 14, opacity: 0.8 }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: 'var(--text-primary)', fontWeight: 700 }}>No Pending Emails to Review</h3>
              <p style={{ margin: '0 auto 20px auto', fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 460, lineHeight: 1.5 }}>
                When your trusted placement senders email you about new drives or internships, they will be automatically fetched, parsed via AI, and queued here for your confirmation.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={handleSyncGmail}
                  disabled={syncingGmail}
                  style={{
                    background: 'var(--primary-brand)', color: '#fff', border: 'none', padding: '9px 18px',
                    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  <RefreshCw size={14} className={syncingGmail ? 'spin' : ''} /> Check Gmail Now
                </button>
                <Link
                  to="/settings"
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                    padding: '9px 16px', borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 500
                  }}
                >
                  Manage Trusted Senders
                </Link>
              </div>
            </div>
          ) : filteredPending.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 12,
              padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                No pending opportunities match your filters
              </div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                You have {pendingItems.length} pending items, but none match the current search or filters.
              </div>
              <button
                type="button"
                onClick={() => { setPendingDateFilter('all'); setPendingTypeFilter(''); setPendingBranchFilter(''); setPendingSearch(''); setPendingPage(1); }}
                style={{
                  background: 'var(--primary-brand)', color: '#FFFFFF', border: 'none',
                  padding: '7px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Top Pagination Control */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <Pagination
                  currentPage={pendingPage}
                  totalItems={filteredPending.length}
                  pageSize={pendingPageSize}
                  onPageChange={setPendingPage}
                  onPageSizeChange={(newSize) => { setPendingPageSize(newSize); setPendingPage(1); }}
                  pageSizeOptions={[10, 20, 50]}
                  itemName="pending opportunities"
                  accentColor="var(--primary-brand)"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {paginatedPending.map(item => {
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
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderLeft: dup?.isDuplicate ? '4px solid #F59E0B' : '4px solid #DC3545',
                        borderRadius: 12,
                        padding: 24,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      {/* Top Bar: Sender, Received Date, Type Badge & Duplicate status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11.5, background: 'rgba(220, 53, 69, 0.12)', color: 'var(--danger, #DC3545)', border: '1px solid rgba(220, 53, 69, 0.25)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                              From: {item.from || 'Placement Cell'}
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> {new Date(item.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            <span style={{
                              fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                              background: empTypeStr.includes('intern') ? 'rgba(8, 127, 113, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                              color: empTypeStr.includes('intern') ? 'var(--primary-brand)' : '#3B82F6',
                              border: empTypeStr.includes('intern') ? '1px solid rgba(8, 127, 113, 0.25)' : '1px solid rgba(37, 99, 235, 0.25)',
                              padding: '2px 7px', borderRadius: 4
                            }}>
                              {empTypeStr}
                            </span>
                          </div>
                          <h3 style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                            {item.subject}
                          </h3>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {dup?.isDuplicate && (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                              background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              <AlertTriangle size={12} /> Duplicate: {dup.existingCompany}
                            </span>
                          )}

                          {elig && (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                              background: elig.status === 'eligible' ? 'rgba(22, 163, 74, 0.12)' : elig.status === 'not_eligible' ? 'rgba(220, 53, 69, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: elig.status === 'eligible' ? '#16A34A' : elig.status === 'not_eligible' ? '#DC3545' : '#F59E0B',
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
                        gap: 12, background: 'var(--card-subtle)', padding: 14, borderRadius: 8, border: '1px solid var(--border)',
                        marginBottom: 14
                      }}>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Company</span>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                            {edits.company || ext.company || '—'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Role</span>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {edits.role || ext.role || '—'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Package / Stipend</span>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
                            {payStr}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Deadline</span>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                            {edits.deadline ? new Date(edits.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ext.deadline ? new Date(ext.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline stated'}
                          </div>
                        </div>
                      </div>

                      {/* Allowed Branches & Eligibility Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <GraduationCap size={13} color="#3B82F6" /> Allowed Branches:
                        </span>
                        {branches.length > 0 ? (
                          branches.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              style={{
                                background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)',
                                color: '#3B82F6', padding: '2px 8px', borderRadius: 4,
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                              }}
                            >
                              {b}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            All branches eligible / Not restricted
                          </span>
                        )}

                        {ext.eligibility?.minCGPA && (
                          <span style={{ fontSize: 11, background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                            Min CGPA: {ext.eligibility.minCGPA}
                          </span>
                        )}

                        {ext.testDate && (
                          <span style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            OA Date: {new Date(ext.testDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}

                        {ext.driveDate && (
                          <span style={{ fontSize: 11, background: 'rgba(139, 92, 246, 0.12)', color: '#A855F7', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
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
                                  fontSize: 12, color: '#3B82F6', textDecoration: 'none',
                                  background: 'rgba(37, 99, 235, 0.1)', padding: '4px 10px',
                                  borderRadius: 6, border: '1px solid rgba(37, 99, 235, 0.25)',
                                  fontWeight: 600
                                }}
                              >
                                <ExternalLink size={12} /> {l.label || 'Registration Link'}
                              </a>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Missing API Key Warning Callout on Card if not configured */}
                      {(!hasApiKey || ext.note) && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8,
                          padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={15} color="#F59E0B" />
                            <span style={{ fontSize: 12, color: 'var(--amber-text, #F59E0B)', fontWeight: 600 }}>
                              {ext.note || 'AI API Key was not set. Please enter your API key to automatically parse and extract full details.'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setKeyModal({
                              isOpen: true,
                              keyType: 'AI',
                              message: 'Please enter your API key to extract important details from placement emails with AI.',
                            })}
                            style={{
                              background: '#D97706', color: '#fff', border: 'none', borderRadius: 4,
                              padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Enter API Key
                          </button>
                        </div>
                      )}

                      {/* Full Gmail Content Viewer (Collapsible) */}
                      {showEmailBody[item._id] && (
                        <div style={{
                          background: 'var(--card-subtle)',
                          border: '1px solid var(--border)',
                          borderLeft: '4px solid #EA4335',
                          borderRadius: 8,
                          padding: 14,
                          marginBottom: 16
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Mail size={14} color="#EA4335" /> Gmail Message Content
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Subject: {item.subject} • From: {item.from} • {new Date(item.receivedAt).toLocaleString()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(item.rawText || '');
                                toast.success('Email text copied to clipboard!');
                              }}
                              style={{
                                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4,
                                padding: '3px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Copy size={11} /> Copy Text
                            </button>
                          </div>
                          <div style={{
                            whiteSpace: 'pre-wrap',
                            fontSize: 12.5,
                            color: 'var(--text-primary)',
                            lineHeight: 1.6,
                            maxHeight: 280,
                            overflowY: 'auto',
                            background: 'var(--surface)',
                            padding: 12,
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                          }}>
                            {item.rawText || 'No email content available.'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                            💡 All content present in Gmail is preserved above. You can read the original email and extract or modify any important data below.
                          </div>
                        </div>
                      )}

                      {/* Expanded Edit Form: Extracted Important Data */}
                      {isExpanded && (
                        <div style={{
                          background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 8,
                          padding: 16, marginBottom: 16
                        }}>
                          <div style={{ marginBottom: 12 }}>
                            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                              Extracted Important Data (Editable)
                            </h4>
                            <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                              Review or modify the extracted fields below. Everything here will be saved to your database and synced to Google Calendar.
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Company Name</label>
                              <input
                                type="text"
                                value={edits.company}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], company: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Role / Designation</label>
                              <input
                                type="text"
                                value={edits.role}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], role: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Opportunity Type</label>
                              <select
                                value={edits.employmentType || 'placement'}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], employmentType: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              >
                                <option value="placement" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Placement (Full-time)</option>
                                <option value="internship" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Internship</option>
                                <option value="internship+ppo" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Internship + PPO</option>
                                <option value="off-campus" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Off-Campus Drive</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>CTC / Package</label>
                              <input
                                type="text"
                                placeholder="e.g. 10 LPA or 12,00,000"
                                value={edits.ctc}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], ctc: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Stipend / PPO</label>
                              <input
                                type="text"
                                placeholder="e.g. 25,000 / month"
                                value={edits.stipend || edits.ppo}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], stipend: e.target.value, ppo: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Location / Mode</label>
                              <input
                                type="text"
                                placeholder="e.g. Pune, Bangalore, Hybrid"
                                value={edits.location}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], location: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Application Deadline</label>
                              <input
                                type="datetime-local"
                                value={edits.deadline}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], deadline: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>OA / Online Test Date & Time</label>
                              <input
                                type="datetime-local"
                                value={edits.testDate}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], testDate: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Campus Drive Date</label>
                              <input
                                type="date"
                                value={edits.driveDate ? edits.driveDate.substring(0, 10) : ''}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], driveDate: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Interview Date & Time</label>
                              <input
                                type="datetime-local"
                                value={edits.interviewDate}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], interviewDate: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Minimum CGPA</label>
                              <input
                                type="text"
                                placeholder="e.g. 6.5 or 7.0"
                                value={edits.minCGPA}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], minCGPA: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Allowed Branches (comma separated)</label>
                              <input
                                type="text"
                                placeholder="e.g. CS, IT, ENTC, Mech"
                                value={edits.allowedBranches}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], allowedBranches: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Registration / Application Links</label>
                              <input
                                type="text"
                                placeholder="e.g. https://forms.gle/... or job portal link"
                                value={edits.links}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], links: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Shortlist / Eligibility / Round Notes</label>
                              <textarea
                                rows={2}
                                placeholder="e.g. Online Assessment followed by Technical and HR round..."
                                value={edits.shortlistInfo}
                                onChange={e => setPendingEdits(pe => ({ ...pe, [item._id]: { ...pe[item._id], shortlistInfo: e.target.value } }))}
                                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer Actions: View Email, Re-extract, Edit toggle, Ignore, Confirm */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setShowEmailBody(prev => ({ ...prev, [item._id]: !prev[item._id] }))}
                            style={{
                              background: showEmailBody[item._id] ? 'rgba(37, 99, 235, 0.15)' : 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: showEmailBody[item._id] ? '#3B82F6' : 'var(--text-primary)',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <FileText size={13} color={showEmailBody[item._id] ? '#3B82F6' : '#DC2626'} />
                            {showEmailBody[item._id] ? 'Hide Gmail Content' : 'View Full Gmail Content'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedReviewId(isExpanded ? null : item._id)}
                            style={{
                              background: isExpanded ? 'rgba(8, 127, 113, 0.15)' : 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--primary-brand)',
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '6px 12px',
                              borderRadius: 6,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <Edit3 size={13} /> {isExpanded ? 'Hide Extracted Fields' : 'Review & Edit Extracted Data'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReExtract(item._id)}
                            disabled={reExtractingId === item._id}
                            style={{
                              background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.25)', color: '#16A34A',
                              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
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
                              background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
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
                              background: 'var(--primary-brand)', color: '#FFFFFF', border: 'none',
                              padding: '8px 20px', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
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

              {/* Bottom Pagination Control */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <Pagination
                  currentPage={pendingPage}
                  totalItems={filteredPending.length}
                  pageSize={pendingPageSize}
                  onPageChange={setPendingPage}
                  onPageSizeChange={(newSize) => { setPendingPageSize(newSize); setPendingPage(1); }}
                  pageSizeOptions={[10, 20, 50]}
                  itemName="pending opportunities"
                  accentColor="var(--primary-brand)"
                />
              </div>
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
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 3, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
                {EMP_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setFilters(f => ({ ...f, employmentType: t.key }))}
                    style={{
                      background: filters.employmentType === t.key ? 'rgba(24, 183, 160, 0.15)' : 'transparent',
                      color: filters.employmentType === t.key ? 'var(--primary-brand)' : 'var(--text-secondary)',
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
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search company or role..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    paddingLeft: 34,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    fontSize: 13,
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
                  }}
                />
              </div>
            </div>

            {/* Secondary Filter Row: Status, Sort, Order & Active filters */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px' }}>
                  <Filter size={14} color="var(--text-muted)" />
                  <select
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <option value="" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Status: All Stages</option>
                    {STATUSES.filter(Boolean).map(s => (
                      <option key={s} value={s} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
                        {s.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px' }}>
                  <ArrowUpDown size={14} color="var(--text-muted)" />
                  <select
                    value={filters.sortBy}
                    onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <option value="newest" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Newest First</option>
                    <option value="company" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Company Name</option>
                    <option value="role" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Role / Title</option>
                    <option value="compensation" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: CTC / Stipend</option>
                    <option value="deadline" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Deadline Date</option>
                    <option value="status" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Sort: Pipeline Status</option>
                  </select>
                </div>

                {/* Ascending / Descending Toggle Button */}
                <button
                  type="button"
                  onClick={() => setFilters(f => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  title={`Sort order: ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '7px 12px',
                    color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  {filters.sortOrder === 'asc' ? (
                    <ArrowUp size={14} color="var(--primary-brand)" />
                  ) : (
                    <ArrowDown size={14} color="var(--primary-brand)" />
                  )}
                  <span>{filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>

                {/* Reset Filters button if any active */}
                {(filters.search || filters.status || filters.employmentType || filters.sortBy !== 'newest' || filters.sortOrder !== 'desc') && (
                  <button
                    type="button"
                    onClick={() => setFilters({ search: '', status: '', employmentType: '', sortBy: 'newest', sortOrder: 'desc' })}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger, #DC3545)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <X size={13} /> Reset Filters
                  </button>
                )}
              </div>

              {/* Showing count indicator */}
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredOpps.length}</strong> of {allOpps.length} tracked
              </div>
            </div>
          </div>

          {/* Main Table */}
          {loading ? (
            <div className="loading-center" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
          ) : allOpps.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
              <h3 style={{ fontSize: 18, color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 700 }}>No placement records found</h3>
              <p style={{ fontSize: 13.5, margin: '0 0 20px 0' }}>Add an opportunity manually or auto-fetch incoming recruitment emails with Gmail.</p>
              <Link to="/opportunities/new" style={{ background: 'var(--primary-brand)', color: '#FFFFFF', padding: '9px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                + Add First Opportunity
              </Link>
            </div>
          ) : filteredOpps.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🔍</div>
              <h3 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 700 }}>No opportunities match your filters</h3>
              <p style={{ fontSize: 13, margin: '0 0 16px 0' }}>Try adjusting your search terms, status, or employment type filter.</p>
              <button
                onClick={() => setFilters({ search: '', status: '', employmentType: '', sortBy: 'newest', sortOrder: 'desc' })}
                style={{ background: 'var(--primary-brand)', color: '#FFFFFF', border: 'none', padding: '7px 16px', borderRadius: 6, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-subtle)' }}>
                      <th
                        onClick={() => handleColumnSort('company')}
                        style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: filters.sortBy === 'company' ? 'var(--primary-brand)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', minWidth: 200, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Company</span>
                          {filters.sortBy === 'company' ? (
                            filters.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleColumnSort('role')}
                        style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: filters.sortBy === 'role' ? 'var(--primary-brand)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', minWidth: 150, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Role</span>
                          {filters.sortBy === 'role' ? (
                            filters.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleColumnSort('compensation')}
                        style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: filters.sortBy === 'compensation' ? 'var(--primary-brand)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', minWidth: 130, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Compensation</span>
                          {filters.sortBy === 'compensation' ? (
                            filters.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', minWidth: 100 }}>Type</th>
                      <th
                        onClick={() => handleColumnSort('deadline')}
                        style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: filters.sortBy === 'deadline' ? 'var(--primary-brand)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', minWidth: 150, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Deadline</span>
                          {filters.sortBy === 'deadline' ? (
                            filters.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleColumnSort('status')}
                        style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: filters.sortBy === 'status' ? 'var(--primary-brand)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', minWidth: 140, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Status</span>
                          {filters.sortBy === 'status' ? (
                            filters.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', minWidth: 110 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOpps.map(opp => {
                      const pay = getOppPay(opp);
                      const deadline = getOppDeadline(opp);
                      const typeLabel = (opp.employmentType || 'placement').replace('-', ' ');
                      const initials = getCompanyInitials(opp.company);

                      return (
                        <tr
                          key={opp._id}
                          className="table-row"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          {/* Company Name & AI Tag */}
                          <td style={{ padding: '14px 18px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: 'rgba(24, 183, 160, 0.15)',
                                  border: '1px solid rgba(24, 183, 160, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontWeight: 700,
                                  color: 'var(--primary-brand)'
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <Link
                                  to={`/opportunities/${opp._id}`}
                                  style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13.5, display: 'block' }}
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
                                      color: 'var(--primary-brand)',
                                      fontFamily: 'JetBrains Mono, monospace',
                                      fontSize: 10,
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                      background: 'rgba(24, 183, 160, 0.15)',
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
                          <td style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13.5 }}>
                            {opp.role}
                          </td>

                          {/* Compensation */}
                          <td style={{ padding: '14px 18px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: pay ? '#16A34A' : 'var(--text-muted)', fontWeight: pay ? 600 : 400 }}>
                            {pay ? pay : <span>—</span>}
                          </td>

                          {/* Type */}
                          <td style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12.5, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                            {typeLabel}
                          </td>

                          {/* Deadline */}
                          <td style={{ padding: '14px 18px', textAlign: 'left' }}>
                            <DeadlineBadge deadline={deadline} />
                          </td>

                          {/* Status Selector */}
                          <td style={{ padding: '14px 18px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <select
                                value={opp.status || 'not_applied'}
                                onChange={(e) => handleStatusChange(opp._id, e.target.value)}
                                style={{
                                  background: 'var(--card-subtle)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 6,
                                  padding: '5px 8px',
                                  color: 'var(--text-primary)',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  outline: 'none',
                                  fontFamily: 'Inter, sans-serif'
                                }}
                              >
                                <option value={opp.status} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
                                  {opp.status ? opp.status.replace('_', ' ').toUpperCase() : 'NOT APPLIED'}
                                </option>
                                {STATUSES.filter(Boolean).filter(s => s !== opp.status).map(s => (
                                  <option key={s} value={s} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
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
                                style={{ background: 'transparent', border: 'none', color: 'var(--primary-brand)', cursor: 'pointer', padding: 4 }}
                              >
                                <Sparkles size={16} />
                              </button>

                              <button
                                onClick={() => navigate(`/opportunities/${opp._id}`)}
                                title="View Details"
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(opp._id)}
                                title="Delete Record"
                                style={{ background: 'transparent', border: 'none', color: 'var(--danger, #DC3545)', cursor: 'pointer', padding: 4 }}
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

              {/* Table Footer & Pagination */}
              <Pagination
                currentPage={trackedPage}
                totalItems={filteredOpps.length}
                pageSize={trackedPageSize}
                onPageChange={setTrackedPage}
                onPageSizeChange={(newSize) => { setTrackedPageSize(newSize); setTrackedPage(1); }}
                pageSizeOptions={[10, 25, 50]}
                itemName="opportunities"
                accentColor="var(--primary-brand)"
              />
            </div>
          )}
      </>
      )}

      {/* AI Merge Modal Portaled to Body */}
      {activeAiOpp && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 600, padding: 26, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(24, 183, 160, 0.15)', border: '1px solid rgba(24, 183, 160, 0.3)', color: 'var(--primary-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', fontWeight: 700 }}>Merge Follow-up Email (AI)</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{activeAiOpp.company} — Paste test links, interview dates, or result emails</p>
                </div>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} onClick={() => setActiveAiOpp(null)}><X size={18} /></button>
            </div>

            <textarea
              style={{ width: '100%', background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 14, borderRadius: 8, minHeight: 160, fontSize: 13, outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              placeholder="Paste follow-up email text, interview schedule, or test link here..."
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
            />

            {changesSummary && (
              <div style={{ background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: '#16A34A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={14} /> Changes Merged & Calendar Updated!
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {changesSummary.map((cs, i) => <li key={i}>{cs}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setActiveAiOpp(null)} style={{ background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAiUpdateSubmit} disabled={aiUpdating} style={{ background: 'var(--primary-brand)', color: '#FFFFFF', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {aiUpdating ? 'Merging…' : 'Merge Info'}
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
        onSaved={(newKey) => {
          setUserSettings(prev => ({ ...prev, llmApiKey: newKey }));
          setHasApiKey(true);
        }}
      />
    </div>
  );
}
