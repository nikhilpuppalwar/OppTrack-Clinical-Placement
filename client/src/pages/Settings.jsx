import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI, googleAPI, gmailAPI, calendarAPI } from '../api';
import { 
  Eye, EyeOff, Sparkles, Send, Save, Bell, Download, CheckCircle2, 
  AlertCircle, Cpu, Mail, ShieldCheck, Database, Sliders, Check,
  CalendarDays, RefreshCw, Plus, Trash2, ExternalLink, Calendar, Link2,
  Upload, FileSpreadsheet, BellRing, Clock, CheckCheck, AlertTriangle, LogOut, X
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
  llmBaseUrl: '',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
};

const PRESET_PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'deepseek', label: 'DeepSeek AI' },
  { value: 'openrouter', label: 'OpenRouter.ai (Universal Multi-Model API)' },
  { value: 'together', label: 'Together AI' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'groq', label: 'Groq Cloud (Fast LPU Inference — Recommended)' },
  { value: 'ollama', label: 'Ollama / Local LLM (Self-hosted)' },
  { value: 'other', label: '✏️ Custom Provider / OpenAI-Compatible Endpoint...' },
];

const PRESET_MODELS = {
  gemini: [
    { value: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Recommended — Latest & Fastest)' },
    { value: 'gemini-3.7-flash', label: 'gemini-3.7-flash' },
    { value: 'gemini-3.6-flash', label: 'gemini-3.6-flash' },
    { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash' },
    { value: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  openai: [
    { value: 'gpt-5.6-sol', label: 'gpt-5.6-sol (Recommended)' },
    { value: 'gpt-5.6-terra', label: 'gpt-5.6-terra' },
    { value: 'gpt-5.6-luna', label: 'gpt-5.6-luna' },
    { value: 'gpt-5.6-cyber', label: 'gpt-5.6-cyber' },
    { value: 'gpt-5.3-codex', label: 'gpt-5.3-codex' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  anthropic: [
    { value: 'claude-fable-5', label: 'claude-fable-5 (Recommended)' },
    { value: 'claude-opus-5', label: 'claude-opus-5' },
    { value: 'claude-sonnet-5', label: 'claude-sonnet-5' },
    { value: 'claude-opus-4-8', label: 'claude-opus-4-8' },
    { value: 'claude-sonnet-4-6', label: 'claude-sonnet-4-6' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'deepseek-chat (Recommended)' },
    { value: 'deepseek-reasoner', label: 'deepseek-reasoner' },
    { value: 'deepseek-v3', label: 'deepseek-v3' },
    { value: 'deepseek-r1', label: 'deepseek-r1' },
    { value: 'deepseek-coder', label: 'deepseek-coder' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  openrouter: [
    { value: 'openai/gpt-5', label: 'openai/gpt-5' },
    { value: 'anthropic/claude-sonnet', label: 'anthropic/claude-sonnet' },
    { value: 'google/gemini', label: 'google/gemini' },
    { value: 'deepseek/deepseek-chat', label: 'deepseek/deepseek-chat' },
    { value: 'mistralai/mistral-large', label: 'mistralai/mistral-large' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  together: [
    { value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
    { value: 'Qwen/Qwen3-235B-A22B-Instruct', label: 'Qwen/Qwen3-235B-A22B-Instruct' },
    { value: 'deepseek-ai/DeepSeek-V3', label: 'deepseek-ai/DeepSeek-V3' },
    { value: 'deepseek-ai/DeepSeek-R1', label: 'deepseek-ai/DeepSeek-R1' },
    { value: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'mistralai/Mistral-7B-Instruct-v0.3' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  mistral: [
    { value: 'mistral-medium-latest', label: 'mistral-medium-latest' },
    { value: 'mistral-large-latest', label: 'mistral-large-latest' },
    { value: 'mistral-small-latest', label: 'mistral-small-latest' },
    { value: 'mistral-large-3', label: 'mistral-large-3' },
    { value: 'mistral-small-4', label: 'mistral-small-4' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  groq: [
    { value: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b (Recommended — High Quality & Fast)' },
    { value: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b (Ultra Fast)' },
    { value: 'llama-3.3-70b-specdec', label: 'llama-3.3-70b-specdec' },
    { value: 'llama-3.1-70b-versatile', label: 'llama-3.1-70b-versatile' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  ollama: [
    { value: 'llama3.3', label: 'llama3.3 (Local)' },
    { value: 'mistral', label: 'mistral (Local)' },
    { value: 'qwen2.5', label: 'qwen2.5 (Local)' },
    { value: 'deepseek-r1', label: 'deepseek-r1 (Local)' },
    { value: 'other', label: '✏️ Custom Model Name...' },
  ],
  other: [
    { value: 'other', label: '✏️ Enter Custom Model Name...' },
  ],
};

function DarkInput({ id, type = 'text', placeholder, value, onChange, prefix, suffix, accentColor = 'var(--primary-brand)' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--surface)',
      border: `1px solid ${focused ? accentColor : 'var(--border)'}`,
      boxShadow: focused ? `0 0 0 3px var(--primary-brand-glow)` : 'none',
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'all 0.15s ease',
    }}>
      {prefix && (
        <span style={{ paddingLeft: 12, color: focused ? accentColor : 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
          color: 'var(--text-primary)',
          fontSize: 14,
          padding: '10px 12px',
          fontFamily: type === 'password' ? 'ui-monospace, monospace' : 'inherit',
        }}
      />
      {suffix}
    </div>
  );
}

function DarkSelect({ id, value, onChange, options, accentColor = 'var(--primary-brand)', prefix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--surface)',
      border: `1px solid ${focused ? accentColor : 'var(--border)'}`,
      boxShadow: focused ? `0 0 0 3px var(--primary-brand-glow)` : 'none',
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.15s ease',
    }}>
      {prefix && (
        <span style={{ paddingLeft: 12, color: focused ? accentColor : 'var(--text-muted)', fontSize: 14, flexShrink: 0 }}>
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
          color: 'var(--text-primary)', fontSize: 14, padding: '10px 36px 10px 12px',
          appearance: 'none', cursor: 'pointer',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>{o.label}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 12, color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }}>
        ▾
      </span>
    </div>
  );
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
      {children}
    </label>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
        const isKnownProvider = PRESET_PROVIDERS.some(p => p.value === loaded.llmProvider && p.value !== 'other');
        const customProv = !isKnownProvider || loaded.llmProvider === 'other';
        setIsCustomProvider(customProv);
        const providerPresets = PRESET_MODELS[customProv ? 'other' : loaded.llmProvider] || [];
        const isKnownModel = providerPresets.some(m => m.value === loaded.llmModel && m.value !== 'other');
        setIsCustomModel(!isKnownModel || loaded.llmModel === 'other');
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchGoogleStatus();
    fetchSenders();
    fetchUpcomingReminders();

    // Check URL parameters for OAuth return
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      toast.success('Google Account connected successfully.');
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
    const isLocalProvider = settings.llmProvider === 'ollama' || settings.llmBaseUrl?.includes('localhost') || settings.llmBaseUrl?.includes('127.0.0.1');
    if (!settings.llmApiKey && !isLocalProvider) {
      return setKeyModal({
        isOpen: true,
        keyType: 'AI',
        message: 'No API Key found in your account settings. Please enter your LLM API Key before testing.',
      });
    }
    setTestingAi(true);
    const id = toast.loading(`Testing ${settings.llmProvider || 'AI'} connection (${settings.llmModel || 'default'})...`);
    try {
      const { data } = await settingsAPI.testAiKey({
        ...settings,
        llmApiKey: settings.llmApiKey || (isLocalProvider ? 'ollama' : '')
      });
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
        title: data?.notification?.title || 'Test Reminder: Online Assessment Alert',
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

  const activeProviderKey = isCustomProvider ? 'other' : settings.llmProvider;
  const currentModels = PRESET_MODELS[activeProviderKey] || PRESET_MODELS.other || [
    { value: 'other', label: '✏️ Enter Custom Model Name...' },
  ];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const isAiConfigured = Boolean(settings.llmApiKey);
  const isEmailConfigured = Boolean(settings.smtpUser && settings.smtpPass);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 100, fontFamily: 'Manrope, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              System Settings & Integrations
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
              Manage your Google Cloud OAuth, placement milestone alerts, AI parser, SMTP reminders, and database backups.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--primary-brand)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 22px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-plum)',
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
            background: googleStatus.isConnected ? 'var(--info-bg)' : googleStatus.tokenExpired ? 'var(--warning-bg)' : 'var(--card-subtle)',
            border: `1px solid ${googleStatus.isConnected ? 'var(--info)' : googleStatus.tokenExpired ? 'var(--warning)' : 'var(--border)'}`,
            color: googleStatus.isConnected ? 'var(--info)' : googleStatus.tokenExpired ? 'var(--warning)' : 'var(--text-secondary)',
          }}>
            <CalendarDays size={13} />
            <span>Google Sync: <strong>{googleStatus.isConnected ? (googleStatus.googleEmail || 'Connected') : googleStatus.tokenExpired ? 'Session Expired' : 'Not Connected'}</strong></span>
            {googleStatus.isConnected ? <Check size={12} /> : googleStatus.tokenExpired ? <AlertTriangle size={12} /> : <span style={{ fontSize: 11, opacity: 0.7 }}>OAuth</span>}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: browserPermission === 'granted' ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: `1px solid ${browserPermission === 'granted' ? 'var(--success)' : 'var(--warning)'}`,
            color: browserPermission === 'granted' ? 'var(--success)' : 'var(--warning)',
          }}>
            <Bell size={13} />
            <span>Browser Alerts: <strong>{browserPermission === 'granted' ? 'Enabled' : 'Permission Needed'}</strong></span>
            {browserPermission === 'granted' ? <Check size={12} /> : <AlertTriangle size={12} />}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: isAiConfigured ? 'var(--brand-light)' : 'var(--danger-bg)',
            border: `1px solid ${isAiConfigured ? 'var(--primary-brand)' : 'var(--danger)'}`,
            color: isAiConfigured ? 'var(--primary-brand)' : 'var(--danger)',
          }}>
            <Cpu size={13} />
            <span>AI Parser: <strong>{isAiConfigured ? `${settings.llmProvider?.toUpperCase()} Ready` : 'Key Missing'}</strong></span>
            {isAiConfigured ? <Check size={12} /> : <AlertCircle size={12} />}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
          }}>
            <Mail size={13} />
            <span>Email Reminders: <strong>Active (Automated)</strong></span>
          </div>
        </div>
      </header>

      {/* ── SETTINGS NAVIGATION TABS (ORDERED BY IMPORTANCE) ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 26,
        background: 'var(--card-subtle)', padding: 5, borderRadius: 10, border: '1px solid var(--border)',
        overflowX: 'auto',
      }}>
        {[
          { id: 'all', label: 'All Settings', icon: Sliders },
          { id: 'google', label: '1. Google & Sync', icon: CalendarDays, accent: 'var(--info)' },
          { id: 'senders', label: '2. Trusted Senders', icon: Mail, accent: 'var(--danger)' },
          { id: 'reminders', label: '3. Notifications & Alerts', icon: Bell, accent: 'var(--warning)' },
          { id: 'ai', label: '4. AI Engine', icon: Cpu, accent: 'var(--primary-brand)' },
          { id: 'data', label: '5. Data & Backup', icon: Database, accent: 'var(--indigo)' },
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
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all var(--motion-fast) var(--ease-standard)',
              }}
            >
              <Icon size={14} color={isActive ? (tab.accent || 'var(--primary-brand)') : 'var(--text-muted)'} />
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: '4px solid #2563EB',
            borderRadius: 14,
            padding: 28,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6'
                }}>
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    Google Cloud & OAuth Integration
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Auto-fetch placement emails via Gmail API and synchronize application deadlines, test dates, and drives to Google Calendar.
                  </p>
                </div>
              </div>

              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '4px 10px', borderRadius: 6,
                background: googleStatus.isConnected ? 'rgba(16, 185, 129, 0.12)' : googleStatus.tokenExpired ? 'rgba(245, 158, 11, 0.12)' : 'var(--card-subtle)',
                color: googleStatus.isConnected ? '#10B981' : googleStatus.tokenExpired ? 'var(--amber-text, #F59E0B)' : 'var(--text-secondary)',
                border: `1px solid ${googleStatus.isConnected ? 'rgba(16, 185, 129, 0.3)' : googleStatus.tokenExpired ? 'rgba(245, 158, 11, 0.3)' : 'var(--border)'}`
              }}>
                {googleStatus.isConnected ? 'OAuth Active' : googleStatus.tokenExpired ? '⚠️ Session Expired' : 'Not Connected'}
              </span>
            </div>

            {/* Google OAuth Connection Box */}
            <div style={{
              background: googleStatus.tokenExpired ? 'rgba(245, 158, 11, 0.08)' : 'var(--card-subtle)',
              border: `1px solid ${googleStatus.isConnected ? 'rgba(16, 185, 129, 0.3)' : googleStatus.tokenExpired ? 'rgba(245, 158, 11, 0.3)' : 'var(--border)'}`,
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
                    background: googleStatus.isConnected ? '#10B981' : googleStatus.tokenExpired ? '#EF4444' : '#F59E0B'
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {googleStatus.isConnected
                      ? `Connected as ${googleStatus.googleEmail || 'Google User'}`
                      : googleStatus.tokenExpired
                        ? `Session Expired (${googleStatus.googleEmail || 'Google Account'})`
                        : 'Google Account Not Connected'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: googleStatus.tokenExpired ? 'var(--amber-text, #F59E0B)' : 'var(--text-secondary)', maxWidth: 540, lineHeight: 1.5 }}>
                  {googleStatus.isConnected
                    ? `Connected on ${new Date(googleStatus.connectedAt).toLocaleDateString('en-IN')}. Refresh tokens are encrypted with AES-256-GCM. No passwords or IMAP credentials are stored.`
                    : googleStatus.tokenExpired
                      ? 'Your Google authorization expired or was revoked (invalid_grant). Google periodically expires test tokens. Click below to reconnect and restore Gmail sync & Google Calendar integration.'
                      : 'Connect your Google account via official OAuth 2.0. Required scopes: Gmail read-only (for trusted placement senders) and Google Calendar events.'}
                </p>
              </div>

              <div>
                {googleStatus.isConnected ? (
                  <button
                    onClick={handleDisconnectGoogle}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'var(--danger, #DC2626)',
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
                      background: 'var(--primary-brand)',
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
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {googleStatus.tokenExpired ? <RefreshCw size={15} className={connectingGoogle ? 'spin' : ''} /> : <CalendarDays size={15} />}
                    {connectingGoogle ? 'Connecting…' : googleStatus.tokenExpired ? 'Reconnect Google Account' : 'Connect Google Account'}
                  </button>
                )}
              </div>
            </div>

            {/* Google OAuth Beta Tester Notice Banner */}
            <div style={{
              marginBottom: 20,
              background: 'rgba(24, 183, 160, 0.12)',
              border: '1px solid rgba(24, 183, 160, 0.25)',
              borderRadius: 10,
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="var(--primary-brand)" />
                <div>
                  <strong style={{ fontSize: 13, color: 'var(--primary-brand)' }}>Google OAuth 100-User Testing Mode Active</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Google limits OAuth testing to 100 users. If your Gmail is not yet authorized in Google Cloud Console, submit your request to be added.
                  </p>
                </div>
              </div>

              <Link
                to="/google-tester"
                style={{
                  background: 'var(--primary-brand)',
                  color: '#FFFFFF',
                  padding: '7px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Request / Manage Tester Access →
              </Link>
            </div>

            {googleStatus.isConnected && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                {/* Gmail Auto-Fetch Toggle */}
                <div style={{
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
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
                      <Mail size={15} color="#3B82F6" />
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Automatic Gmail Placement Polling</strong>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                      Periodically scans your inbox for placement and internship notifications strictly from configured trusted senders.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={handleSyncGmailNow}
                      disabled={syncingGmail}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: '#3B82F6',
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
                        background: googleStatus.gmailSyncEnabled ? '#2563EB' : 'var(--surface)',
                        color: googleStatus.gmailSyncEnabled ? '#FFFFFF' : 'var(--text-secondary)',
                        border: `1px solid ${googleStatus.gmailSyncEnabled ? '#2563EB' : 'var(--border)'}`,
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
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
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
                      <Calendar size={15} color="#10B981" />
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Google Calendar Multi-Milestone Sync</strong>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                      Automatically synchronizes Application Deadlines, OA/Assessment Tests, Campus Drives, and Interviews to Google Calendar with 24h & 1h prior popups.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={handleSyncCalendarNow}
                      disabled={syncingCalendar}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: '#10B981',
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
                        background: googleStatus.calendarSyncEnabled ? '#10B981' : 'var(--surface)',
                        color: googleStatus.calendarSyncEnabled ? '#FFFFFF' : 'var(--text-secondary)',
                        border: `1px solid ${googleStatus.calendarSyncEnabled ? '#10B981' : 'var(--border)'}`,
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: '4px solid #DC2626',
            borderRadius: 14,
            padding: 28,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626'
                }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    Trusted Placement Senders ({trustedSenders.length})
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Only emails from these registered campus TPO coordinators and placement cell addresses are fetched and parsed by AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPresetTpo}
                disabled={addingSender}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: '#3B82F6',
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
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '12px 0' }}>Loading senders…</div>
            ) : trustedSenders.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '16px', background: 'var(--card-subtle)', borderRadius: 8, textAlign: 'center' }}>
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
                      background: 'var(--card-subtle)',
                      borderRadius: 8,
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.email}</strong>
                      {s.name && <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>({s.name})</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSender(s._id, s.email)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger, #DC3545)',
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: '4px solid #D97706',
            borderRadius: 14,
            padding: 28,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(217, 119, 6, 0.12)', border: '1px solid rgba(217, 119, 6, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706'
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    Notifications & Milestone Alerts
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
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
                    background: browserPermission === 'granted' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${browserPermission === 'granted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    color: browserPermission === 'granted' ? '#10B981' : 'var(--amber-text, #F59E0B)',
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
                    background: 'var(--primary-brand)', border: 'none', color: '#FFFFFF',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
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
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>
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
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>
                  Desktop popups trigger while using your browser; SMTP sends directly to your email inbox.
                </span>
              </div>
            </div>

            {/* Milestone Event Toggles */}
            <div style={{ background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: 18, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                Milestone Types to Notify:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyTests !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyTests: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>Online Assessments &amp; Tests</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyDeadlines !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyDeadlines: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>Application Deadlines</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyDrives !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyDrives: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>Campus Drive Dates</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifyInterviews !== false}
                    onChange={e => setSettings(s => ({ ...s, notifyInterviews: e.target.checked }))}
                    style={{ accentColor: '#D97706', width: 16, height: 16 }}
                  />
                  <span>Interview &amp; Selection Rounds</span>
                </label>
              </div>
            </div>

            {/* Live Upcoming Milestone Reminders Preview */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Upcoming Reminders ({upcomingReminders.length})
                </span>
                <button
                  type="button"
                  onClick={fetchUpcomingReminders}
                  style={{ background: 'transparent', border: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {upcomingReminders.length === 0 ? (
                <div style={{ padding: '16px', background: 'var(--card-subtle)', borderRadius: 8, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12.5 }}>
                  No pending milestones due in the next 14 days. When new placement tests or drive dates arrive, they will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingReminders.slice(0, 5).map(rem => (
                    <div
                      key={rem.id}
                      style={{
                        padding: '10px 14px',
                        background: rem.isUrgent ? 'rgba(245, 158, 11, 0.1)' : 'var(--card-subtle)',
                        borderRadius: 8,
                        border: `1px solid ${rem.isUrgent ? 'rgba(245, 158, 11, 0.3)' : 'var(--border)'}`,
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
                          <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{rem.company}</strong>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>
                            {rem.milestoneLabel} ({rem.role})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {new Date(rem.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: rem.isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                          color: rem.isUrgent ? '#EF4444' : '#3B82F6',
                          border: `1px solid ${rem.isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: '4px solid #18B7A0',
            borderRadius: 14,
            padding: 28,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(24, 183, 160, 0.12)', border: '1px solid rgba(24, 183, 160, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18B7A0'
                }}>
                  <Cpu size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    AI Extraction Engine Configuration
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Powers automated email parsing, autofill extraction, and shortlisted student tracking.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestAi}
                disabled={testingAi}
                style={{
                  background: 'var(--card-subtle)', border: '1px solid var(--border)', color: '#18B7A0',
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
                      setSettings(s => ({
                        ...s,
                        llmProvider: newP,
                        llmModel: defModel,
                        llmBaseUrl: newP === 'ollama' ? 'http://localhost:11434/v1' : s.llmBaseUrl
                      }));
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

            {/* Custom Provider & Base URL Inputs */}
            {isCustomProvider && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 16 }}>
                <div>
                  <FieldLabel htmlFor="customProviderInput">Custom Provider Identifier</FieldLabel>
                  <DarkInput
                    id="customProviderInput"
                    placeholder="e.g. vllm, lmstudio, perplexity, deepseek, together"
                    value={settings.llmProvider}
                    onChange={e => setSettings(s => ({ ...s, llmProvider: e.target.value }))}
                  />
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    Identifier name for logging and provider-specific endpoint resolution.
                  </span>
                </div>

                <div>
                  <FieldLabel htmlFor="llmBaseUrl">API Base URL / Endpoint (OpenAI Compatible)</FieldLabel>
                  <DarkInput
                    id="llmBaseUrl"
                    placeholder="e.g. http://localhost:11434/v1 or https://api.perplexity.ai"
                    value={settings.llmBaseUrl || ''}
                    onChange={e => setSettings(s => ({ ...s, llmBaseUrl: e.target.value }))}
                  />
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    Custom root or /chat/completions URL for self-hosted or proxy endpoints.
                  </span>
                </div>
              </div>
            )}

            {/* Custom Model Input */}
            {isCustomModel && (
              <div style={{ marginTop: 16 }}>
                <FieldLabel htmlFor="customModelInput">Custom Model Identifier / Name</FieldLabel>
                <DarkInput
                  id="customModelInput"
                  placeholder="e.g. gpt-4.5-preview, llama-3.3:70b, deepseek-chat, qwen-2.5-72b-instruct"
                  value={settings.llmModel}
                  onChange={e => setSettings(s => ({ ...s, llmModel: e.target.value }))}
                />
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                  Enter the exact model string required by your chosen provider.
                </span>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <FieldLabel htmlFor="llmApiKey">LLM API Key</FieldLabel>
                {(settings.llmProvider === 'ollama' || settings.llmBaseUrl?.includes('localhost')) && (
                  <span style={{ fontSize: 11.5, color: '#10B981', fontWeight: 600 }}>
                    Local endpoint detected — API key is optional
                  </span>
                )}
              </div>
              <DarkInput
                id="llmApiKey"
                type={showKey ? 'text' : 'password'}
                placeholder={
                  settings.llmProvider === 'ollama' || settings.llmBaseUrl?.includes('localhost')
                    ? 'Optional for local Ollama / LM Studio (leave blank or enter "ollama")'
                    : 'Enter your API key (e.g. gsk_... or AIzaSy... or sk-...)'
                }
                value={settings.llmApiKey}
                onChange={e => setSettings(s => ({ ...s, llmApiKey: e.target.value }))}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{ background: 'transparent', border: 'none', padding: '0 12px', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── CARD 5: DATA BACKUP & RESTORE (PRIORITY 5 - FUNCTIONAL!) ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: '4px solid #6366F1',
            borderRadius: 14,
            padding: 28,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1'
                }}>
                  <Database size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    Data Backup, Spreadsheet Export & Restore
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
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
                    background: 'var(--card-subtle)', border: '1px solid var(--border)', color: '#10B981',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: 'var(--shadow-sm)',
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
                    background: '#6366F1', border: 'none', color: '#FFFFFF',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 1px 3px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <Download size={14} /> Export Backup (JSON)
                </button>
              </div>
            </div>

            {/* Restore / Import Box */}
            <div style={{ background: 'var(--card-subtle)', border: '1px dashed var(--border)', borderRadius: 12, padding: 22, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Upload size={16} color="#6366F1" />
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Restore & Import Data from Backup</strong>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
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
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Upload size={14} color="#6366F1" />
                    {backupFile ? backupFile.name : 'Choose Backup JSON File…'}
                  </label>
                  {backupFile && (
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginLeft: 10 }}>
                      ✓ File Loaded ({Math.round(backupFile.size / 1024)} KB)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="backupMode"
                      value="merge"
                      checked={backupMode === 'merge'}
                      onChange={() => setBackupMode('merge')}
                      style={{ accentColor: '#6366F1' }}
                    />
                    <span>Merge (Recommended)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="backupMode"
                      value="replace"
                      checked={backupMode === 'replace'}
                      onChange={() => setBackupMode('replace')}
                      style={{ accentColor: '#EF4444' }}
                    />
                    <span style={{ color: backupMode === 'replace' ? '#EF4444' : 'inherit' }}>Replace All</span>
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
                      background: backupData ? '#6366F1' : 'var(--border)',
                      color: backupData ? '#FFFFFF' : 'var(--text-muted)',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Storage Engine: <strong style={{ color: 'var(--text-primary)' }}>MongoDB Atlas Cluster</strong> • OppTrack Clinical Career Intelligence v1.5.0
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                All backups are portable JSON and compatible across environments.
              </div>
            </div>
          </div>
        )}

        {/* ── CARD 6: ACCOUNT & AUTHENTICATION SESSION ── */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Account & Active Session
              </h3>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '2px 8px', borderRadius: 9999 }}>
                Signed In
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.name || 'Student'}</strong> ({user?.email || 'N/A'})
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#EF4444',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all var(--motion-fast) var(--ease-standard)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={16} />
            <span>Sign Out of OppTrack</span>
          </button>
        </div>

      </div>

      {/* ── STICKY FLOATING SAVE BAR (WHEN CHANGED) ── */}
      {isDirty && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          background: 'var(--surface)',
          border: '1px solid var(--primary-brand)',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 12,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-brand)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              You have unsaved setting changes
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setSettings(initialSettings)}
              style={{
                background: 'var(--card-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Reset
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--primary-brand)', color: '#FFFFFF', border: 'none',
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

      {/* Sign Out Confirmation Modal via Portal */}
      {showLogoutConfirm && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 31, 58, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            pointerEvents: 'auto',
            animation: 'fadeIn var(--motion-fast) var(--ease-standard)',
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '28px 24px 22px',
              maxWidth: 400,
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              pointerEvents: 'auto',
              animation: 'scaleIn var(--motion-fast) var(--ease-spring)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
              }}
              title="Cancel"
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                marginBottom: 16,
              }}
            >
              <LogOut size={26} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Sign Out Confirmation
            </h3>

            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 24px 0' }}>
              Are you sure you want to log out of your OppTrack session? You will need to sign in again to access your profile vault and opportunities.
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--card-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                }}
              >
                <LogOut size={16} />
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
