/**
 * OppTrack Extension — Background Service Worker (MV3)
 *
 * Responsibilities:
 *  - Store / retrieve the JWT token from chrome.storage.local
 *  - Relay authenticated API calls from content script (which can't read storage)
 *  - Track tab URL changes to detect Google Forms "response recorded" redirect (Feature 4)
 *  - Handle the "mark as applied" + activityLog on form submission detection
 */

const PRIMARY_API_BASE = 'https://opptrack-clinical-placement.onrender.com/api';
const LOCAL_API_BASE = 'http://localhost:5000/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
async function getToken() {
  const { opptrack_token } = await chrome.storage.local.get('opptrack_token');
  return opptrack_token || null;
}

async function getApiBase() {
  const { opptrack_api_url } = await chrome.storage.local.get('opptrack_api_url');
  return opptrack_api_url || PRIMARY_API_BASE;
}

async function authedFetch(path, options = {}) {
  const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/register');
  const token = isAuthRoute ? null : await getToken();
  let base = await getApiBase();

  const doFetch = async (baseUrl) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  };

  let result;
  try {
    result = await doFetch(base);
  } catch (err) {
    const altBase = base.includes('onrender.com') ? LOCAL_API_BASE : PRIMARY_API_BASE;
    try {
      result = await doFetch(altBase);
      if (result.ok) {
        await chrome.storage.local.set({ opptrack_api_url: altBase });
      }
    } catch {
      return { ok: false, status: 0, error: err.message };
    }
  }

  // Handle 401 Unauthorized: token expired, invalid, or user deleted
  if (result && result.status === 401 && !isAuthRoute) {
    console.warn('[OppTrack Extension] Auth token rejected (401). Clearing stale token.');
    await chrome.storage.local.remove(['opptrack_token', 'opptrack_user']);
    chrome.runtime.sendMessage({
      type: 'AUTH_EXPIRED',
      message: result.data?.message || 'Session expired. Please log in or sync your token.',
    }).catch(() => {});
  }

  return result;
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
  handleMessage(msg, sender)
    .then((res) => {
      try {
        sendResponse(res !== undefined ? res : { ok: false });
      } catch (e) {}
    })
    .catch((err) => {
      try {
        sendResponse({ ok: false, error: err.message });
      } catch (e) {}
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
        const userObj = res.data.user || {
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          collegeName: res.data.collegeName,
          branch: res.data.branch,
          batch: res.data.batch,
        };
        await chrome.storage.local.set({ opptrack_token: res.data.token, opptrack_user: userObj });
      }
      return res;
    }

    case 'LOGOUT': {
      await chrome.storage.local.remove(['opptrack_token', 'opptrack_user']);
      return { ok: true };
    }

    case 'GET_AUTH': {
      const { opptrack_token, opptrack_user, opptrack_api_url } = await chrome.storage.local.get([
        'opptrack_token',
        'opptrack_user',
        'opptrack_api_url',
      ]);
      return {
        token: opptrack_token || null,
        user: opptrack_user || null,
        apiUrl: opptrack_api_url || PRIMARY_API_BASE,
      };
    }

    case 'SYNC_TOKEN_FROM_WEB': {
      if (msg.token) {
        const userObj = msg.user || null;
        let apiUrl = null;
        if (msg.origin && (msg.origin.includes('localhost') || msg.origin.includes('127.0.0.1'))) {
          apiUrl = LOCAL_API_BASE;
        } else if (msg.origin && (msg.origin.includes('vercel.app') || msg.origin.includes('onrender.com'))) {
          apiUrl = PRIMARY_API_BASE;
        }
        const updates = { opptrack_token: msg.token, opptrack_user: userObj };
        if (apiUrl) updates.opptrack_api_url = apiUrl;
        await chrome.storage.local.set(updates);
        return { ok: true, synced: true };
      } else {
        await chrome.storage.local.remove(['opptrack_token', 'opptrack_user']);
        return { ok: true, loggedOut: true };
      }
    }

    case 'SET_MANUAL_TOKEN': {
      if (!msg.token) return { ok: false, error: 'Token cannot be empty' };
      const updates = { opptrack_token: msg.token.trim() };
      if (msg.apiUrl) updates.opptrack_api_url = msg.apiUrl;
      if (msg.user) updates.opptrack_user = msg.user;
      await chrome.storage.local.set(updates);
      // Validate by fetching profile
      const testRes = await authedFetch('/profile');
      if (testRes.ok) {
        if (testRes.data) {
          const userObj = {
            name: testRes.data.candidateName,
            email: testRes.data.collegeEmail || testRes.data.personalEmail,
          };
          await chrome.storage.local.set({ opptrack_user: userObj });
        }
        return { ok: true, user: testRes.data };
      } else {
        return { ok: false, error: testRes.data?.message || 'Token verification failed. Please check the token.' };
      }
    }

    case 'GET_API_BASE': {
      const base = await getApiBase();
      return { ok: true, apiUrl: base };
    }

    case 'SET_API_BASE': {
      if (msg.apiUrl) {
        await chrome.storage.local.set({ opptrack_api_url: msg.apiUrl });
      }
      return { ok: true };
    }

    case 'VERIFY_TOKEN': {
      const testRes = await authedFetch('/profile');
      return { ok: testRes.ok, status: testRes.status, data: testRes.data };
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
