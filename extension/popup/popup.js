/**
 * OppTrack Extension — Popup Logic
 *
 * Handles: Auth state, AI Settings API key sync, Form detection,
 * AI Vector Autofill trigger, Analyze & Save New Data trigger.
 */

const $ = (id) => document.getElementById(id);

let currentTab = null;
let matchedOpp = null;

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

// ─── Settings Logic ───────────────────────────────────────────────────────────
async function loadSettings() {
  const res = await msg('GET_SETTINGS');
  if (res.ok && res.data) {
    const s = res.data;
    $('llm-provider').value = s.llmProvider || 'groq';
    $('llm-api-key').value = s.llmApiKey || '';
    $('llm-model').value = s.llmModel || '';
  }
}

$('settings-toggle-btn').addEventListener('click', () => {
  const card = $('settings-card');
  card.classList.toggle('hidden');
});

$('save-settings-btn').addEventListener('click', async () => {
  const settings = {
    llmProvider: $('llm-provider').value,
    llmApiKey: $('llm-api-key').value.trim(),
    llmModel: $('llm-model').value.trim(),
  };

  const btn = $('save-settings-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const res = await msg('UPDATE_SETTINGS', { settings });
  btn.disabled = false;
  btn.textContent = 'Save & Sync Settings';

  const msgEl = $('settings-msg');
  if (res.ok) {
    msgEl.textContent = '✓ AI Settings saved and synced with web app!';
    msgEl.className = 'settings-msg success';
    msgEl.classList.remove('hidden');
    setTimeout(() => msgEl.classList.add('hidden'), 3000);
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
    window.close(); // Close popup so user sees the on-page analysis modal
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

init();
