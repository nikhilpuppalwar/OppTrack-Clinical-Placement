import { useEffect, useState } from 'react';
import { settingsAPI } from '../api';
import { Eye, EyeOff, Sparkles, Send, Save, Bell, Download, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  { value: 'groq', label: 'Groq Cloud (Recommended — Free & Fast)' },
  { value: 'openai', label: 'OpenAI (ChatGPT / GPT-4o)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openrouter', label: 'OpenRouter.ai (All Open Models)' },
  { value: 'deepseek', label: 'DeepSeek AI' },
  { value: 'together', label: 'Together.ai' },
  { value: 'other', label: '✏️ Custom Provider...' },
];

const PRESET_MODELS = {
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Recommended)' },
    { value: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant (Fastest)' },
    { value: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768' },
    { value: 'deepseek-r1-distill-llama-70b', label: 'deepseek-r1-distill-llama-70b' },
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

// Reusable dark input field with optional prefix icon
function DarkInput({ id, type = 'text', placeholder, value, onChange, prefix, suffix, accentColor = '#B7E34A' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#171B18',
      border: `1px solid ${focused ? accentColor : '#2A302B'}`,
      borderRadius: 6,
      overflow: 'hidden',
      transition: 'border-color 0.15s ease',
    }}>
      {prefix && (
        <span style={{ padding: '0 12px', color: 'rgba(242,243,237,0.4)', fontSize: 18, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
          padding: '10px 12px',
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
      background: '#171B18',
      border: `1px solid ${focused ? accentColor : '#2A302B'}`,
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative',
      transition: 'border-color 0.15s ease',
    }}>
      {prefix && (
        <span style={{ padding: '0 12px', color: 'rgba(242,243,237,0.4)', fontSize: 18, flexShrink: 0 }}>
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
          color: '#F2F3ED', fontSize: 14, padding: '10px 36px 10px 12px',
          appearance: 'none', cursor: 'pointer',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#171B18' }}>{o.label}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 12, color: 'rgba(242,243,237,0.4)', fontSize: 18, pointerEvents: 'none' }}>
        ▾
      </span>
    </div>
  );
}

// Styled label above each input
function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#F2F3ED', marginBottom: 6, letterSpacing: '0.01em' }}>
      {children}
    </label>
  );
}

// Section divider hr
const HR = () => <hr style={{ border: 'none', borderTop: '1px solid #2A302B', margin: '0' }} />;

// Section wrapper (2-column: left label, right form)
function Section({ label, description, badge, badgeColor = '#B7E34A', children, accentColor = '#B7E34A' }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40, alignItems: 'start' }}>
      <div>
        <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F2F3ED', marginBottom: 12 }}>
          {label}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(242,243,237,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
          {description}
        </p>
        {badge && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${badgeColor}15`, color: badgeColor,
            border: `1px solid ${badgeColor}40`,
            padding: '6px 12px', borderRadius: 6, fontSize: 13
          }}>
            <CheckCircle2 size={14} />
            {badge}
          </div>
        )}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isCustomProvider, setIsCustomProvider] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  useEffect(() => {
    settingsAPI.get()
      .then(({ data }) => {
        const loaded = { ...DEFAULT_SETTINGS, ...data };
        setSettings(loaded);
        const isKnownProvider = PRESET_PROVIDERS.some(p => p.value === loaded.llmProvider);
        if (!isKnownProvider && loaded.llmProvider) setIsCustomProvider(true);
        const providerPresets = PRESET_MODELS[loaded.llmProvider] || [];
        const isKnownModel = providerPresets.some(m => m.value === loaded.llmModel);
        if (!isKnownModel && loaded.llmModel) setIsCustomModel(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.smtpUser || !settings.smtpPass) return toast.error('Enter SMTP email and password first');
    setTestingEmail(true);
    const id = toast.loading('Sending test email...');
    try {
      const { data } = await settingsAPI.testEmail(settings);
      toast.success(data.message || 'Test email sent!', { id });
    } catch (err) {
      toast.error(err.response?.data?.message || 'SMTP failed. Check credentials.', { id });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestAi = async () => {
    if (!settings.llmApiKey) return toast.error('Enter your AI API key first');
    setTestingAi(true);
    const id = toast.loading(`Testing ${settings.llmProvider || 'AI'} connection...`);
    try {
      const { data } = await settingsAPI.testAiKey(settings);
      toast.success(data.message || 'AI connected!', { id });
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI test failed.', { id });
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

  // Button styles
  const btnGhost = {
    background: 'transparent', border: '1px solid #2A302B', color: '#F2F3ED',
    padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease',
  };
  const btnLime = {
    background: '#171B18', color: '#F2F3ED',
    border: 'none', borderBottom: '2px solid #B7E34A',
    padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  };
  const btnViolet = {
    background: '#171B18', color: '#F2F3ED',
    border: 'none', borderBottom: '2px solid #9A8CFF',
    padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* Page Header */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 32, marginBottom: 48 }}>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: 'rgba(242,243,237,0.6)' }}>
          Manage notifications, AI integrations and account preferences.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* ── SECTION 1: Email Notifications ── */}
        <Section
          label="Email Notifications"
          description="Configure your SMTP settings to receive placement alerts and daily summaries directly to your inbox."
          badge={settings.smtpUser ? 'Email configured' : undefined}
          badgeColor="#B7E34A"
        >
          <div style={{ borderTop: '2px solid #B7E34A', paddingTop: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>

              {/* Sender Email */}
              <div>
                <FieldLabel htmlFor="smtpUser">Sender Email</FieldLabel>
                <DarkInput
                  id="smtpUser" type="email"
                  placeholder="name@domain.com"
                  value={settings.smtpUser || ''}
                  onChange={e => setSettings(s => ({ ...s, smtpUser: e.target.value }))}
                  prefix="✉"
                />
              </div>

              {/* App Password */}
              <div>
                <FieldLabel htmlFor="smtpPass">App Password</FieldLabel>
                <DarkInput
                  id="smtpPass"
                  type={showSmtpPass ? 'text' : 'password'}
                  placeholder="Gmail 16-char app password"
                  value={settings.smtpPass || ''}
                  onChange={e => setSettings(s => ({ ...s, smtpPass: e.target.value }))}
                  prefix="🔑"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.4)', cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center' }}
                    >
                      {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {/* SMTP Host + Port (2-col) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel htmlFor="smtpHost">SMTP Host</FieldLabel>
                  <DarkInput
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    value={settings.smtpHost || 'smtp.gmail.com'}
                    onChange={e => setSettings(s => ({ ...s, smtpHost: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="smtpPort">SMTP Port</FieldLabel>
                  <DarkInput
                    id="smtpPort" type="number"
                    placeholder="587"
                    value={settings.smtpPort || 587}
                    onChange={e => setSettings(s => ({ ...s, smtpPort: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button style={btnGhost} onClick={handleTestEmail} disabled={testingEmail}>
                <Send size={14} /> {testingEmail ? 'Sending...' : 'Send Test Email'}
              </button>
              <button style={btnLime} onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Section>

        <HR />

        {/* ── SECTION 2: AI Integration ── */}
        <Section
          label="AI Integration"
          description="Connect your preferred LLM provider to power OppTrack's Smart Paste and intelligent email extraction features."
          badge={settings.llmApiKey ? 'AI Smart Paste connected' : undefined}
          badgeColor="#9A8CFF"
        >
          <div style={{ borderTop: '2px solid #9A8CFF', paddingTop: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>

              {/* Provider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <FieldLabel htmlFor="llmProvider">Provider</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setIsCustomProvider(!isCustomProvider)}
                    style={{ background: 'transparent', border: 'none', color: '#9A8CFF', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isCustomProvider ? '← Use Presets' : '✏️ Custom'}
                  </button>
                </div>
                {isCustomProvider ? (
                  <DarkInput
                    id="llmProvider"
                    placeholder="e.g. groq / openrouter / deepseek"
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

              {/* Model */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <FieldLabel htmlFor="llmModel">Model</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                    style={{ background: 'transparent', border: 'none', color: '#9A8CFF', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isCustomModel ? '← Use Presets' : '✏️ Custom'}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <FieldLabel htmlFor="llmApiKey">API Key</FieldLabel>
                  <span style={{ fontSize: 12, color: 'rgba(242,243,237,0.4)', fontFamily: 'DM Mono, monospace' }}>
                    For {settings.llmProvider || 'provider'}
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
                      style={{ background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.4)', cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button style={btnGhost} onClick={handleTestAi} disabled={testingAi}>
                <Sparkles size={14} /> {testingAi ? 'Testing...' : 'Test AI Connection'}
              </button>
              <button style={btnViolet} onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Section>

        <HR />

        {/* ── SECTION 3: Reminder Preferences ── */}
        <Section
          label="Reminder Preferences"
          description="Set how far in advance you receive deadline reminder notifications for placement tests and registration closings."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <FieldLabel htmlFor="reminderLeadHours">Reminder Lead Time</FieldLabel>
              <DarkSelect
                id="reminderLeadHours"
                value={settings.reminderLeadHours}
                onChange={e => setSettings(s => ({ ...s, reminderLeadHours: Number(e.target.value) }))}
                options={[
                  { value: 1, label: '1 hour before deadline' },
                  { value: 3, label: '3 hours before deadline' },
                  { value: 12, label: '12 hours before deadline' },
                  { value: 24, label: '24 hours before deadline (default)' },
                  { value: 48, label: '48 hours before deadline' },
                ]}
              />
            </div>
            <div>
              <FieldLabel htmlFor="notificationChannel">Notification Channel</FieldLabel>
              <DarkSelect
                id="notificationChannel"
                value={settings.notificationChannel}
                onChange={e => setSettings(s => ({ ...s, notificationChannel: e.target.value }))}
                options={[
                  { value: 'email', label: 'Email Notification' },
                  { value: 'browser', label: 'Browser Notification' },
                ]}
              />
            </div>
            <div>
              <button style={btnLime} onClick={handleSave} disabled={saving}>
                <Save size={14} /> Save Preferences
              </button>
            </div>
          </div>
        </Section>

        <HR />

        {/* ── SECTION 4: Data Export ── */}
        <Section
          label="Data & Backup"
          description="Download a complete JSON backup of your opportunities, profile vault, and activity history."
        >
          <div>
            <p style={{ fontSize: 14, color: 'rgba(242,243,237,0.5)', marginBottom: 20, fontFamily: 'DM Mono, monospace' }}>
              All your data is stored locally in your MongoDB instance.
            </p>
            <button style={btnGhost} onClick={handleExport}>
              <Download size={14} /> Export All My Data
            </button>
          </div>
        </Section>

        <HR />

        {/* ── SECTION 5: About ── */}
        <Section
          label="About OppTrack"
          description="Personal placement & internship tracking system built for B.Tech students with AI-powered email extraction."
        >
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'rgba(242,243,237,0.3)', lineHeight: 1.8 }}>
            <div>v1.5.0 — Built with ❤️ for PCCOE students</div>
            <div>AI Smart Paste • Automated Reminders • Calendar Sync</div>
          </div>
        </Section>

      </div>
    </div>
  );
}
