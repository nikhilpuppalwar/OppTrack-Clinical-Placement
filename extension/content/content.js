/**
 * OppTrack — Content Script (Google Forms AI & Vector Autofill + Data Analyzer)
 *
 * Features:
 *  1. AI + Vector DB Semantic Field Matching & Answer Generation
 *  2. Per-Field Confidence Score Dots & Detailed Tooltips
 *  3. Leaving missing / low-confidence (<40%) fields blank
 *  4. Sensitive Field Gate (Aadhaar / PAN masked overlay)
 *  5. File Upload Helper Card (suggested documents)
 *  6. Analyze Form & Save New Data Modal (detects novel input & updates MongoDB profile + web app)
 */

'use strict';

const NS = 'ot-ext'; // Namespace prefix
const sessionCorrections = new Map();

function msg(type, extra = {}) {
  return chrome.runtime.sendMessage({ type, ...extra });
}

function setNativeValue(el, value) {
  if (!el) return;
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el),
    'value'
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function injectGlobalStyles() {
  if (document.getElementById(`${NS}-styles`)) return;
  const style = document.createElement('style');
  style.id = `${NS}-styles`;
  style.textContent = `
    /* Floating Action Bar */
    .${NS}-floating-bar {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(18, 18, 28, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(183, 227, 74, 0.3);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border-radius: 30px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 999999;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .${NS}-btn {
      background: #b7e34a;
      color: #0f1210;
      border: none;
      padding: 8px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .${NS}-btn:hover {
      background: #c5ee58;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(183,227,74,0.3);
    }
    .${NS}-btn-secondary {
      background: rgba(255,255,255,0.08);
      color: #f2f3ed;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .${NS}-btn-secondary:hover {
      background: rgba(255,255,255,0.15);
    }

    /* Confidence Dot */
    .${NS}-dot-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 10px;
      vertical-align: middle;
    }
    .${NS}-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      right: -16px;
      transform: translateY(-50%);
      cursor: help;
      z-index: 9999;
      flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(0,0,0,0.3);
      transition: transform 0.15s;
    }
    .${NS}-dot:hover { transform: translateY(-50%) scale(1.4); }
    .${NS}-dot.high   { background: #4ade80; }
    .${NS}-dot.medium { background: #fbbf24; }
    .${NS}-dot.manual { background: #60a5fa; }

    /* Tooltip */
    .${NS}-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      right: -8px;
      background: #121420;
      color: #f2f3ed;
      font-size: 11px;
      font-family: 'Inter', system-ui, sans-serif;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.1);
      white-space: max-content;
      max-width: 260px;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      z-index: 100000;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .${NS}-dot:hover + .${NS}-tooltip,
    .${NS}-dot-wrap:hover .${NS}-tooltip { opacity: 1; }

    /* Sensitive Overlay */
    .${NS}-sensitive-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 18, 16, 0.88);
      backdrop-filter: blur(6px);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 0 12px;
      cursor: pointer;
      z-index: 100;
      transition: background 0.2s;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .${NS}-sensitive-overlay:hover { background: rgba(15, 18, 16, 0.75); }
    .${NS}-sensitive-text {
      color: rgba(242,243,237,0.85);
      font-size: 12px;
      font-weight: 500;
    }

    /* Modal Overlay */
    .${NS}-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .${NS}-modal-card {
      background: #141722;
      border: 1px solid rgba(183, 227, 74, 0.3);
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      color: #f2f3ed;
      overflow: hidden;
    }
    .${NS}-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .${NS}-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #b7e34a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .${NS}-modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    .${NS}-item-row {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .${NS}-item-info { flex: 1; }
    .${NS}-item-label { font-size: 13px; font-weight: 600; color: #f2f3ed; }
    .${NS}-item-val { font-size: 12px; color: #b7e34a; font-family: monospace; margin-top: 2px; }
    .${NS}-item-reason { font-size: 11px; color: rgba(242,243,237,0.5); margin-top: 4px; }
    .${NS}-modal-footer {
      padding: 14px 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(style);
}

// ─── DOM Helpers ──────────────────────────────────────────────────────────────
function getQuestionBlocks() {
  return Array.from(document.querySelectorAll('div[role="listitem"]'));
}

function getQuestionLabel(block) {
  const labelEl = block.querySelector('[data-params], .M7eMe, .LC3bg, .freebirdFormviewerViewItemsItemItemTitle');
  return (labelEl?.textContent || '').trim();
}

function getInputFromBlock(block) {
  return (
    block.querySelector('input[type="text"]') ||
    block.querySelector('textarea') ||
    block.querySelector('input[type="email"]') ||
    block.querySelector('input[type="number"]') ||
    block.querySelector('input[type="date"]') ||
    null
  );
}

function getFileInputFromBlock(block) {
  return block.querySelector('input[type="file"]') || null;
}

// ─── Confidence Dot Injection ─────────────────────────────────────────────────
function injectConfidenceDot(inputEl, score, profileFieldName, reason = '') {
  // Remove existing dot if present
  const existing = inputEl.parentElement?.querySelector(`.${NS}-dot-wrap`);
  if (existing) existing.remove();

  const wrap = document.createElement('span');
  wrap.className = `${NS}-dot-wrap`;

  const dot = document.createElement('span');
  dot.className = `${NS}-dot ${score >= 0.8 ? 'high' : 'medium'}`;

  const pct = Math.round(score * 100);
  const tooltip = document.createElement('span');
  tooltip.className = `${NS}-tooltip`;
  tooltip.textContent = `Matched: ${profileFieldName} (${pct}% confidence)${reason ? ' — ' + reason : ''}`;

  wrap.appendChild(dot);
  wrap.appendChild(tooltip);

  const parent = inputEl.closest('div') || inputEl.parentElement;
  if (parent) {
    parent.style.position = 'relative';
    parent.appendChild(wrap);
  }

  inputEl.addEventListener(
    'blur',
    () => {
      if (inputEl.value !== inputEl.dataset.otOriginal) {
        dot.className = `${NS}-dot manual`;
        tooltip.textContent = 'Manually edited by user';
        sessionCorrections.set(inputEl, inputEl.value);
      }
    },
    { once: false }
  );

  return wrap;
}

// ─── Sensitive Overlay ────────────────────────────────────────────────────────
function injectSensitiveOverlay(inputEl, maskedDisplay, profileValue, fieldLabel, formUrl) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:inline-block;width:100%;';

  inputEl.parentElement.insertBefore(wrapper, inputEl);
  wrapper.appendChild(inputEl);

  const overlay = document.createElement('div');
  overlay.className = `${NS}-sensitive-overlay`;

  const text = document.createElement('span');
  text.className = `${NS}-sensitive-text`;
  text.textContent = `🔒 ${maskedDisplay}`;
  overlay.appendChild(text);

  wrapper.appendChild(overlay);

  overlay.addEventListener('click', async () => {
    setNativeValue(inputEl, profileValue);
    overlay.remove();
    inputEl.dataset.otOriginal = profileValue;
    await msg('LOG_SENSITIVE_REVEAL', { fieldName: fieldLabel, formUrl });
  });
}

// ─── Main AI + Vector DB Autofill Function ────────────────────────────────────
async function performAIAutofill() {
  injectGlobalStyles();

  const blocks = getQuestionBlocks();
  const questions = [];

  blocks.forEach((block, index) => {
    const label = getQuestionLabel(block);
    const input = getInputFromBlock(block);
    if (label && input) {
      questions.push({
        id: `q_${index}`,
        label,
        type: input.tagName.toLowerCase() === 'textarea' ? 'paragraph' : 'short_text',
        placeholder: input.placeholder || '',
      });
    }
  });

  if (!questions.length) {
    return { fieldsFilledCount: 0, message: 'No standard input fields found on this form.' };
  }

  const formTitle = document.title || 'Google Form';
  const formUrl = window.location.href;

  // Call Backend Vector + AI Form Autofill Route
  const res = await msg('AI_FORM_AUTOFILL', {
    payload: { questions, formUrl, formTitle },
  });

  if (!res.ok) {
    if (res.data?.isKeyMissing) {
      alert(`OppTrack AI: ${res.data.message}`);
    } else {
      alert(`AI Autofill Error: ${res.data?.message || res.error || 'Server error'}`);
    }
    return { fieldsFilledCount: 0, error: res.data?.message || res.error };
  }

  const answers = res.data?.answers || [];
  let filledCount = 0;

  answers.forEach((ans) => {
    const index = parseInt(ans.questionId.replace('q_', ''), 10);
    if (isNaN(index) || !blocks[index]) return;

    const block = blocks[index];
    const inputEl = getInputFromBlock(block);
    if (!inputEl) return;

    const confidence = ans.confidenceScore || 0;
    const val = ans.value || '';

    // Requirement 4: Missing data / low confidence (< 40%) -> leave BLANK!
    if (confidence < 0.4 || !val) {
      return;
    }

    // Sensitive field gate check
    if (ans.sensitive) {
      const visible = val.slice(-4);
      const masked = '•'.repeat(Math.max(0, val.length - 4)) + ' ' + visible;
      injectSensitiveOverlay(inputEl, `${masked} — click to reveal & fill`, val, ans.label, formUrl);
      inputEl.dataset.otOriginal = val;
      return;
    }

    // Autofill field value
    setNativeValue(inputEl, val);
    inputEl.dataset.otFilled = '1';
    inputEl.dataset.otOriginal = val;
    filledCount++;

    // Inject confidence dot with reason
    injectConfidenceDot(inputEl, confidence, ans.matchedField || 'AI Match', ans.reason);
  });

  return { fieldsFilledCount: filledCount };
}

// ─── Feature: Analyze Form & Save New Data to DB ──────────────────────────────
async function analyzeAndSaveNewData() {
  injectGlobalStyles();

  const blocks = getQuestionBlocks();
  const formFields = [];

  blocks.forEach((block) => {
    const label = getQuestionLabel(block);
    const input = getInputFromBlock(block);
    if (label && input && input.value?.trim()) {
      formFields.push({
        label,
        value: input.value.trim(),
        type: input.tagName.toLowerCase(),
      });
    }
  });

  if (!formFields.length) {
    alert('No filled fields found on this form to analyze.');
    return;
  }

  const formTitle = document.title || 'Google Form';

  const res = await msg('ANALYZE_NEW_DATA', {
    payload: { formFields, formTitle },
  });

  if (!res.ok) {
    alert(`Analysis Failed: ${res.data?.message || res.error || 'Server error'}`);
    return;
  }

  const detectedNewData = res.data?.detectedNewData || [];

  if (!detectedNewData.length) {
    alert('No new or updated profile data found in this form! All values already match your database profile.');
    return;
  }

  // Render Modal Window to let user confirm updates
  showNewDataModal(detectedNewData);
}

function showNewDataModal(items) {
  const existing = document.getElementById(`${NS}-modal-overlay`);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = `${NS}-modal-overlay`;
  overlay.className = `${NS}-modal-overlay`;

  const selectedIds = new Set(items.map((it) => it.id));

  overlay.innerHTML = `
    <div class="${NS}-modal-card">
      <div class="${NS}-modal-header">
        <div class="${NS}-modal-title">🔍 New Candidate Data Detected</div>
        <button id="${NS}-close-modal" style="background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div class="${NS}-modal-body">
        <p style="font-size:12px;color:rgba(242,243,237,0.7);margin-bottom:14px;">
          The AI scanned this form and found <strong>${items.length}</strong> new/updated detail(s) that are missing from your database profile. Select the fields you want to save:
        </p>
        <div id="${NS}-items-container">
          ${items
            .map(
              (item) => `
            <div class="${NS}-item-row">
              <input type="checkbox" id="chk_${item.id}" data-id="${item.id}" checked style="margin-top:3px;accent-color:#b7e34a;cursor:pointer;" />
              <div class="${NS}-item-info">
                <div class="${NS}-item-label">${item.label}</div>
                <div class="${NS}-item-val">${item.value}</div>
                <div class="${NS}-item-reason">${item.reason}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="${NS}-modal-footer">
        <button id="${NS}-cancel-btn" class="${NS}-btn ${NS}-btn-secondary">Cancel</button>
        <button id="${NS}-save-db-btn" class="${NS}-btn">💾 Save Selected to Database</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById(`${NS}-close-modal`).onclick = () => overlay.remove();
  document.getElementById(`${NS}-cancel-btn`).onclick = () => overlay.remove();

  document.getElementById(`${NS}-save-db-btn`).onclick = async () => {
    const saveBtn = document.getElementById(`${NS}-save-db-btn`);
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving to Database…';

    const fieldsToSave = items.filter((it) => {
      const chk = document.getElementById(`chk_${it.id}`);
      return chk && chk.checked;
    });

    if (!fieldsToSave.length) {
      alert('Please select at least one item to save.');
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save Selected to Database';
      return;
    }

    const syncRes = await msg('SYNC_NEW_DATA', { fieldsToSave });
    overlay.remove();

    if (syncRes.ok) {
      alert(`Success! ${syncRes.data?.message || 'Database Profile updated successfully!'}`);
    } else {
      alert(`Failed to save: ${syncRes.data?.message || syncRes.error}`);
    }
  };
}

// ─── Floating Toolbar Injection ───────────────────────────────────────────────
function injectFloatingToolbar() {
  if (document.getElementById(`${NS}-floating-bar`)) return;
  injectGlobalStyles();

  const bar = document.createElement('div');
  bar.id = `${NS}-floating-bar`;
  bar.className = `${NS}-floating-bar`;

  bar.innerHTML = `
    <span style="font-weight:700;font-size:12px;color:#b7e34a;">OppTrack AI</span>
    <button id="${NS}-float-autofill" class="${NS}-btn">✨ AI Autofill</button>
    <button id="${NS}-float-analyze" class="${NS}-btn ${NS}-btn-secondary">🔍 Save New Data</button>
  `;

  document.body.appendChild(bar);

  document.getElementById(`${NS}-float-autofill`).onclick = async () => {
    const btn = document.getElementById(`${NS}-float-autofill`);
    btn.disabled = true;
    btn.textContent = 'AI Thinking…';
    const res = await performAIAutofill();
    btn.disabled = false;
    btn.textContent = `✓ Filled (${res.fieldsFilledCount || 0})`;
    setTimeout(() => (btn.textContent = '✨ AI Autofill'), 3000);
  };

  document.getElementById(`${NS}-float-analyze`).onclick = () => {
    analyzeAndSaveNewData();
  };
}

// Automatically inject floating toolbar on Google Form load
if (window.location.href.includes('docs.google.com/forms')) {
  setTimeout(injectFloatingToolbar, 1000);
}

// Listen for messages from extension popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'AUTOFILL_NOW') {
    performAIAutofill()
      .then(sendResponse)
      .catch((err) => sendResponse({ fieldsFilledCount: 0, error: err.message }));
    return true;
  }
  if (message.type === 'ANALYZE_NEW_DATA_NOW') {
    analyzeAndSaveNewData()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
