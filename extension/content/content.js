/**
 * OppTrack — Content Script (Universal Google Forms AI & Vector Autofill + Data Analyzer)
 *
 * Features:
 *  1. Universal Google Form Parser — Handles Text, Textarea, MCQ/Radio, Checkboxes, Dropdowns & Ratings
 *  2. AI + Vector DB Semantic Field Matching & Answer Generation
 *  3. Per-Field Confidence Score Dots & Detailed Tooltips
 *  4. Leaving missing / low-confidence (<40%) fields blank
 *  5. Sensitive Field Gate (Aadhaar / PAN masked overlay)
 *  6. File Upload Helper Card (suggested documents)
 *  7. Analyze Form & Save New Data Modal (detects novel input & updates MongoDB profile + web app)
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
      max-width: 280px;
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

// ─── Universal Google Forms Parser ──────────────────────────────────────────
function getQuestionBlocks() {
  return Array.from(document.querySelectorAll('div[role="listitem"]'));
}

function getQuestionLabel(block) {
  const labelEl = block.querySelector('[data-params], .M7eMe, .LC3bg, .freebirdFormviewerViewItemsItemItemTitle');
  return (labelEl?.textContent || '').trim();
}

/**
 * Universal Form Field Inspection: Supports Text, Textarea, Radio, Checkbox, Dropdown & File Inputs
 */
function inspectQuestionBlock(block) {
  const label = getQuestionLabel(block);
  if (!label) return null;

  // File Upload
  const fileInput = block.querySelector('input[type="file"]');
  if (fileInput) {
    return { label, type: 'file', element: fileInput, options: [] };
  }

  // Text / Textarea / Email / Date / Number
  const textInput =
    block.querySelector('input[type="text"]') ||
    block.querySelector('textarea') ||
    block.querySelector('input[type="email"]') ||
    block.querySelector('input[type="number"]') ||
    block.querySelector('input[type="date"]');

  if (textInput) {
    return {
      label,
      type: textInput.tagName.toLowerCase() === 'textarea' ? 'paragraph' : 'short_text',
      element: textInput,
      placeholder: textInput.placeholder || '',
      currentValue: textInput.value || '',
      options: [],
    };
  }

  // Radio Buttons / MCQ / Rating / Linear Scale
  const radioEls = Array.from(block.querySelectorAll('div[role="radio"]'));
  if (radioEls.length > 0) {
    const options = radioEls.map((el) => getChoiceLabel(el)).filter(Boolean);
    return { label, type: 'radio', radioEls, options };
  }

  // Checkboxes
  const checkEls = Array.from(block.querySelectorAll('div[role="checkbox"]'));
  if (checkEls.length > 0) {
    const options = checkEls.map((el) => getChoiceLabel(el)).filter(Boolean);
    return { label, type: 'checkbox', checkEls, options };
  }

  // Dropdown / Listbox
  const listboxEl = block.querySelector('div[role="listbox"]');
  if (listboxEl) {
    const optionEls = Array.from(block.querySelectorAll('div[role="option"]'));
    const options = optionEls.map((el) => getChoiceLabel(el)).filter(Boolean);
    return { label, type: 'dropdown', listboxEl, optionEls, options };
  }

  return null;
}

function getChoiceLabel(el) {
  return (
    el.getAttribute('data-value') ||
    el.getAttribute('aria-label') ||
    el.querySelector('.docssharedWiztogglelbl, span')?.textContent ||
    el.textContent ||
    ''
  ).trim();
}

/**
 * Click / Set value on any Google Form element (Text, Radio, Checkbox, Dropdown)
 */
function setAnswerOnBlock(blockInfo, value) {
  if (!blockInfo || !value) return false;

  const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetNorm = normalize(value);

  // 1. Text Inputs
  if (blockInfo.element && (blockInfo.type === 'short_text' || blockInfo.type === 'paragraph')) {
    setNativeValue(blockInfo.element, value);
    blockInfo.element.dataset.otFilled = '1';
    blockInfo.element.dataset.otOriginal = value;
    return true;
  }

  // 2. Radio Buttons / MCQ / Linear Scale
  if (blockInfo.type === 'radio' && blockInfo.radioEls) {
    const bestRadio = blockInfo.radioEls.find((rEl) => {
      const lblNorm = normalize(getChoiceLabel(rEl));
      return lblNorm === targetNorm || lblNorm.includes(targetNorm) || targetNorm.includes(lblNorm);
    });

    if (bestRadio) {
      bestRadio.click();
      return true;
    }
  }

  // 3. Checkboxes
  if (blockInfo.type === 'checkbox' && blockInfo.checkEls) {
    let clickedAny = false;
    blockInfo.checkEls.forEach((cEl) => {
      const lblNorm = normalize(getChoiceLabel(cEl));
      if (lblNorm === targetNorm || targetNorm.includes(lblNorm) || lblNorm.includes(targetNorm)) {
        cEl.click();
        clickedAny = true;
      }
    });
    return clickedAny;
  }

  // 4. Dropdowns / Listbox
  if (blockInfo.type === 'dropdown' && blockInfo.listboxEl) {
    const optionEls = blockInfo.optionEls || Array.from(blockInfo.listboxEl.querySelectorAll('div[role="option"]'));
    const bestOpt = optionEls.find((oEl) => {
      const lblNorm = normalize(getChoiceLabel(oEl));
      return lblNorm === targetNorm || lblNorm.includes(targetNorm) || targetNorm.includes(lblNorm);
    });

    if (bestOpt) {
      blockInfo.listboxEl.click();
      setTimeout(() => bestOpt.click(), 100);
      return true;
    }
  }

  return false;
}

// ─── Confidence Dot Injection ─────────────────────────────────────────────────
function injectConfidenceDot(targetContainer, score, profileFieldName, reason = '') {
  if (!targetContainer) return;
  const existing = targetContainer.querySelector(`.${NS}-dot-wrap`);
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

  targetContainer.style.position = 'relative';
  targetContainer.appendChild(wrap);
}

// ─── Sensitive Overlay ────────────────────────────────────────────────────────
function injectSensitiveOverlay(inputEl, maskedDisplay, profileValue, fieldLabel, formUrl) {
  if (!inputEl) return;
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
  const blockInfos = [];

  // Fetch Documents list for File Helper Cards
  const docsRes = await msg('GET_DOCUMENTS');
  const documents = docsRes.ok ? docsRes.data || [] : [];

  blocks.forEach((block, index) => {
    const info = inspectQuestionBlock(block);
    if (!info) return;

    blockInfos.push({ index, block, info });

    if (info.type === 'file') {
      if (documents.length > 0) {
        const card = buildFileHelperCard(info.label, documents);
        if (card && !block.querySelector(`.${NS}-file-helper`)) {
          const uploadArea = block.querySelector('[role="button"]') || info.element.parentElement;
          uploadArea.parentElement?.insertBefore(card, uploadArea) ?? block.appendChild(card);
        }
      }
      return;
    }

    questions.push({
      id: `q_${index}`,
      label: info.label,
      type: info.type,
      options: info.options || [],
      placeholder: info.placeholder || '',
    });
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
    const item = blockInfos.find((b) => b.index === index);
    if (!item) return;

    const confidence = ans.confidenceScore || 0;
    const val = ans.value || '';

    // Requirement 4: Missing data / low confidence (< 40%) -> leave BLANK!
    if (confidence < 0.4 || !val) {
      return;
    }

    // Sensitive field gate check
    if (ans.sensitive && item.info.element) {
      const visible = val.slice(-4);
      const masked = '•'.repeat(Math.max(0, val.length - 4)) + ' ' + visible;
      injectSensitiveOverlay(item.info.element, `${masked} — click to reveal & fill`, val, ans.label, formUrl);
      item.info.element.dataset.otOriginal = val;
      return;
    }

    // Autofill / Click Answer Choice
    const success = setAnswerOnBlock(item.info, val);
    if (success) {
      filledCount++;
      const targetContainer = item.info.element?.parentElement || item.block.querySelector('.M7eMe') || item.block;
      injectConfidenceDot(targetContainer, confidence, ans.matchedField || 'AI Match', ans.reason);
    }
  });

  return { fieldsFilledCount: filledCount };
}

// ─── File Helper Card Builder ─────────────────────────────────────────────────
function buildFileHelperCard(question, documents) {
  const lower = question.toLowerCase();
  let typeHint = 'other';
  if (lower.includes('resume') || lower.includes('cv')) typeHint = 'resume';
  else if (lower.includes('aadhar') || lower.includes('aadhaar')) typeHint = 'aadhar';
  else if (lower.includes('pan')) typeHint = 'pan';
  else if (lower.includes('marksheet') || lower.includes('mark sheet') || lower.includes('transcript')) typeHint = 'marksheet';
  else if (lower.includes('photo') || lower.includes('photograph') || lower.includes('picture')) typeHint = 'photo';
  else if (lower.includes('signature')) typeHint = 'signature';

  const matched = documents.filter((d) => d.type === typeHint || d.type === 'other');
  if (!matched.length) return null;

  const card = document.createElement('div');
  card.className = `${NS}-file-helper`;
  card.style.cssText = 'border:1px dashed rgba(183,227,74,0.4);border-radius:8px;background:rgba(183,227,74,0.05);padding:10px 14px;margin-top:8px;font-size:12px;color:rgba(242,243,237,0.85);';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;color:#b7e34a;margin-bottom:6px;';
  title.textContent = `📎 Suggested ${typeHint.toUpperCase()} Document`;
  card.appendChild(title);

  matched.forEach((doc) => {
    const row = document.createElement('div');
    row.style.cssText = 'padding:3px 0;';

    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'color:#60a5fa;text-decoration:none;font-weight:500;';
    link.textContent = `↗ Open ${doc.label}`;

    row.appendChild(link);
    card.appendChild(row);
  });

  const reminder = document.createElement('div');
  reminder.style.cssText = 'font-size:11px;color:rgba(242,243,237,0.5);margin-top:6px;';
  reminder.textContent = '⚠ Download file then upload manually above';
  card.appendChild(reminder);

  return card;
}

// ─── Feature: Analyze Form & Save New Data to DB ──────────────────────────────
async function analyzeAndSaveNewData() {
  injectGlobalStyles();

  const blocks = getQuestionBlocks();
  const formFields = [];

  blocks.forEach((block) => {
    const info = inspectQuestionBlock(block);
    if (!info) return;

    let currentValue = '';
    if (info.currentValue) currentValue = info.currentValue;
    else if (info.type === 'radio' && info.radioEls) {
      const selected = info.radioEls.find((r) => r.getAttribute('aria-checked') === 'true');
      if (selected) currentValue = getChoiceLabel(selected);
    } else if (info.type === 'checkbox' && info.checkEls) {
      const selected = info.checkEls.filter((c) => c.getAttribute('aria-checked') === 'true');
      if (selected.length) currentValue = selected.map(getChoiceLabel).join(', ');
    }

    if (currentValue.trim()) {
      formFields.push({
        label: info.label,
        value: currentValue.trim(),
        type: info.type,
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

  showNewDataModal(detectedNewData);
}

function showNewDataModal(items) {
  const existing = document.getElementById(`${NS}-modal-overlay`);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = `${NS}-modal-overlay`;
  overlay.className = `${NS}-modal-overlay`;

  overlay.innerHTML = `
    <div class="${NS}-modal-card">
      <div class="${NS}-modal-header">
        <div class="${NS}-modal-title">🔍 New Candidate Data Detected</div>
        <button id="${NS}-close-modal" style="background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div class="${NS}-modal-body">
        <p style="font-size:12px;color:rgba(242,243,237,0.7);margin-bottom:14px;">
          The AI scanned this form and found <strong>${items.length}</strong> new/updated detail(s) missing from your database profile:
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

if (window.location.href.includes('docs.google.com/forms')) {
  setTimeout(injectFloatingToolbar, 1000);
}

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
