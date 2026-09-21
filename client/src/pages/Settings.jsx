import { useEffect, useState } from 'react';
import { settingsAPI, googleAPI, gmailAPI, calendarAPI } from '../api';
import { 
  Eye, EyeOff, Sparkles, Send, Save, Bell, Download, CheckCircle2, 
  AlertCircle, Cpu, Mail, ShieldCheck, Database, Sliders, Check,
  CalendarDays, RefreshCw, Plus, Trash2, ExternalLink, Calendar, Link2,
  Upload, FileSpreadsheet, BellRing, Clock, CheckCheck, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import MissingKeyModal from '../components/MissingKeyModal';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendDesktopNotification
} from '../utils/notifications';

// --- Constants ---
const DEFAULT_SETTINGS = {
  reminderLeadHours: 24,
  notificationChannel: 'browser',
  notifyTests: true,
  notifyDeadlines: true,
  notifyDrives: true,
  notifyInterviews: true,
  llmProvider: 'groq',
  llmApiKey: '',
  llmModel: 'openai/gpt-oss-120b',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
};

const PRESET_PROVIDERS = [
  { value: 'groq', label: 'Groq Cloud (Recommended — Ultra Fast & Free)' },
  { value: 'gemini', label: 'Google Gemini (gemini-2.0-flash / 1.5)' },
  { value: 'openai', label: 'OpenAI (ChatGPT / GPT-4o)' },
  { value: 'anthropic', label: 'Anthropic (Claude 3.5)' },
  { value: 'openrouter', label: 'OpenRouter.ai (All Open Models)' },
  { value: 'deepseek', label: 'DeepSeek AI' },
  { value: 'together', label: 'Together.ai' },
  { value: 'other', label: '✏️ Custom Provider...' },
];

const PRESET_MODELS = {
  groq: [
    { value: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b (Recommended — Powerful & Fast)' },
    { value: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b (Ultra Fast)' },
    { value: 'qwen/qwen3.8-27b', label: 'qwen/qwen3.8-27b' },
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile' },
    { value: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant' },
    { value: 'other', label: '✏️ Custom Model...' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash (Recommended — Latest & Fast)' },
    { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Fast & Free)' },
    { value: 'gemini-1.5-pro', label: 'gemini-1.5-pro (High Accuracy)' },
    { value: 'other', label: '✏️ Custom Model...' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini (Fast & Affordable)' },
    { value: 'gpt-4o', label: 'gpt-4o (High Accuracy)' },
    { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
    { value: 'other', label: '✏️ Custom Model...' },
  ],
  anthropic: [
    { value: 'claude-3-haiku-20240307', label: 'claude-3-haiku-20240307' },
    { value: 'claude-3-5-sonnet-20241022', label: 'claude-3-5-sonnet-20241022' },
    { value: 'other', label: '✏️ Custom Model...' },
  ],
  openrouter: [
    { value: 'meta-llama/llama-3.3-70b-instruct', label: 'meta-llama/llama-3.3-70b-instruct' },
    { value: 'deepseek/deepseek-r1', label: 'deepseek/deepseek-r1' },
    { value: 'other', label: '✏️ Custom Model...' },
  ],
};

function DarkInput({ id, type = 'text', placeholder, value, onChange, prefix, suffix, accentColor = '#18B7A0' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#FFFFFF',
      border: `1px solid ${focused ? accentColor : '#E5EAF0'}`,
      boxShadow: focused ? `0 0 0 3px rgba(24, 183, 160, 0.15)` : 'none',
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'all 0.15s ease',
    }}>
      {prefix && (
        <span style={{ paddingLeft: 12, color: focused ? accentColor : '#667085', fontSize: 14, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {prefix}
        </span>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#172033',
          fontSize: 14,
          padding: '10px 12px',
          fontFamily: type === 'password' ? 'ui-monospace, monospace' : 'inherit',
        }}
      />
      {suffix}
    </div>
  );
}

function DarkSelect({ id, value, onChange, options, accentColor = '#18B7A0', prefix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#FFFFFF',
      border: `1px solid ${focused ? accentColor : '#E5EAF0'}`,
      boxShadow: focused ? `0 0 0 3px rgba(37, 99, 235, 0.15)` : 'none',
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.15s ease',
    }}>
      {prefix && (
        <span style={{ paddingLeft: 12, color: focused ? accentColor : '#667085', fontSize: 14, flexShrink: 0 }}>
          {prefix}
        </span>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: '#172033', fontSize: 14, padding: '10px 36px 10px 12px',
          appearance: 'none', cursor: 'pointer',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#FFFFFF', color: '#172033' }}>{o.label}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 12, color: '#667085', fontSize: 13, pointerEvents: 'none' }}>
        ▾
      </span>
    </div>
  );
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
      {children}
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isCustomProvider, setIsCustomProvider] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [keyModal, setKeyModal] = useState({ isOpen: false, keyType: 'AI', message: '' });

  // Google OAuth & Sync State
  const [googleStatus, setGoogleStatus] = useState({
    isConnected: false,
    connectedAt: null,
    googleEmail: null,
    gmailSyncEnabled: false,
    calendarSyncEnabled: false,
    lastGmailSyncAt: null,
  });
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [trustedSenders, setTrustedSenders] = useState([]);
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [newSender, setNewSender] = useState({ email: '', name: '' });
  const [addingSender, setAddingSender] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  // Notification & Reminders State
  const [browserPermission, setBrowserPermission] = useState(getNotificationPermission());
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [testingNotification, setTestingNotification] = useState(false);

  // Data & Backup State
  const [exportingCsv, setExportingCsv] = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [backupData, setBackupData] = useState(null);
  const [backupMode, setBackupMode] = useState('merge');
  const [importingBackup, setImportingBackup] = useState(false);

  const fetchGoogleStatus = async () => {
    try {
      const { data } = await googleAPI.getStatus();
      setGoogleStatus(data);
    } catch (err) {
      console.warn('Could not fetch Google status', err);
    }
  };

  const fetchSenders = async () => {
    try {
      setLoadingSenders(true);
      const { data } = await gmailAPI.getSenders();
      setTrustedSenders(data);
    } catch (err) {
      console.warn('Could not fetch trusted senders', err);
    } finally {
      setLoadingSenders(false);
    }
  };

  const fetchUpcomingReminders = async () => {
    try {
      const { data } = await settingsAPI.getUpcomingReminders();
      setUpcomingReminders(data?.reminders || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    settingsAPI.get()
      .then(({ data }) => {
        const loaded = { ...DEFAULT_SETTINGS, ...data };
        setSettings(loaded);
        setInitialSettings(loaded);
        const isKnownProvider = PRESET_PROVIDERS.some(p => p.value === loaded.llmProvider);
        if (!isKnownProvider && loaded.llmProvider) setIsCustomProvider(true);
        const providerPresets = PRESET_MODELS[loaded.llmProvider] || [];
        const isKnownModel = providerPresets.some(m => m.value === loaded.llmModel);
        if (!isKnownModel && loaded.llmModel) setIsCustomModel(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchGoogleStatus();
    fetchSenders();
    fetchUpcomingReminders();

    // Check URL parameters for OAuth return
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      toast.success('🎉 Google Account connected successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('google');
      fetchGoogleStatus();
    } else if (params.get('google') === 'error') {
      toast.error(`Google connection failed: ${params.get('message') || 'Authentication cancelled'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('google');
    }
  }, []);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      setInitialSettings(settings);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.smtpUser || !settings.smtpPass) {
      return setKeyModal({
        isOpen: true,
        keyType: 'Email',
        message: 'Please enter your SMTP Email and App Password before testing.',
      });
    }
    setTestingEmail(true);
    const id = toast.loading('Sending test email...');
    try {
      const { data } = await settingsAPI.testEmail(settings);
      toast.success(data.message || 'Test email sent!', { id });
    } catch (err) {
      if (err.response?.data?.isKeyMissing) {
        toast.dismiss(id);
        setKeyModal({
          isOpen: true,
          keyType: 'Email',
          message: err.response.data.message || 'SMTP Email and App Password are not configured.',
        });
      } else {
        toast.error(err.response?.data?.message || 'SMTP failed. Check credentials.', { id });
      }
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestAi = async () => {
    if (!settings.llmApiKey) {
      return setKeyModal({
        isOpen: true,
        keyType: 'AI',
        message: 'No API Key found in your account settings. Please enter your LLM API Key before testing.',
      });
    }
    setTestingAi(true);
    const id = toast.loading(`Testing ${settings.llmProvider || 'AI'} connection...`);
    try {
      const { data } = await settingsAPI.testAiKey(settings);
      toast.success(data.message || 'AI connected!', { id });
    } catch (err) {
      if (err.response?.data?.isKeyMissing) {
        toast.dismiss(id);
        setKeyModal({
          isOpen: true,
          keyType: 'AI',
          message: err.response.data.message || 'AI API Key is missing.',
        });
      } else {
        toast.error(err.response?.data?.message || 'AI test failed.', { id });
      }
    } finally {
      setTestingAi(false);
    }
  };

  // --- Notification Handlers ---
  const handleEnableDesktopNotifications = async () => {
    const perm = await requestNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      sendDesktopNotification({
        title: '🔔 Desktop Notifications Enabled!',
        body: 'You will now receive instant desktop alerts for upcoming assessment tests, campus drives, and deadlines.',
      });
      toast.success('Desktop notifications enabled successfully!');
    } else if (perm === 'denied') {
      toast.error('Notifications were blocked by your browser. Please permit notifications in browser site settings.');
    }
  };

  const handleTestNotification = async (milestoneType = 'test') => {
    setTestingNotification(true);
    const toastId = toast.loading('Sending test reminder notification...');
    try {
      const perm = await requestNotificationPermission();
      setBrowserPermission(perm);

      const { data } = await settingsAPI.testNotification({ milestoneType });

      // Trigger native desktop notification
      const desktopFired = sendDesktopNotification({
        title: data?.notification?.title || '🎯 Test Reminder: Google Online Assessment',
        body: data?.notification?.body || 'Upcoming assessment alert test.',
      });

      if (data?.notification?.emailSent) {
        toast.success(`Notification delivered via Desktop & Email (SMTP)!`, { id: toastId });
      } else if (desktopFired) {
        toast.success(`Desktop notification alert delivered!`, { id: toastId });
      } else {
        toast.success(`Test notification generated successfully!`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch test notification', { id: toastId });
    } finally {
      setTestingNotification(false);
    }
  };

  // --- Data & Backup Handlers ---
  const handleExport = async () => {
    try {
      const res = await settingsAPI.export();
      const blob = res.data instanceof Blob ? res.data : new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `opptrack-backup-${Date.now()}.json`; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Complete JSON backup downloaded!');
    } catch { 
      toast.error('Export failed'); 
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    const toastId = toast.loading('Exporting opportunities spreadsheet (CSV)...');
    try {
      const res = await settingsAPI.exportCsv();
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `opptrack-opportunities-${Date.now()}.csv`; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Opportunities CSV spreadsheet downloaded!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV export failed', { id: toastId });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      return toast.error('Please upload a valid JSON backup file (.json)');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') {
          return toast.error('Invalid backup structure in JSON file.');
        }
        setBackupFile(file);
        setBackupData(parsed);
        const count = parsed.opportunities?.length || parsed.jobs?.length || 0;
        toast.success(`Backup file loaded: contains ${count} opportunities.`);
      } catch (err) {
        toast.error('Could not parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreBackup = async () => {
    if (!backupData) return toast.error('Please select a backup JSON file first.');
    if (backupMode === 'replace') {
      const confirmed = window.confirm('⚠️ Replace mode will wipe all current opportunities and replace them with this backup file. Continue?');
      if (!confirmed) return;
    }
    setImportingBackup(true);
    const toastId = toast.loading('Restoring opportunities and vault from backup...');
    try {
      const { data } = await settingsAPI.importBackup({
        backupData,
        mode: backupMode,
      });
      toast.success(data.message || 'Backup restored successfully!', { id: toastId });
      setBackupFile(null);
      setBackupData(null);
      fetchUpcomingReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed', { id: toastId });
    } finally {
      setImportingBackup(false);
    }
  };

  // --- Google OAuth Handlers ---
  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    const toastId = toast.loading('Opening Google Consent screen…');
    try {
      const { data } = await googleAPI.getAuthUrl();
      if (data.url) {
        toast.dismiss(toastId);
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate Google OAuth. Check server .env settings.', { id: toastId });
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Disconnect Google Account? Gmail auto-fetch and Google Calendar sync will be disabled.')) return;
    try {
      await googleAPI.disconnect();
      toast.success('Google Account disconnected.');
      fetchGoogleStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Disconnect failed');
    }
  };

  const handleToggleGmailSync = async () => {
    try {
      const nextVal = !googleStatus.gmailSyncEnabled;
      const { data } = await googleAPI.updateSettings({ gmailSyncEnabled: nextVal });
      setGoogleStatus(prev => ({ ...prev, gmailSyncEnabled: data.gmailSyncEnabled }));
      toast.success(nextVal ? 'Gmail Auto-Fetch enabled!' : 'Gmail Auto-Fetch disabled.');
    } catch (err) {
      toast.error('Failed to update Gmail sync setting.');
    }
  };

  const handleToggleCalendarSync = async () => {
    try {
      const nextVal = !googleStatus.calendarSyncEnabled;
      const { data } = await googleAPI.updateSettings({ calendarSyncEnabled: nextVal });
      setGoogleStatus(prev => ({ ...prev, calendarSyncEnabled: data.calendarSyncEnabled }));
      toast.success(nextVal ? 'Google Calendar Sync enabled!' : 'Google Calendar Sync disabled.');
    } catch (err) {
      toast.error('Failed to update Calendar sync setting.');
    }
  };

  const handleAddSender = async (e) => {
    if (e) e.preventDefault();
    if (!newSender.email.trim()) return toast.error('Enter an email address');
    setAddingSender(true);
    try {
      const { data } = await gmailAPI.addSender(newSender);
      setTrustedSenders(prev => [data, ...prev]);
      setNewSender({ email: '', name: '' });
      toast.success(`Added ${data.email} to trusted senders!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add sender');
    } finally {
      setAddingSender(false);
    }
  };

  const handleAddPresetTpo = async () => {
    setAddingSender(true);
    try {
      const { data } = await gmailAPI.addSender({
        email: 'srawandale@gmail.com',
        name: 'PCCOE Placement Cell (TPO)',
      });
      setTrustedSenders(prev => [data, ...prev]);
      toast.success('Added PCCOE TPO to trusted senders!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add preset sender');
    } finally {
      setAddingSender(false);
    }
  };

  const handleDeleteSender = async (id, email) => {
    try {
      await gmailAPI.deleteSender(id);
      setTrustedSenders(prev => prev.filter(s => s._id !== id));
      toast.success(`Removed ${email}`);
    } catch (err) {
      toast.error('Failed to remove sender');
    }
  };

  const handleSyncGmailNow = async () => {
    setSyncingGmail(true);
    const toastId = toast.loading('Checking trusted sender emails via Gmail API…');
    try {
      const { data } = await gmailAPI.sync();
      toast.success(data.message || `Sync completed! Found ${data.newCount || 0} new opportunities.`, { id: toastId });
      fetchGoogleStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gmail sync failed', { id: toastId });
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleSyncCalendarNow = async () => {
    setSyncingCalendar(true);
    const toastId = toast.loading('Mirroring all deadlines & test dates to Google Calendar…');
    try {
      const { data } = await calendarAPI.syncAll();
      toast.success(`Synced ${data.syncedCount || 0} milestones to Google Calendar!`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calendar sync failed', { id: toastId });
    } finally {
      setSyncingCalendar(false);
    }
  };

  const currentModels = PRESET_MODELS[settings.llmProvider] || [
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile' },
    { value: 'other', label: '✏️ Custom Model...' },
  ];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const isAiConfigured = Boolean(settings.llmApiKey);
  const isEmailConfigured = Boolean(settings.smtpUser && settings.smtpPass);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 100, fontFamily: 'Manrope, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B1F3A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              System Settings & Integrations
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#667085' }}>
              Manage your Google Cloud OAuth, placement milestone alerts, AI parser, SMTP reminders, and database backups.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#0B1F3A',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 22px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(11, 31, 58, 0.15)',
              transition: 'all 0.15s ease',
            }}
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save All Settings'}
          </button>
        </div>

        {/* ── SYSTEM STATUS BADGES ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: googleStatus.isConnected ? '#EAF2FF' : '#F7F9FC',
            border: `1px solid ${googleStatus.isConnected ? '#BFDBFE' : '#E5EAF0'}`,
            color: googleStatus.isConnected ? '#2563EB' : '#667085',
          }}>
            <CalendarDays size={13} />
            <span>Google Sync: <strong>{googleStatus.isConnected ? (googleStatus.googleEmail || 'Connected') : 'Not Connected'}</strong></span>
            {googleStatus.isConnected ? <Check size={12} /> : <span style={{ fontSize: 11, opacity: 0.7 }}>OAuth</span>}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: browserPermission === 'granted' ? '#EAF8EF' : '#FFF7E6',
            border: `1px solid ${browserPermission === 'granted' ? '#A7F3D0' : '#FDE68A'}`,
            color: browserPermission === 'granted' ? '#15803D' : '#B45309',
          }}>
            <Bell size={13} />
            <span>Browser Alerts: <strong>{browserPermission === 'granted' ? 'Enabled' : 'Permission Needed'}</strong></span>
            {browserPermission === 'granted' ? <Check size={12} /> : <AlertTriangle size={12} />}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: isAiConfigured ? '#E8F8F5' : '#FEF0F0',
            border: `1px solid ${isAiConfigured ? '#A3E5D9' : '#FCA5A5'}`,
            color: isAiConfigured ? '#087F71' : '#DC2626',
          }}>
            <Cpu size={13} />
            <span>AI Parser: <strong>{isAiConfigured ? `${settings.llmProvider?.toUpperCase()} Ready` : 'Key Missing'}</strong></span>
            {isAiConfigured ? <Check size={12} /> : <AlertCircle size={12} />}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: isEmailConfigured ? '#EAF8EF' : '#F7F9FC',
            border: `1px solid ${isEmailConfigured ? '#A7F3D0' : '#E5EAF0'}`,
            color: isEmailConfigured ? '#15803D' : '#667085',
          }}>
            <Mail size={13} />
            <span>SMTP Email: <strong>{isEmailConfigured ? 'Active' : 'Optional'}</strong></span>
          </div>
        </div>
      </header>

      {/* ── SETTINGS NAVIGATION TABS (ORDERED BY IMPORTANCE) ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 26,
        background: '#F0F4F8', padding: 5, borderRadius: 10, border: '1px solid #E5EAF0',
        overflowX: 'auto',
      }}>
        {[
          { id: 'all', label: 'All Settings', icon: Sliders },
          { id: 'google', label: '1. Google & Sync', icon: CalendarDays, accent: '#2563EB' },
          { id: 'senders', label: '2. Trusted Senders', icon: Mail, accent: '#DC2626' },
          { id: 'reminders', label: '3. Notifications & Alerts', icon: Bell, accent: '#D97706' },
          { id: 'ai', label: '4. AI Engine', icon: Cpu, accent: '#087F71' },
          { id: 'email', label: '5. Email & SMTP', icon: Mail, accent: '#15803D' },
          { id: 'data', label: '6. Data & Backup', icon: Database, accent: '#4F46E5' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#0B1F3A' : '#667085',
                border: 'none',
                boxShadow: isActive ? '0 1px 3px rgba(11,31,58,0.08)' : 'none',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={isActive ? (tab.accent || '#0B1F3A') : '#667085'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── CARD 1: GOOGLE CLOUD & OAUTH INTEGRATION (PRIORITY 1) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'google') && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderTop: '4px solid #2563EB',
            borderRadius: 14,
            padding: 28,
            boxShadow: '0 1px 3px rgba(11,31,58,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#EAF2FF', border: '1px solid #BFDBFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB'
                }}>
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 2px 0' }}>
                    Google Cloud & OAuth Integration
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085' }}>
                    Auto-fetch placement emails via Gmail API and synchronize application deadlines, test dates, and drives to Google Calendar.
                  </p>
                </div>
              </div>

              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '4px 10px', borderRadius: 6,
                background: googleStatus.isConnected ? '#EAF8EF' : '#F7F9FC',
                color: googleStatus.isConnected ? '#15803D' : '#667085',
                border: `1px solid ${googleStatus.isConnected ? '#A7F3D0' : '#E5EAF0'}`
              }}>
                {googleStatus.isConnected ? 'OAuth Active' : 'Not Connected'}
              </span>
            </div>

            {/* Google OAuth Connection Box */}
            <div style={{
              background: '#F8FAFD',
              border: `1px solid ${googleStatus.isConnected ? '#A7F3D0' : '#E5EAF0'}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: googleStatus.isConnected ? '#15803D' : '#D97706'
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A' }}>
                    {googleStatus.isConnected
                      ? `Connected as ${googleStatus.googleEmail || 'Google User'}`
                      : 'Google Account Not Connected'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#667085', maxWidth: 540, lineHeight: 1.5 }}>
                  {googleStatus.isConnected
                    ? `Connected on ${new Date(googleStatus.connectedAt).toLocaleDateString('en-IN')}. Refresh tokens are encrypted with AES-256-GCM. No passwords or IMAP credentials are stored.`
                    : 'Connect your Google account via official OAuth 2.0. Required scopes: Gmail read-only (for trusted placement senders) and Google Calendar events.'}
                </p>
              </div>

              <div>
                {googleStatus.isConnected ? (
                  <button
                    onClick={handleDisconnectGoogle}
                    style={{
                      background: '#FEF0F0',
                      border: '1px solid #FCA5A5',
                      color: '#DC2626',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    Disconnect Account
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    style={{
                      background: '#0B1F3A',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 2px 6px rgba(11,31,58,0.15)'
                    }}
                  >
                    <CalendarDays size={15} />
                    {connectingGoogle ? 'Connecting…' : 'Connect Google Account'}
                  </button>
                )}
              </div>
            </div>

            {googleStatus.isConnected && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                {/* Gmail Auto-Fetch Toggle */}
                <div style={{
                  background: '#F8FAFD',
                  border: '1px solid #E5EAF0',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={15} color="#2563EB" />
                      <strong style={{ fontSize: 13, color: '#0B1F3A' }}>Automatic Gmail Placement Polling</strong>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#667085' }}>
                      Periodically scans your inbox for placement and internship notifications strictly from configured trusted senders.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={handleSyncGmailNow}
                      disabled={syncingGmail}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5EAF0',
                        color: '#2563EB',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <RefreshCw size={13} className={syncingGmail ? 'spin' : ''} />
                      {syncingGmail ? 'Polling Gmail…' : 'Check Inbox Now'}
                    </button>

                    <button
                      onClick={handleToggleGmailSync}
                      style={{
                        background: googleStatus.gmailSyncEnabled ? '#2563EB' : '#FFFFFF',
                        color: googleStatus.gmailSyncEnabled ? '#FFFFFF' : '#667085',
                        border: `1px solid ${googleStatus.gmailSyncEnabled ? '#2563EB' : '#E5EAF0'}`,
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {googleStatus.gmailSyncEnabled ? 'Auto-Sync: ON' : 'Auto-Sync: OFF'}
                    </button>
                  </div>
                </div>

                {/* Google Calendar Multi-Milestone Sync Toggle */}
                <div style={{
                  background: '#F8FAFD',
                  border: '1px solid #E5EAF0',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={15} color="#15803D" />
                      <strong style={{ fontSize: 13, color: '#0B1F3A' }}>Google Calendar Multi-Milestone Sync</strong>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#667085' }}>
                      Automatically synchronizes Application Deadlines, OA/Assessment Tests, Campus Drives, and Interviews to Google Calendar with 24h & 1h prior popups.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={handleSyncCalendarNow}
                      disabled={syncingCalendar}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5EAF0',
                        color: '#15803D',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <RefreshCw size={13} className={syncingCalendar ? 'spin' : ''} />
                      {syncingCalendar ? 'Syncing Calendar…' : 'Sync All Milestones Now'}
                    </button>

                    <button
                      onClick={handleToggleCalendarSync}
                      style={{
                        background: googleStatus.calendarSyncEnabled ? '#15803D' : '#FFFFFF',
                        color: googleStatus.calendarSyncEnabled ? '#FFFFFF' : '#667085',
                        border: `1px solid ${googleStatus.calendarSyncEnabled ? '#15803D' : '#E5EAF0'}`,
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {googleStatus.calendarSyncEnabled ? 'Calendar Sync: ON' : 'Calendar Sync: OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── CARD 2: TRUSTED PLACEMENT SENDERS (PRIORITY 2) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'senders' || activeTab === 'google') && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderTop: '4px solid #DC2626',
            borderRadius: 14,
            padding: 28,
            boxShadow: '0 1px 3px rgba(11,31,58,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#FEF0F0', border: '1px solid #FCA5A5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626'
                }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 2px 0' }}>
                    Trusted Placement Senders ({trustedSenders.length})
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085' }}>
                    Only emails from these registered campus TPO coordinators and placement cell addresses are fetched and parsed by AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPresetTpo}
                disabled={addingSender}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #BFDBFE',
                  color: '#2563EB',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={13} /> Add PCCOE TPO Preset (srawandale@gmail.com)
              </button>
            </div>

            {/* Add Sender Form */}
            <form onSubmit={handleAddSender} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 10, marginBottom: 18 }}>
              <DarkInput
                placeholder="Sender email (e.g. tpo@college.edu)"
                value={newSender.email}
                onChange={e => setNewSender(s => ({ ...s, email: e.target.value }))}
                prefix="✉"
                accentColor="#DC2626"
              />
              <DarkInput
                placeholder="Label (optional, e.g. College Placement Cell)"
                value={newSender.name}
                onChange={e => setNewSender(s => ({ ...s, name: e.target.value }))}
                accentColor="#DC2626"
              />
              <button
                type="submit"
                disabled={addingSender}
                style={{
                  background: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={14} /> Add Sender
              </button>
            </form>

            {/* Senders List */}
            {loadingSenders ? (
              <div style={{ fontSize: 13, color: '#667085', padding: '12px 0' }}>Loading senders…</div>
            ) : trustedSenders.length === 0 ? (
              <div style={{ fontSize: 13, color: '#667085', padding: '16px', background: '#F8FAFD', borderRadius: 8, textAlign: 'center' }}>
                No trusted sender addresses registered yet. Add your college TPO email above to start automatic fetching.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trustedSenders.map(s => (
                  <div
                    key={s._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#F8FAFD',
                      borderRadius: 8,
                      border: '1px solid #E5EAF0'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, color: '#0B1F3A' }}>{s.email}</strong>
                      {s.name && <span style={{ fontSize: 12, color: '#667085', marginLeft: 8 }}>({s.name})</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSender(s._id, s.email)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#DC3545',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Remove sender"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── CARD 3: NOTIFICATIONS & MILESTONE REMINDERS (PRIORITY 3) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'reminders') && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderTop: '4px solid #D97706',
            borderRadius: 14,
            padding: 28,
            boxShadow: '0 1px 3px rgba(11,31,58,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#FFF7E6', border: '1px solid #FDE68A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706'
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 2px 0' }}>
                    Notifications & Milestone Alerts
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085' }}>
                    Configure automatic desktop popups and reminders for Online Assessment Tests, Drive Dates, Interviews, and Application Deadlines.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Enable Desktop & Test Notification */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleEnableDesktopNotifications}
                  style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    background: browserPermission === 'granted' ? '#EAF8EF' : '#FEF3C7',
                    border: `1px solid ${browserPermission === 'granted' ? '#A7F3D0' : '#FCD34D'}`,
                    color: browserPermission === 'granted' ? '#15803D' : '#B45309',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <BellRing size={13} />
                  {browserPermission === 'granted' ? 'Desktop Alerts Active' : 'Enable Desktop Alerts'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTestNotification('test')}
                  disabled={testingNotification}
                  style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    background: '#0B1F3A', border: 'none', color: '#FFFFFF',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 1px 3px rgba(11,31,58,0.15)',
                  }}
                >
                  <Send size={13} />
                  {testingNotification ? 'Dispatching…' : 'Send Test Notification'}
                </button>
              </div>
            </div>

            {/* Config Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
              <div>
                <FieldLabel htmlFor="reminderLeadHours">Reminder Lead Time</FieldLabel>
                <DarkSelect
                  id="reminderLeadHours"
                  value={settings.reminderLeadHours}
                  accentColor="#D97706"
                  onChange={e => setSettings(s => ({ ...s, reminderLeadHours: Number(e.target.value) }))}
                  options={[
                    { value: 1, label: '1 Hour Before Milestone' },
                    { value: 2, label: '2 Hours Before Milestone' },
                    { value: 6, label: '6 Hours Before Milestone' },
                    { value: 12, label: '12 Hours Before Milestone' },
                    { value: 24, label: '24 Hours Before Milestone (Recommended)' },
                    { value: 48, label: '48 Hours Before Milestone' },
                  ]}
                />
                <span style={{ fontSize: 11, color: '#667085', display: 'block', marginTop: 4 }}>
                  Controls how early before a test or deadline the system alerts you.
                </span>
              </div>

              <div>
                <FieldLabel htmlFor="notificationChannel">Notification Delivery Channel</FieldLabel>
                <DarkSelect
                  id="notificationChannel"
                  value={settings.notificationChannel}
                  accentColor="#D97706"
                  onChange={e => setSettings(s => ({ ...s, notificationChannel: e.target.value }))}
                  options={[
                    { value: 'browser', label: 'Browser Desktop Notifications (Instant Popups)' },
                    { value: 'email', label: 'Email Notifications (via SMTP Credentials)' },
                    { value: 'both', label: 'Both Browser & Email Notifications' },
                  ]}
                />
                <span style={{ fontSize: 11, color: '#667085', display: 'block', marginTop: 4 }}>
                  Desktop popups trigger while using your browser; SMTP sends directly to your email inbox.
                </span>
              </div>
            </div>

            {/* Milestone Event Toggles */}
            <div style={{ background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 10, padding: 18, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3A', marginBottom: 12 }}>
                Milestone Types to Notify:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#172033', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyTests !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyTests: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>🎯 Online Assessments & Tests</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#172033', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyDeadlines !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyDeadlines: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>⏳ Application Deadlines</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#172033', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyDrives !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyDrives: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>🏢 Campus Drive Dates</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#172033', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyInterviews !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyInterviews: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>💼 Interview & Selection Rounds</span>
                </label>
              </div>
            </div>

            {/* Live Upcoming Milestone Reminders Preview */}
            <div style={{ borderTop: '1px solid #E5EAF0', paddingTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3A' }}>
                  Active Upcoming Reminders ({upcomingReminders.length})
                </span>
                <button
                  type="button"
                  onClick={fetchUpcomingReminders}
                  style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {upcomingReminders.length === 0 ? (
                <div style={{ padding: '16px', background: '#F8FAFD', borderRadius: 8, textAlign: 'center', color: '#667085', fontSize: 12.5 }}>
                  🎉 No pending milestones due in the next 14 days. When new placement tests or drive dates arrive, they will automatically be tracked here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingReminders.slice(0, 5).map(rem => (
                    <div
                      key={rem.id}
                      style={{
                        padding: '10px 14px',
                        background: rem.isUrgent ? '#FFFBEB' : '#F8FAFD',
                        borderRadius: 8,
                        border: `1px solid ${rem.isUrgent ? '#FDE68A' : '#E5EAF0'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{rem.icon}</span>
                        <div>
                          <strong style={{ fontSize: 13, color: '#0B1F3A' }}>{rem.company}</strong>
                          <span style={{ fontSize: 12, color: '#667085', marginLeft: 6 }}>
                            {rem.milestoneLabel} ({rem.role})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          {new Date(rem.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: rem.isUrgent ? '#FEF0F0' : '#EAF2FF',
                          color: rem.isUrgent ? '#DC2626' : '#2563EB',
                          border: `1px solid ${rem.isUrgent ? '#FCA5A5' : '#BFDBFE'}`,
                        }}>
                          {rem.hoursLeft > 0 ? `In ${rem.hoursLeft}h` : 'Due today'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── CARD 4: AI EXTRACTION ENGINE (PRIORITY 4) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'ai') && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderTop: '4px solid #18B7A0',
            borderRadius: 14,
            padding: 28,
            boxShadow: '0 1px 3px rgba(11,31,58,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#E8F8F5', border: '1px solid #A3E5D9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#087F71'
                }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 2px 0' }}>
                    AI Extraction Engine Configuration
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085' }}>
                    Powers automated email parsing, autofill extraction, and shortlisted student tracking.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingAi}
                style={{
                  background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#087F71',
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Sparkles size={14} /> {testingAi ? 'Testing…' : 'Test AI Connection'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div>
                <FieldLabel htmlFor="llmProvider">AI Provider</FieldLabel>
                <DarkSelect
                  id="llmProvider"
                  value={isCustomProvider ? 'other' : settings.llmProvider}
                  onChange={e => {
                    if (e.target.value === 'other') {
                      setIsCustomProvider(true);
                      setSettings(s => ({ ...s, llmProvider: '' }));
                    } else {
                      setIsCustomProvider(false);
                      const newP = e.target.value;
                      const defModel = PRESET_MODELS[newP]?.[0]?.value || '';
                      setSettings(s => ({ ...s, llmProvider: newP, llmModel: defModel }));
                    }
                  }}
                  options={PRESET_PROVIDERS}
                />
              </div>

              <div>
                <FieldLabel htmlFor="llmModel">Model</FieldLabel>
                <DarkSelect
                  id="llmModel"
                  value={isCustomModel ? 'other' : settings.llmModel}
                  onChange={e => {
                    if (e.target.value === 'other') {
                      setIsCustomModel(true);
                      setSettings(s => ({ ...s, llmModel: '' }));
                    } else {
                      setIsCustomModel(false);
                      setSettings(s => ({ ...s, llmModel: e.target.value }));
                    }
                  }}
                  options={currentModels}
                />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <FieldLabel htmlFor="llmApiKey">LLM API Key</FieldLabel>
              <DarkInput
                id="llmApiKey"
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your API key (e.g. gsk_... or AIzaSy...)"
                value={settings.llmApiKey}
                onChange={e => setSettings(s => ({ ...s, llmApiKey: e.target.value }))}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{ background: 'transparent', border: 'none', padding: '0 12px', color: '#667085', cursor: 'pointer' }}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── CARD 5: SMTP EMAIL CONFIGURATION (PRIORITY 5) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'email') && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderTop: '4px solid #15803D',
            borderRadius: 14,
            padding: 28,
            boxShadow: '0 1px 3px rgba(11,31,58,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#EAF8EF', border: '1px solid #A7F3D0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D'
                }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 2px 0' }}>
                    SMTP Email Configuration
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085' }}>
                    Configure your Gmail App Password to dispatch reminder emails directly to your personal mailbox.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                style={{
                  background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#15803D',
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Send size={14} /> {testingEmail ? 'Sending…' : 'Send Test Email'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              <div>
                <FieldLabel htmlFor="smtpHost">SMTP Host</FieldLabel>
                <DarkInput
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={e => setSettings(s => ({ ...s, smtpHost: e.target.value }))}
                  accentColor="#15803D"
                />
              </div>
              <div>
                <FieldLabel htmlFor="smtpPort">SMTP Port</FieldLabel>
                <DarkInput
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort}
                  onChange={e => setSettings(s => ({ ...s, smtpPort: Number(e.target.value) }))}
                  accentColor="#15803D"
                />
              </div>
              <div>
                <FieldLabel htmlFor="smtpUser">Sender Email</FieldLabel>
                <DarkInput
                  id="smtpUser"
                  placeholder="your.email@gmail.com"
                  value={settings.smtpUser}
                  onChange={e => setSettings(s => ({ ...s, smtpUser: e.target.value }))}
                  accentColor="#15803D"
                />
              </div>
              <div>
                <FieldLabel htmlFor="smtpPass">Gmail App Password</FieldLabel>
                <DarkInput
                  id="smtpPass"
                  type={showSmtpPass ? 'text' : 'password'}
                  placeholder="16-character app password"
                  value={settings.smtpPass}
                  onChange={e => setSettings(s => ({ ...s, smtpPass: e.target.value }))}
                  accentColor="#15803D"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      style={{ background: 'transparent', border: 'none', padding: '0 12px', color: '#667085', cursor: 'pointer' }}
                    >
                      {showSmtpPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── CARD 6: DATA BACKUP & RESTORE (PRIORITY 6 - FUNCTIONAL!) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderTop: '4px solid #4F46E5',
            borderRadius: 14,
            padding: 28,
            boxShadow: '0 1px 3px rgba(11,31,58,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#EEF2FF', border: '1px solid #C7D2FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5'
                }}>
                  <Database size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 2px 0' }}>
                    Data Backup, Spreadsheet Export & Restore
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085' }}>
                    Safely export complete JSON backups, download Excel-ready CSV spreadsheets, and restore your placement data anytime.
                  </p>
                </div>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    background: '#FFFFFF', border: '1px solid #E5EAF0', color: '#15803D',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 1px 2px rgba(11,31,58,0.05)',
                  }}
                >
                  <FileSpreadsheet size={14} />
                  {exportingCsv ? 'Exporting…' : 'Export CSV (Excel)'}
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    background: '#4F46E5', border: 'none', color: '#FFFFFF',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 1px 3px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  <Download size={14} /> Export Backup (JSON)
                </button>
              </div>
            </div>

            {/* Restore / Import Box */}
            <div style={{ background: '#F8FAFD', border: '1px dashed #CBD5E1', borderRadius: 12, padding: 22, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Upload size={16} color="#4F46E5" />
                <strong style={{ fontSize: 14, color: '#0B1F3A' }}>Restore & Import Data from Backup</strong>
              </div>
              <p style={{ fontSize: 12.5, color: '#667085', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Select an OppTrack JSON backup file to restore your placement opportunities, student profile, and activity history.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'center' }}>
                <div>
                  <input
                    type="file"
                    id="backupFileInput"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="backupFileInput"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 18px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0B1F3A',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(11,31,58,0.04)',
                    }}
                  >
                    <Upload size={14} color="#4F46E5" />
                    {backupFile ? backupFile.name : 'Choose Backup JSON File…'}
                  </label>
                  {backupFile && (
                    <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600, marginLeft: 10 }}>
                      ✓ File Loaded ({Math.round(backupFile.size / 1024)} KB)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#172033', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="backupMode"
                      value="merge"
                      checked={backupMode === 'merge'}
                      onChange={() => setBackupMode('merge')}
                      style={{ accentColor: '#4F46E5' }}
                    />
                    <span>Merge (Recommended)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#172033', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="backupMode"
                      value="replace"
                      checked={backupMode === 'replace'}
                      onChange={() => setBackupMode('replace')}
                      style={{ accentColor: '#DC2626' }}
                    />
                    <span style={{ color: backupMode === 'replace' ? '#DC2626' : 'inherit' }}>Replace All</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleRestoreBackup}
                    disabled={!backupData || importingBackup}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 7,
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: backupData ? '#4F46E5' : '#E2E8F0',
                      color: backupData ? '#FFFFFF' : '#94A3B8',
                      border: 'none',
                      cursor: backupData ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCheck size={14} />
                    {importingBackup ? 'Restoring…' : 'Restore Data'}
                  </button>
                </div>
              </div>
            </div>

            {/* Database & System Info Footnote */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #E5EAF0' }}>
              <div style={{ fontSize: 12, color: '#667085' }}>
                Storage Engine: <strong style={{ color: '#0B1F3A' }}>MongoDB Atlas Cluster</strong> • OppTrack Clinical Career Intelligence v1.5.0
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                All backups are portable JSON and compatible across environments.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── STICKY FLOATING SAVE BAR (WHEN CHANGED) ── */}
      {isDirty && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          background: '#0B1F3A',
          border: '1px solid #18B7A0',
          boxShadow: '0 12px 36px rgba(11, 31, 58, 0.25)',
          borderRadius: 12,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#18B7A0' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>
              You have unsaved setting changes
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setSettings(initialSettings)}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#CBD5E1',
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Reset
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#18B7A0', color: '#0B1F3A', border: 'none',
                padding: '6px 18px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Missing Key Modal Popup */}
      <MissingKeyModal
        isOpen={keyModal.isOpen}
        onClose={() => setKeyModal(k => ({ ...k, isOpen: false }))}
        keyType={keyModal.keyType}
        message={keyModal.message}
      />
    </div>
  );
}
