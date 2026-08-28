import { useEffect, useState } from 'react';
import { settingsAPI } from '../api';
import { 
  Eye, EyeOff, Sparkles, Send, Save, Bell, Download, CheckCircle2, 
  AlertCircle, Cpu, Mail, ShieldCheck, Database, Sliders, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import MissingKeyModal from '../components/MissingKeyModal';

// --- Constants ---
const DEFAULT_SETTINGS = {
  reminderLeadHours: 24,
  notificationChannel: 'email',
  llmProvider: 'groq',
  llmApiKey: '',
  llmModel: 'llama-3.3-70b-versatile',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
};

const PRESET_PROVIDERS = [
  { value: 'groq', label: 'Groq Cloud (Recommended — Ultra Fast & Free)' },
  { value: 'gemini', label: 'Google Gemini (gemini-1.5-flash / Pro)' },
  { value: 'openai', label: 'OpenAI (ChatGPT / GPT-4o)' },
  { value: 'anthropic', label: 'Anthropic (Claude 3.5)' },
  { value: 'openrouter', label: 'OpenRouter.ai (All Open Models)' },
  { value: 'deepseek', label: 'DeepSeek AI' },
  { value: 'together', label: 'Together.ai' },
  { value: 'other', label: '✏️ Custom Provider...' },
];

const PRESET_MODELS = {
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Recommended)' },
    { value: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant (Fastest)' },
    { value: 'llama3-70b-8192', label: 'llama3-70b-8192' },
    { value: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768' },
    { value: 'gemma2-9b-it', label: 'gemma2-9b-it' },
    { value: 'other', label: '✏️ Custom Model...' },
  ],
  gemini: [
    { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Fast & Free)' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash (Latest)' },
    { value: 'gemini-2.0-flash-exp', label: 'gemini-2.0-flash-exp (Experimental)' },
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

function DarkInput({ id, type = 'text', placeholder, value, onChange, prefix, suffix, accentColor = '#B7E34A' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#121413',
      border: `1px solid ${focused ? accentColor : '#2A302B'}`,
      boxShadow: focused ? `0 0 12px ${accentColor}25` : 'none',
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      {prefix && (
        <span style={{ paddingLeft: 14, color: focused ? accentColor : 'rgba(242,243,237,0.4)', fontSize: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
          color: '#F2F3ED',
          fontSize: 14,
          padding: '12px 14px',
          fontFamily: type === 'password' ? 'DM Mono, monospace' : 'inherit',
        }}
      />
      {suffix}
    </div>
  );
}

function DarkSelect({ id, value, onChange, options, accentColor = '#B7E34A', prefix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#121413',
      border: `1px solid ${focused ? accentColor : '#2A302B'}`,
      boxShadow: focused ? `0 0 12px ${accentColor}25` : 'none',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.2s ease',
    }}>
      {prefix && (
        <span style={{ paddingLeft: 14, color: focused ? accentColor : 'rgba(242,243,237,0.4)', fontSize: 16, flexShrink: 0 }}>
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
          color: '#F2F3ED', fontSize: 14, padding: '12px 38px 12px 14px',
          appearance: 'none', cursor: 'pointer',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#171B18', color: '#F2F3ED' }}>{o.label}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 14, color: 'rgba(242,243,237,0.4)', fontSize: 14, pointerEvents: 'none' }}>
        ▾
      </span>
    </div>
  );
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#F2F3ED', marginBottom: 8, letterSpacing: '0.01em' }}>
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

  const handleExport = async () => {
    try {
      const { data } = await settingsAPI.export();
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `opptrack-export-${Date.now()}.json`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Data exported!');
    } catch { toast.error('Export failed'); }
  };

  const currentModels = PRESET_MODELS[settings.llmProvider] || [
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile' },
    { value: 'other', label: '✏️ Custom Model...' },
  ];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const isAiConfigured = Boolean(settings.llmApiKey);
  const isEmailConfigured = Boolean(settings.smtpUser && settings.smtpPass);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', paddingBottom: 100, fontFamily: 'Manrope, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 28, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              System Settings
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(242,243,237,0.6)' }}>
              Configure your user-specific AI extraction keys, email SMTP credentials, and system preferences.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: isDirty ? '#B7E34A' : '#171B18',
              color: isDirty ? '#101311' : '#F2F3ED',
              border: isDirty ? 'none' : '1px solid #2A302B',
              padding: '10px 24px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isDirty ? '0 4px 16px rgba(183, 227, 74, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Save size={16} /> {saving ? 'Saving…' : 'Save All Settings'}
          </button>
        </div>

        {/* ── SYSTEM STATUS BADGES ── */}
        <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: isAiConfigured ? 'rgba(154, 140, 255, 0.12)' : 'rgba(255, 180, 171, 0.12)',
            border: `1px solid ${isAiConfigured ? '#9A8CFF50' : '#ffb4ab50'}`,
            color: isAiConfigured ? '#9A8CFF' : '#ffb4ab',
          }}>
            <Cpu size={15} />
            <span>AI Smart Paste: <strong>{isAiConfigured ? `${settings.llmProvider?.toUpperCase() || 'AI'} Connected` : 'Key Not Added'}</strong></span>
            {isAiConfigured ? <Check size={14} /> : <AlertCircle size={14} />}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: isEmailConfigured ? 'rgba(183, 227, 74, 0.12)' : 'rgba(255, 180, 171, 0.12)',
            border: `1px solid ${isEmailConfigured ? '#B7E34A50' : '#ffb4ab50'}`,
            color: isEmailConfigured ? '#B7E34A' : '#ffb4ab',
          }}>
            <Mail size={15} />
            <span>Email Reminders: <strong>{isEmailConfigured ? 'SMTP Active' : 'Credentials Missing'}</strong></span>
            {isEmailConfigured ? <Check size={14} /> : <AlertCircle size={14} />}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: 'rgba(242, 243, 237, 0.05)',
            border: '1px solid #2A302B',
            color: 'rgba(242, 243, 237, 0.7)',
          }}>
            <ShieldCheck size={15} color="#B7E34A" />
            <span>User Isolated Credentials</span>
          </div>
        </div>
      </header>

      {/* ── SETTINGS NAVIGATION TABS ── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 32,
        background: '#121413', padding: 6, borderRadius: 12, border: '1px solid #2A302B',
        overflowX: 'auto',
      }}>
        {[
          { id: 'all', label: 'All Settings', icon: Sliders },
          { id: 'ai', label: 'AI Integration', icon: Cpu, accent: '#9A8CFF' },
          { id: 'email', label: 'Email & SMTP', icon: Mail, accent: '#B7E34A' },
          { id: 'reminders', label: 'Notifications', icon: Bell, accent: '#3B82F6' },
          { id: 'data', label: 'Data & Backup', icon: Database, accent: '#F59E0B' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: isActive ? '#171B18' : 'transparent',
                color: isActive ? (tab.accent || '#F2F3ED') : 'rgba(242,243,237,0.5)',
                border: isActive ? `1px solid ${tab.accent || '#2A302B'}50` : '1px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} color={isActive ? (tab.accent || '#F2F3ED') : 'currentColor'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── CARD 1: AI INTEGRATION ── */}
        {(activeTab === 'all' || activeTab === 'ai') && (
          <div style={{
            background: '#171B18',
            border: '1px solid #2A302B',
            borderTop: '4px solid #9A8CFF',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'rgba(154, 140, 255, 0.12)', border: '1px solid rgba(154, 140, 255, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A8CFF'
                }}>
                  <Cpu size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F2F3ED', margin: '0 0 2px 0' }}>
                    AI Integration Settings
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(242,243,237,0.55)' }}>
                    Power Smart Paste, automatic email parsing, and follow-up merger with your personal AI key.
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(154, 140, 255, 0.15)', color: '#9A8CFF', border: '1px solid rgba(154, 140, 255, 0.3)'
              }}>
                Strictly Account Specific
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
              {/* Provider Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <FieldLabel htmlFor="llmProvider">AI Provider</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setIsCustomProvider(!isCustomProvider)}
                    style={{ background: 'transparent', border: 'none', color: '#9A8CFF', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isCustomProvider ? '← Select from Presets' : '✏️ Custom Provider'}
                  </button>
                </div>
                {isCustomProvider ? (
                  <DarkInput
                    id="llmProvider"
                    placeholder="e.g. groq / openrouter / deepseek / vllm"
                    value={settings.llmProvider || ''}
                    onChange={e => setSettings(s => ({ ...s, llmProvider: e.target.value }))}
                    accentColor="#9A8CFF"
                    prefix="🤖"
                  />
                ) : (
                  <DarkSelect
                    id="llmProvider"
                    value={settings.llmProvider || 'groq'}
                    accentColor="#9A8CFF"
                    prefix="🤖"
                    options={PRESET_PROVIDERS}
                    onChange={e => {
                      const prov = e.target.value;
                      if (prov === 'other') { setIsCustomProvider(true); setSettings(s => ({ ...s, llmProvider: '' })); return; }
                      const defaultModels = { openai: 'gpt-4o-mini', anthropic: 'claude-3-haiku-20240307', openrouter: 'meta-llama/llama-3.3-70b-instruct' };
                      setIsCustomModel(false);
                      setSettings(s => ({ ...s, llmProvider: prov, llmModel: defaultModels[prov] || 'llama-3.3-70b-versatile' }));
                    }}
                  />
                )}
              </div>

              {/* Model Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <FieldLabel htmlFor="llmModel">LLM Model</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                    style={{ background: 'transparent', border: 'none', color: '#9A8CFF', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isCustomModel ? '← Select from Presets' : '✏️ Custom Model String'}
                  </button>
                </div>
                {isCustomModel ? (
                  <DarkInput
                    id="llmModel"
                    placeholder="e.g. llama-3.3-70b-versatile"
                    value={settings.llmModel || ''}
                    onChange={e => setSettings(s => ({ ...s, llmModel: e.target.value }))}
                    accentColor="#9A8CFF"
                    prefix="⚙"
                  />
                ) : (
                  <DarkSelect
                    id="llmModel"
                    value={settings.llmModel || ''}
                    accentColor="#9A8CFF"
                    prefix="⚙"
                    options={currentModels}
                    onChange={e => {
                      if (e.target.value === 'other') { setIsCustomModel(true); setSettings(s => ({ ...s, llmModel: '' })); return; }
                      setSettings(s => ({ ...s, llmModel: e.target.value }));
                    }}
                  />
                )}
              </div>

              {/* API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <FieldLabel htmlFor="llmApiKey">LLM API Key</FieldLabel>
                  <span style={{ fontSize: 12, color: 'rgba(242,243,237,0.4)', fontFamily: 'DM Mono, monospace' }}>
                    Required for {settings.llmProvider || 'AI'}
                  </span>
                </div>
                <DarkInput
                  id="llmApiKey"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your API key (gsk_… / sk-or-… / sk-…)"
                  value={settings.llmApiKey || ''}
                  onChange={e => setSettings(s => ({ ...s, llmApiKey: e.target.value }))}
                  accentColor="#9A8CFF"
                  prefix="🔐"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.4)', cursor: 'pointer', padding: '0 14px', display: 'flex', alignItems: 'center' }}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>
            </div>

            {/* Test & Save Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, pt: 16, borderTop: '1px solid #2A302B' }}>
              <button
                onClick={handleTestAi}
                disabled={testingAi}
                style={{
                  padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: 'transparent', border: '1px solid #9A8CFF50', color: '#9A8CFF',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={15} /> {testingAi ? 'Validating Key...' : 'Test AI Connection'}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: '#9A8CFF', color: '#101311', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(154, 140, 255, 0.3)',
                }}
              >
                <Save size={15} /> {saving ? 'Saving…' : 'Save AI Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ── CARD 2: EMAIL & SMTP CREDENTIALS ── */}
        {(activeTab === 'all' || activeTab === 'email') && (
          <div style={{
            background: '#171B18',
            border: '1px solid #2A302B',
            borderTop: '4px solid #B7E34A',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'rgba(183, 227, 74, 0.12)', border: '1px solid rgba(183, 227, 74, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B7E34A'
                }}>
                  <Mail size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F2F3ED', margin: '0 0 2px 0' }}>
                    Email & SMTP Configuration
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(242,243,237,0.55)' }}>
                    Configure your personal Gmail App Password or SMTP account to dispatch test notifications & automated reminders.
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(183, 227, 74, 0.15)', color: '#B7E34A', border: '1px solid rgba(183, 227, 74, 0.3)'
              }}>
                No Shared Fallback
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
              {/* Sender Email */}
              <div>
                <FieldLabel htmlFor="smtpUser">Sender Email Address</FieldLabel>
                <DarkInput
                  id="smtpUser" type="email"
                  placeholder="your.email@gmail.com"
                  value={settings.smtpUser || ''}
                  onChange={e => setSettings(s => ({ ...s, smtpUser: e.target.value }))}
                  prefix="✉"
                  accentColor="#B7E34A"
                />
              </div>

              {/* App Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <FieldLabel htmlFor="smtpPass">App Password / SMTP Password</FieldLabel>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: '#B7E34A', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Generate Google App Password ↗
                  </a>
                </div>
                <DarkInput
                  id="smtpPass"
                  type={showSmtpPass ? 'text' : 'password'}
                  placeholder="16-character app password"
                  value={settings.smtpPass || ''}
                  onChange={e => setSettings(s => ({ ...s, smtpPass: e.target.value }))}
                  prefix="🔑"
                  accentColor="#B7E34A"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.4)', cursor: 'pointer', padding: '0 14px', display: 'flex', alignItems: 'center' }}
                    >
                      {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {/* Host & Port */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <FieldLabel htmlFor="smtpHost">SMTP Host</FieldLabel>
                  <DarkInput
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    value={settings.smtpHost || 'smtp.gmail.com'}
                    onChange={e => setSettings(s => ({ ...s, smtpHost: e.target.value }))}
                    accentColor="#B7E34A"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="smtpPort">SMTP Port</FieldLabel>
                  <DarkInput
                    id="smtpPort" type="number"
                    placeholder="587"
                    value={settings.smtpPort || 587}
                    onChange={e => setSettings(s => ({ ...s, smtpPort: Number(e.target.value) }))}
                    accentColor="#B7E34A"
                  />
                </div>
              </div>
            </div>

            {/* Test & Save Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingTop: 16, borderTop: '1px solid #2A302B' }}>
              <button
                onClick={handleTestEmail}
                disabled={testingEmail}
                style={{
                  padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: 'transparent', border: '1px solid #B7E34A50', color: '#B7E34A',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <Send size={15} /> {testingEmail ? 'Sending Test...' : 'Send Test Email'}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: '#B7E34A', color: '#101311', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(183, 227, 74, 0.3)',
                }}
              >
                <Save size={15} /> {saving ? 'Saving…' : 'Save Email Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ── CARD 3: REMINDER & NOTIFICATION PREFERENCES ── */}
        {(activeTab === 'all' || activeTab === 'reminders') && (
          <div style={{
            background: '#171B18',
            border: '1px solid #2A302B',
            borderTop: '4px solid #3B82F6',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6'
              }}>
                <Bell size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F2F3ED', margin: '0 0 2px 0' }}>
                  Deadline Reminder Preferences
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(242,243,237,0.55)' }}>
                  Set lead times for automated placement test & application closing reminders.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
              <div>
                <FieldLabel htmlFor="reminderLeadHours">Lead Time Before Deadline</FieldLabel>
                <DarkSelect
                  id="reminderLeadHours"
                  value={settings.reminderLeadHours}
                  accentColor="#3B82F6"
                  onChange={e => setSettings(s => ({ ...s, reminderLeadHours: Number(e.target.value) }))}
                  options={[
                    { value: 1, label: '1 Hour Before Deadline' },
                    { value: 3, label: '3 Hours Before Deadline' },
                    { value: 12, label: '12 Hours Before Deadline' },
                    { value: 24, label: '24 Hours Before Deadline (Default)' },
                    { value: 48, label: '48 Hours Before Deadline' },
                  ]}
                />
              </div>

              <div>
                <FieldLabel htmlFor="notificationChannel">Notification Delivery Channel</FieldLabel>
                <DarkSelect
                  id="notificationChannel"
                  value={settings.notificationChannel}
                  accentColor="#3B82F6"
                  onChange={e => setSettings(s => ({ ...s, notificationChannel: e.target.value }))}
                  options={[
                    { value: 'email', label: 'Email Notification (via SMTP)' },
                    { value: 'browser', label: 'Browser Toast Notification' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── CARD 4: DATA EXPORT & ABOUT ── */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <div style={{
            background: '#171B18',
            border: '1px solid #2A302B',
            borderTop: '4px solid #F59E0B',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B'
              }}>
                <Database size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F2F3ED', margin: '0 0 2px 0' }}>
                  Data Backup & System Info
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(242,243,237,0.55)' }}>
                  Download a complete JSON export of your placement opportunities, student profile vault, and log history.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
              <div>
                <p style={{ fontSize: 13, color: 'rgba(242,243,237,0.6)', margin: '0 0 4px 0' }}>
                  Local Storage Engine: <strong>MongoDB Instance</strong>
                </p>
                <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.35)' }}>
                  v1.5.0 • PCCOE Placement Tracker Module
                </span>
              </div>

              <button
                onClick={handleExport}
                style={{
                  padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: 'transparent', border: '1px solid #F59E0B70', color: '#F59E0B',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <Download size={15} /> Export All Account Data (JSON)
              </button>
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
          background: '#171B18',
          border: '1px solid #B7E34A',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 24px rgba(183, 227, 74, 0.2)',
          borderRadius: 14,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#B7E34A' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#F2F3ED' }}>
              You have unsaved setting changes
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setSettings(initialSettings)}
              style={{
                background: 'transparent', border: '1px solid #2A302B', color: 'rgba(242,243,237,0.6)',
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Reset
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#B7E34A', color: '#101311', border: 'none',
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
