/**
 * OppTrack Extension — Background Service Worker (MV3)
 *
 * Responsibilities:
 *  - Store / retrieve the JWT token from chrome.storage.local
 *  - Relay authenticated API calls from content script (which can't read storage)
 *  - Track tab URL changes to detect Google Forms "response recorded" redirect (Feature 4)
 *  - Handle the "mark as applied" + activityLog on form submission detection
 */

const API_BASE = 'https://opptrack-clinical-placement.onrender.com/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
async function getToken() {
  const { opptrack_token } = await chrome.storage.local.get('opptrack_token');
  return opptrack_token || null;
}

async function authedFetch(path, options = {}) {
  const token = await getToken();
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

// ─── Tab tracking for form submission detection (Feature 4) ──────────────────
// Key: tabId  →  Value: { opportunityId, company, role, formUrl, userOptedIn }
const pendingSubmissions = new Map();

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const url = tab.url || '';

  // Google Forms confirmation page URL pattern
  if (url.includes('docs.google.com/forms') && url.includes('formResponse')) {
    const pending = pendingSubmissions.get(tabId);
    if (pending && pending.userOptedIn && pending.opportunityId) {
      // Mark the linked opportunity as "applied"
      const patchRes = await authedFetch(`/opportunities/${pending.opportunityId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ newStatus: 'applied' }),
      });

      if (patchRes.ok) {
        // Log the applied_via_extension event
        await authedFetch('/form-history/sensitive-reveal', {
          method: 'POST',
          body: JSON.stringify({
            fieldName: '__form_submission__',
            formUrl: pending.formUrl,
          }),
        });

        // Also log to activity logs via the backend (opportunity status PATCH already does this,
        // but we add an extension-specific applied_via_extension event)
        await authedFetch('/history', {
          method: 'POST',
          body: JSON.stringify({
            opportunityId: pending.opportunityId,
            eventType: 'applied_via_extension',
            description: `Applied to ${pending.company} — ${pending.role} via form autofill`,
            metadata: { formUrl: pending.formUrl },
          }),
        }).catch(() => {}); // non-critical
      }

      pendingSubmissions.delete(tabId);

      // Notify popup to refresh
      chrome.runtime.sendMessage({ type: 'SUBMISSION_DETECTED', tabId }).catch(() => {});
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  pendingSubmissions.delete(tabId);
});

// ─── Message handlers ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Must return true to allow async sendResponse
  handleMessage(msg, sender).then(sendResponse).catch((err) => {
    sendResponse({ ok: false, error: err.message });
  });
  return true;
});

async function handleMessage(msg, sender) {
  switch (msg.type) {

    // ── Auth ──────────────────────────────────────────────────────────────────
    case 'LOGIN': {
      const res = await authedFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: msg.email, password: msg.password }),
      });
      if (res.ok && res.data?.token) {
        await chrome.storage.local.set({ opptrack_token: res.data.token, opptrack_user: res.data.user });
      }
      return res;
    }

    case 'LOGOUT': {
      await chrome.storage.local.remove(['opptrack_token', 'opptrack_user']);
      return { ok: true };
    }

    case 'GET_AUTH': {
      const { opptrack_token, opptrack_user } = await chrome.storage.local.get(['opptrack_token', 'opptrack_user']);
      return { token: opptrack_token || null, user: opptrack_user || null };
    }

    // ── Profile + Documents ───────────────────────────────────────────────────
    case 'GET_PROFILE':
      return authedFetch('/profile');

    case 'GET_DOCUMENTS':
      return authedFetch('/documents');

    // ── Opportunity matching ──────────────────────────────────────────────────
    case 'MATCH_URL': {
      const encoded = encodeURIComponent(msg.url);
      return authedFetch(`/opportunities/match-url?url=${encoded}`);
    }

    // ── Form history ──────────────────────────────────────────────────────────
    case 'POST_FORM_HISTORY':
      return authedFetch('/form-history', {
        method: 'POST',
        body: JSON.stringify(msg.payload),
      });

    case 'GET_FORM_HISTORY':
      return authedFetch('/form-history?limit=5&page=1');

    // ── Sensitive field reveal log ────────────────────────────────────────────
    case 'LOG_SENSITIVE_REVEAL':
      return authedFetch('/form-history/sensitive-reveal', {
        method: 'POST',
        body: JSON.stringify({ fieldName: msg.fieldName, formUrl: msg.formUrl }),
      });

    // ── Mark as applied after form submit ─────────────────────────────────────
    case 'REGISTER_PENDING_SUBMISSION': {
      const { tabId, opportunityId, company, role, formUrl, userOptedIn } = msg;
      pendingSubmissions.set(tabId, { opportunityId, company, role, formUrl, userOptedIn });
      return { ok: true };
    }

    case 'SET_OPT_IN': {
      const entry = pendingSubmissions.get(msg.tabId);
      if (entry) {
        entry.userOptedIn = msg.optIn;
        pendingSubmissions.set(msg.tabId, entry);
      }
      return { ok: true };
    }

    // ── Settings (API Key & Provider Sync) ──────────────────────────────────
    case 'GET_SETTINGS':
      return authedFetch('/settings');

    case 'UPDATE_SETTINGS':
      return authedFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(msg.settings),
      });

    case 'TEST_AI_KEY':
    case 'TEST_AI':
    case 'TEST_LLM_KEY':
      return authedFetch('/settings/test-ai', {
        method: 'POST',
        body: JSON.stringify(msg.settings || msg.payload || {}),
      });

    // ── AI Form Autofill & Vector DB ─────────────────────────────────────────
    case 'AI_FORM_AUTOFILL':
      return authedFetch('/ai/form-autofill', {
        method: 'POST',
        body: JSON.stringify(msg.payload),
      });

    case 'ANALYZE_NEW_DATA':
      return authedFetch('/ai/analyze-new-data', {
        method: 'POST',
        body: JSON.stringify(msg.payload),
      });

    case 'SYNC_NEW_DATA':
      return authedFetch('/ai/sync-new-data', {
        method: 'POST',
        body: JSON.stringify(msg.payload),
      });

    default:
      return { ok: false, error: `Unknown message type: ${msg.type}` };
  }
}
