/**
 * OppTrack Extension — Web App Sync Content Script
 *
 * Injected automatically on OppTrack web dashboard (Vercel & localhost).
 * Seamlessly synchronizes auth tokens and user session from the website
 * to the Chrome Extension so students and devs never have to manually re-login!
 */

(function () {
  'use strict';

  function getStoredAuth() {
    try {
      const token = localStorage.getItem('opptrack_token') || null;
      const rawUser = localStorage.getItem('opptrack_user');
      const theme = localStorage.getItem('opptrack_theme') || null;
      let user = null;
      if (rawUser) {
        try { user = JSON.parse(rawUser); } catch {}
      }
      return { token, user, theme, origin: window.location.origin };
    } catch {
      return { token: null, user: null, theme: null, origin: window.location.origin };
    }
  }

  function syncToExtension() {
    const auth = getStoredAuth();
    if (!chrome.runtime?.id) return;

    chrome.runtime.sendMessage({
      type: 'SYNC_TOKEN_FROM_WEB',
      token: auth.token,
      user: auth.user,
      theme: auth.theme,
      origin: auth.origin,
    }).catch(() => {
      // Extension context invalidated / updated
    });
  }

  // Tag page so React web app knows extension is installed & synchronized
  try {
    document.documentElement.dataset.opptrackExtension = 'active';
  } catch {}

  // 1. Initial sync on page load
  syncToExtension();

  // 2. Sync on localStorage changes (cross-tab login/logout/theme toggle)
  window.addEventListener('storage', (e) => {
    if (e.key === 'opptrack_token' || e.key === 'opptrack_user' || e.key === 'opptrack_theme') {
      syncToExtension();
    }
  });

  // 3. Sync on custom in-app auth & theme changes (dispatched by AuthContext / ThemeContext)
  window.addEventListener('opptrack:auth-change', (e) => {
    const detail = e.detail || {};
    if (!chrome.runtime?.id) return;
    chrome.runtime.sendMessage({
      type: 'SYNC_TOKEN_FROM_WEB',
      token: detail.token || null,
      user: detail.user || null,
      theme: localStorage.getItem('opptrack_theme') || null,
      origin: window.location.origin,
    }).catch(() => {});
  });

  window.addEventListener('opptrack:theme-change', (e) => {
    const theme = e.detail?.theme || localStorage.getItem('opptrack_theme');
    if (!chrome.runtime?.id) return;
    chrome.runtime.sendMessage({
      type: 'SET_THEME',
      theme,
    }).catch(() => {});
  });

  // 4. Respond to direct requests from extension popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_WEB_SESSION') {
      const auth = getStoredAuth();
      sendResponse(auth);
      return false;
    }
  });
})();
