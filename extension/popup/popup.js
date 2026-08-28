/**
 * OppTrack Extension — Popup Logic
 *
 * Fully synchronized with Website AI Integration Settings (Groq, OpenAI, Anthropic, OpenRouter, DeepSeek, etc.)
 */

const $ = (id) => document.getElementById(id);

let currentTab = null;
let matchedOpp = null;

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

let isCustomProvider = false;
let isCustomModel = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  const auth = await msg('GET_AUTH');
  if (!auth.token) {
    show('login-view');
    return;
  }

  show('main-view');
  const name = auth.user?.name || auth.user?.email || 'User';
  $('user-name').textContent = name;

  // Load Settings (API Key, Provider, Model)
  loadSettings();

  // Determine if current page is a Google Form
  const isGoogleForm =
    tab?.url?.includes('docs.google.com/forms') && !tab?.url?.includes('formResponse');

  if (isGoogleForm) {
    $('status-dot').className = 'status-dot ready';
    $('status-text').textContent = 'Google Form detected — ready for AI fill';
    $('autofill-btn').disabled = false;
    $('analyze-btn').disabled = false;

    try {
      const res = await msg('MATCH_URL', { url: tab.url });
      if (res.ok && res.data) {
        matchedOpp = res.data;
        $('opp-title').textContent = `${matchedOpp.company} — ${matchedOpp.role}`;
        $('opp-banner').classList.remove('hidden');

        await msg('REGISTER_PENDING_SUBMISSION', {
          tabId: tab.id,
          opportunityId: matchedOpp._id,
          company: matchedOpp.company,
          role: matchedOpp.role,
          formUrl: tab.url,
          userOptedIn: false,
        });
      }
    } catch (e) {
      console.error('OppTrack: match-url failed', e);
    }
  } else {
    $('status-dot').className = 'status-dot';
    $('status-text').textContent = 'Open a Google Form to use AI features';
    $('autofill-btn').disabled = true;
    $('analyze-btn').disabled = true;
  }

  loadRecentForms();
}

// ─── Settings Logic (Synced 100% with Web App) ────────────────────────────────
async function loadSettings() {
  const res = await msg('GET_SETTINGS');
  if (res.ok && res.data) {
    const s = res.data;
    const provider = s.llmProvider || 'groq';
    const model = s.llmModel || 'llama-3.3-70b-versatile';

    const isKnownProvider = PRESET_PROVIDERS.some((p) => p.value === provider);
    if (!isKnownProvider && provider) {
      setIsCustomProvider(true);
      $('custom-provider-input').value = provider;
    } else {
      setIsCustomProvider(false);
      $('llm-provider').value = provider;
    }

    updateModelSelectOptions(provider, model);

    $('llm-api-key').value = s.llmApiKey || '';
    $('key-hint').textContent = `Required for ${provider}`;

    const msgEl = $('settings-msg');
    if (s.hasApiKey) {
      msgEl.textContent = '🟢 API Key active & synced with database account!';
      msgEl.className = 'settings-msg success';
      msgEl.classList.remove('hidden');
    } else {
      msgEl.textContent = '⚠️ No AI API Key set. Enter your key above to enable AI.';
      msgEl.className = 'settings-msg error';
      msgEl.classList.remove('hidden');
    }
  }
}

function updateModelSelectOptions(provider, selectedModel) {
  const select = $('llm-model-select');
  select.innerHTML = '';

  const models = PRESET_MODELS[provider] || [
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile' },
    { value: 'other', label: '✏️ Custom Model...' },
  ];

  models.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    select.appendChild(opt);
  });

  const isKnownModel = models.some((m) => m.value === selectedModel);
  if (!isKnownModel && selectedModel) {
    setIsCustomModel(true);
    select.value = 'other';
    $('custom-model-input').value = selectedModel;
  } else {
    setIsCustomModel(false);
    select.value = selectedModel || models[0]?.value || '';
  }
}

function setIsCustomProvider(custom) {
  isCustomProvider = custom;
  if (custom) {
    $('llm-provider').classList.add('hidden');
    $('custom-provider-input').classList.remove('hidden');
    $('toggle-custom-provider').textContent = '← Presets';
  } else {
    $('llm-provider').classList.remove('hidden');
    $('custom-provider-input').classList.add('hidden');
    $('toggle-custom-provider').textContent = '✏️ Custom';
  }
}

function setIsCustomModel(custom) {
  isCustomModel = custom;
  if (custom) {
    $('llm-model-select').classList.add('hidden');
    $('custom-model-input').classList.remove('hidden');
    $('toggle-custom-model').textContent = '← Presets';
  } else {
    $('llm-model-select').classList.remove('hidden');
    $('custom-model-input').classList.add('hidden');
    $('toggle-custom-model').textContent = '✏️ Custom';
  }
}

// Provider Select Change
$('llm-provider').addEventListener('change', (e) => {
  const prov = e.target.value;
  if (prov === 'other') {
    setIsCustomProvider(true);
    return;
  }
  const defaultModels = {
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-1.5-flash',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
  };
  const defModel = defaultModels[prov] || 'llama-3.3-70b-versatile';
  updateModelSelectOptions(prov, defModel);
  $('key-hint').textContent = `Required for ${prov}`;
});

// Model Select Change
$('llm-model-select').addEventListener('change', (e) => {
  if (e.target.value === 'other') {
    setIsCustomModel(true);
  }
});

// Toggles for Custom
$('toggle-custom-provider').addEventListener('click', () => {
  setIsCustomProvider(!isCustomProvider);
});

$('toggle-custom-model').addEventListener('click', () => {
  setIsCustomModel(!isCustomModel);
});

// Eye visibility toggle
$('toggle-key-visibility').addEventListener('click', () => {
  const input = $('llm-api-key');
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  $('toggle-key-visibility').textContent = isPass ? '🙈' : '👁️';
});

$('settings-toggle-btn').addEventListener('click', () => {
  const card = $('settings-card');
  card.classList.toggle('hidden');
});

// Helper to get active settings object
function getSettingsFromUI() {
  const provider = isCustomProvider
    ? $('custom-provider-input').value.trim()
    : $('llm-provider').value;

  const model = isCustomModel
    ? $('custom-model-input').value.trim()
    : $('llm-model-select').value;

  return {
    llmProvider: provider,
    llmApiKey: $('llm-api-key').value.trim(),
    llmModel: model,
  };
}

// Test AI Connection Button
$('test-ai-btn').addEventListener('click', async () => {
  const settings = getSettingsFromUI();
  const btn = $('test-ai-btn');
  btn.disabled = true;
  btn.textContent = 'Testing…';

  const msgEl = $('settings-msg');
  const res = await msg('TEST_AI_KEY', { settings });
  btn.disabled = false;
  btn.textContent = '✨ Test AI';

  if (res.ok) {
    msgEl.textContent = `✓ ${res.data?.message || 'AI Connected Successfully!'}`;
    msgEl.className = 'settings-msg success';
    msgEl.classList.remove('hidden');
  } else {
    msgEl.textContent = `Failed: ${res.data?.message || res.error || 'AI Key test failed.'}`;
    msgEl.className = 'settings-msg error';
    msgEl.classList.remove('hidden');
  }
});

// Save & Sync Settings Button
$('save-settings-btn').addEventListener('click', async () => {
  const settings = getSettingsFromUI();
  const btn = $('save-settings-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const msgEl = $('settings-msg');
  const res = await msg('UPDATE_SETTINGS', { settings });
  btn.disabled = false;
  btn.textContent = '💾 Save AI Settings';

  if (res.ok) {
    msgEl.textContent = '✓ AI Settings saved and synced with web app!';
    msgEl.className = 'settings-msg success';
    msgEl.classList.remove('hidden');
    setTimeout(() => loadSettings(), 1500);
  } else {
    msgEl.textContent = `Failed: ${res.data?.message || res.error}`;
    msgEl.className = 'settings-msg error';
    msgEl.classList.remove('hidden');
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
$('login-btn').addEventListener('click', async () => {
  const email = $('email').value.trim();
  const password = $('password').value;
  if (!email || !password) return showError('Please enter email and password.');

  $('login-btn').textContent = 'Signing in…';
  $('login-btn').disabled = true;

  const res = await msg('LOGIN', { email, password });
  if (res.ok) {
    hideError();
    init();
  } else {
    showError(res.data?.message || 'Invalid credentials. Try again.');
    $('login-btn').textContent = 'Sign In';
    $('login-btn').disabled = false;
  }
});

$('password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('login-btn').click();
});

$('logout-btn').addEventListener('click', async () => {
  await msg('LOGOUT');
  show('login-view');
  hide('main-view');
});

// ─── Auto-apply toggle ───────────────────────────────────────────────────────
$('auto-apply-toggle').addEventListener('change', async (e) => {
  if (!currentTab) return;
  await msg('SET_OPT_IN', { tabId: currentTab.id, optIn: e.target.checked });
});

// ─── Autofill Trigger ─────────────────────────────────────────────────────────
$('autofill-btn').addEventListener('click', async () => {
  if (!currentTab) return;

  $('autofill-btn').textContent = 'AI Thinking…';
  $('autofill-btn').disabled = true;

  try {
    const result = await chrome.tabs.sendMessage(currentTab.id, { type: 'AUTOFILL_NOW' });

    if (result?.fieldsFilledCount !== undefined) {
      $('status-text').textContent = `AI filled ${result.fieldsFilledCount} field(s)`;

      await msg('POST_FORM_HISTORY', {
        payload: {
          formUrl: currentTab.url,
          formTitle: currentTab.title || '',
          action: 'autofilled',
          matchedOpportunityId: matchedOpp?._id || null,
          fieldsFilledCount: result.fieldsFilledCount,
        },
      });

      loadRecentForms();
    }
  } catch (e) {
    $('status-text').textContent = 'AI Autofill error — reload page';
    $('status-dot').className = 'status-dot error';
  }

  $('autofill-btn').textContent = '✓ Done';
  setTimeout(() => {
    $('autofill-btn').textContent = '✨ AI Vector Autofill';
    $('autofill-btn').disabled = false;
  }, 2500);
});

// ─── Analyze & Save New Data Trigger ──────────────────────────────────────────
$('analyze-btn').addEventListener('click', async () => {
  if (!currentTab) return;

  try {
    await chrome.tabs.sendMessage(currentTab.id, { type: 'ANALYZE_NEW_DATA_NOW' });
    window.close();
  } catch (e) {
    alert('Analysis trigger failed. Try reloading the Google Form page.');
  }
});

// ─── Recent Forms ─────────────────────────────────────────────────────────────
async function loadRecentForms() {
  const res = await msg('GET_FORM_HISTORY');
  const list = $('recent-forms-list');

  if (!res.ok || !res.data?.entries?.length) {
    list.innerHTML = '<div class="recent-empty">No recent form activity</div>';
    return;
  }

  list.innerHTML = res.data.entries
    .slice(0, 5)
    .map((entry) => {
      const title = entry.formTitle || shortenUrl(entry.formUrl);
      const opp = entry.matchedOpportunityId;
      const oppLabel = opp ? `${opp.company} — ${opp.role}` : 'No matched opportunity';
      const time = relativeTime(entry.createdAt);
      const actionClass = entry.action;

      return `
        <div class="recent-item">
          <div class="recent-action-dot ${actionClass}"></div>
          <div class="recent-info">
            <div class="recent-title" title="${escHtml(entry.formUrl)}">${escHtml(title)}</div>
            <div class="recent-meta">${escHtml(oppLabel)} · ${time}</div>
          </div>
          ${entry.fieldsFilledCount ? `<span class="recent-count">${entry.fieldsFilledCount}↑</span>` : ''}
        </div>
      `;
    })
    .join('');
}

function msg(type, extra = {}) {
  return chrome.runtime.sendMessage({ type, ...extra });
}

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function showError(text) {
  const el = $('login-error');
  el.textContent = text;
  el.classList.remove('hidden');
}
function hideError() { $('login-error').classList.add('hidden'); }

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname.split('/')[3]?.slice(0, 30) || u.hostname;
  } catch {
    return url.slice(0, 40);
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const WEBSITE_URL = 'https://opp-track-clinical-placement.vercel.app';

// ─── Register / Open Website Buttons ──────────────────────────────────────────
const regBtn = document.getElementById('open-register-btn');
if (regBtn) {
  regBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEBSITE_URL}/register` });
  });
}

const openWebsiteBtn = document.getElementById('open-website-btn');
if (openWebsiteBtn) {
  openWebsiteBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: WEBSITE_URL });
  });
}

init();
