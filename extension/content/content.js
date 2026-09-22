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
  try { el.focus(); } catch {}
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
  try { el.blur(); } catch {}
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
      background: #0B1F3A;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(24, 183, 160, 0.4);
      box-shadow: 0 10px 30px rgba(11, 31, 58, 0.35);
      border-radius: 30px;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 999999;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .${NS}-btn {
      background: #18B7A0;
      color: #FFFFFF;
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
      background: #149D89;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(24, 183, 160, 0.35);
    }
    .${NS}-btn-secondary {
      background: rgba(255, 255, 255, 0.12);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .${NS}-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.22);
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
      box-shadow: 0 0 0 2px rgba(11, 31, 58, 0.15);
      transition: transform 0.15s;
    }
    .${NS}-dot:hover { transform: translateY(-50%) scale(1.4); }
    .${NS}-dot.high   { background: #18B7A0; }
    .${NS}-dot.medium { background: #F59E0B; }
    .${NS}-dot.manual { background: #2563EB; }

    /* Tooltip */
    .${NS}-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      right: -8px;
      background: #0B1F3A;
      color: #FFFFFF;
      font-size: 11px;
      font-family: 'Inter', system-ui, sans-serif;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(24, 183, 160, 0.3);
      white-space: max-content;
      max-width: 280px;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(11, 31, 58, 0.3);
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
      background: rgba(11, 31, 58, 0.9);
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
    .${NS}-sensitive-overlay:hover { background: rgba(11, 31, 58, 0.8); }
    .${NS}-sensitive-text {
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 500;
    }

    /* Modal Overlay */
    .${NS}-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(11, 31, 58, 0.6);
      backdrop-filter: blur(8px);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .${NS}-modal-card {
      background: #FFFFFF;
      border: 1px solid #E5EAF0;
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(11, 31, 58, 0.2);
      color: #172033;
      overflow: hidden;
    }
    .${NS}-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #E5EAF0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .${NS}-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #0B1F3A;
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
      background: #F8FAFD;
      border: 1px solid #E5EAF0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .${NS}-item-info { flex: 1; }
    .${NS}-item-label { font-size: 13px; font-weight: 600; color: #0B1F3A; }
    .${NS}-item-val { font-size: 12px; color: #123C73; font-family: monospace; margin-top: 2px; font-weight: 600; }
    .${NS}-item-reason { font-size: 11px; color: #667085; margin-top: 4px; }
    .${NS}-modal-footer {
      padding: 14px 20px;
      border-top: 1px solid #E5EAF0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: #F8FAFD;
    }
  `;
  document.head.appendChild(style);
}

// ─── Universal Form Parser ──────────────────────────────────────────────────
function getQuestionBlocks() {
  const gFormBlocks = Array.from(
    document.querySelectorAll('div[role="listitem"], div.Qr7Oae, div.freebirdFormviewerViewItemsItemItem')
  );
  if (gFormBlocks.length > 0) return gFormBlocks;

  const genericBlocks = Array.from(
    document.querySelectorAll('.form-group, .form-row, .field, fieldset, tr:has(input, select, textarea)')
  );
  if (genericBlocks.length > 0) return genericBlocks;

  return Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select')).map(
    (el) => el.closest('.form-group, .field, div') || el.parentElement || el
  );
}

function getQuestionLabel(block) {
  if (!block) return '';
  const labelEl = block.querySelector(
    '[data-params], .M7eMe, .LC3bg, .freebirdFormviewerViewItemsItemItemTitle, [role="heading"], label, legend'
  );
  if (labelEl && labelEl.textContent.trim()) {
    return labelEl.textContent.replace(/\s*\*+\s*$/, '').trim();
  }

  const inputEl = block.querySelector('input, textarea, select');
  if (inputEl) {
    if (inputEl.getAttribute('aria-label')) {
      return inputEl.getAttribute('aria-label').replace(/\s*\*+\s*$/, '').trim();
    }
    if (inputEl.id) {
      const associatedLabel = document.querySelector(`label[for="${inputEl.id}"]`);
      if (associatedLabel) return associatedLabel.textContent.replace(/\s*\*+\s*$/, '').trim();
    }
    if (inputEl.placeholder) return inputEl.placeholder.trim();
    if (inputEl.name) return inputEl.name.trim();
  }
  return '';
}

function getChoiceLabel(el) {
  if (!el) return '';
  if (el.tagName?.toLowerCase() === 'input') {
    if (el.labels && el.labels.length && el.labels[0].textContent) {
      return el.labels[0].textContent.trim();
    }
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    if (el.nextElementSibling && el.nextElementSibling.tagName === 'LABEL') {
      return el.nextElementSibling.textContent.trim();
    }
    if (el.value) return el.value.trim();
  }

  return (
    el.getAttribute('data-value') ||
    el.getAttribute('aria-label') ||
    el.querySelector('.docssharedWiztogglelbl, span')?.textContent ||
    el.textContent ||
    ''
  ).trim();
}

/**
 * Universal Form Field Inspection: Supports Checkbox, Radio, Picklist/Dropdown, Short Answer,
 * Paragraph, Date/Time parts, and File Uploads
 */
function inspectQuestionBlock(block) {
  const label = getQuestionLabel(block);
  if (!label) return null;

  // 1. File Upload
  const fileInput = block.querySelector('input[type="file"]');
  if (fileInput) {
    return { label, type: 'file', element: fileInput, options: [] };
  }

  // 2. Date Parts (Google Forms 3-part Day/Month/Year inputs)
  const dayInput = block.querySelector('input[aria-label*="Day" i], input[placeholder*="DD" i], input[name*="day" i]');
  const monthInput = block.querySelector('input[aria-label*="Month" i], input[placeholder*="MM" i], input[name*="month" i]');
  const yearInput = block.querySelector('input[aria-label*="Year" i], input[placeholder*="YYYY" i], input[name*="year" i]');
  if (dayInput && monthInput && yearInput) {
    return {
      label,
      type: 'date_parts',
      dayInput,
      monthInput,
      yearInput,
      options: [],
    };
  }

  // 3. Time Parts (Google Forms Hour/Minute inputs)
  const hourInput = block.querySelector('input[aria-label*="Hour" i], input[placeholder*="HH" i]');
  const minuteInput = block.querySelector('input[aria-label*="Minute" i], input[placeholder*="MM" i]');
  if (hourInput && minuteInput) {
    return {
      label,
      type: 'time_parts',
      hourInput,
      minuteInput,
      options: [],
    };
  }

  // 4. Native Date / Time input
  const dateInput = block.querySelector('input[type="date"]');
  if (dateInput) {
    return {
      label,
      type: 'date',
      element: dateInput,
      currentValue: dateInput.value || '',
      options: [],
    };
  }
  const timeInput = block.querySelector('input[type="time"]');
  if (timeInput) {
    return {
      label,
      type: 'time',
      element: timeInput,
      currentValue: timeInput.value || '',
      options: [],
    };
  }

  // 5. Dropdown / Picklist (Google Forms listbox or Native <select>)
  const listboxEl = block.querySelector('div[role="listbox"], div[role="combobox"]');
  if (listboxEl) {
    const optionEls = Array.from(block.querySelectorAll('div[role="option"]'));
    const options = optionEls.map(getChoiceLabel).filter(Boolean);
    return { label, type: 'dropdown', listboxEl, optionEls, options };
  }
  const selectEl = block.querySelector('select');
  if (selectEl) {
    const options = Array.from(selectEl.options)
      .map((o) => (o.text || o.value).trim())
      .filter((o) => o && !o.toLowerCase().includes('select') && !o.toLowerCase().includes('choose'));
    return { label, type: 'dropdown', selectEl, options };
  }

  // 6. Radio Buttons / Multiple Choice / Rating Scale (Linear 1-5, 1-10)
  const radioEls = Array.from(block.querySelectorAll('div[role="radio"], input[type="radio"]'));
  if (radioEls.length > 0) {
    const options = radioEls.map(getChoiceLabel).filter(Boolean);
    const otherInput = block.querySelector('input.Hvn9uc, input[aria-label*="Other" i], input[type="text"]:not([aria-label=""])');
    return { label, type: 'radio', radioEls, otherInput, options };
  }

  // 7. Checkboxes (Multi-select)
  const checkEls = Array.from(block.querySelectorAll('div[role="checkbox"], input[type="checkbox"]'));
  if (checkEls.length > 0) {
    const options = checkEls.map(getChoiceLabel).filter(Boolean);
    const otherInput = block.querySelector('input.Hvn9uc, input[aria-label*="Other" i]');
    return { label, type: 'checkbox', checkEls, otherInput, options };
  }

  // 8. Paragraph / Long Answer / Textarea
  const textarea = block.querySelector('textarea, div[contenteditable="true"]');
  if (textarea) {
    return {
      label,
      type: 'paragraph',
      element: textarea,
      placeholder: textarea.placeholder || '',
      currentValue: textarea.value || textarea.innerText || '',
      options: [],
    };
  }

  // 9. Short Answer / Text / Email / Phone / URL / Number
  const textInput = block.querySelector(
    'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"], input[type="search"], input:not([type])'
  );
  if (textInput) {
    return {
      label,
      type: 'short_text',
      element: textInput,
      placeholder: textInput.placeholder || '',
      currentValue: textInput.value || '',
      options: [],
    };
  }

  return null;
}

function parseDateTokens(str) {
  if (!str) return null;
  const s = String(str).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return { year: m[1], month: m[2].padStart(2, '0'), day: m[3].padStart(2, '0') };
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return { day: m[1].padStart(2, '0'), month: m[2].padStart(2, '0'), year: m[3] };
  return null;
}

/**
 * Dynamic semantic similarity scoring for form options (Token Jaccard, Acronym, and Numeric match)
 */
function computeDynamicOptionScore(optionLabel, targetValue) {
  if (!optionLabel || !targetValue) return 0;
  const optStr = String(optionLabel).trim().toLowerCase();
  const targetStr = String(targetValue).trim().toLowerCase();
  const clean = (s) => s.replace(/[^a-z0-9]/g, '');
  const optNorm = clean(optStr);
  const targetNorm = clean(targetStr);

  if (!optNorm || !targetNorm) return 0;
  if (optNorm === targetNorm) return 1.0;

  // Numeric match for ratings & linear scale (1-5, 1-10)
  const targetNum = targetStr.match(/\b\d+\b/)?.[0];
  const optNum = optStr.match(/\b\d+\b/)?.[0];
  if (targetNum && optNum && targetNum === optNum) return 1.0;

  let score = 0;
  // Substring / continuous inclusion
  if (optNorm.includes(targetNorm) || targetNorm.includes(optNorm)) {
    score = Math.max(score, 0.7);
  }

  // Token overlap / Jaccard
  const optTokens = optStr.split(/[^a-z0-9]+/).filter(Boolean);
  const targetTokens = targetStr.split(/[^a-z0-9]+/).filter(Boolean);
  const common = optTokens.filter((t) => t.length > 1 && targetTokens.includes(t));
  if (common.length > 0) {
    const overlapRatio = common.length / Math.max(optTokens.length, targetTokens.length);
    score = Math.max(score, overlapRatio * 0.85);
  }

  // Acronym match (e.g. "CS" vs "Computer Science", "IT" vs "Information Technology")
  const targetAcronym = targetTokens.map((t) => t[0]).join('');
  const optAcronym = optTokens.map((t) => t[0]).join('');
  if ((targetAcronym && optNorm === targetAcronym) || (optAcronym && targetNorm === optAcronym)) {
    score = Math.max(score, 0.9);
  }

  return score;
}

/**
 * Click / Set value on any Form element dynamically (Checkbox, Radio, Picklist, Short Answer, Paragraph, Date/Time)
 */
function setAnswerOnBlock(blockInfo, value) {
  if (!blockInfo || value === undefined || value === null || value === '') return false;

  const cleanStr = String(value).trim();

  // 1. Text Inputs & Paragraphs
  if (blockInfo.type === 'short_text' || blockInfo.type === 'paragraph') {
    if (blockInfo.element) {
      if (blockInfo.element.getAttribute('contenteditable') === 'true') {
        blockInfo.element.focus();
        blockInfo.element.innerText = cleanStr;
        blockInfo.element.dispatchEvent(new Event('input', { bubbles: true }));
        blockInfo.element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        setNativeValue(blockInfo.element, cleanStr);
      }
      blockInfo.element.dataset.otFilled = '1';
      blockInfo.element.dataset.otOriginal = cleanStr;
      return true;
    }
  }

  // 2. Radio Buttons / MCQ / Linear Scale / Ratings
  if (blockInfo.type === 'radio' && blockInfo.radioEls?.length) {
    let bestRadio = null;
    let highestScore = 0;

    for (const rEl of blockInfo.radioEls) {
      const lbl = getChoiceLabel(rEl);
      const score = computeDynamicOptionScore(lbl, cleanStr);
      if (score > highestScore) {
        highestScore = score;
        bestRadio = rEl;
      }
    }

    if (bestRadio && highestScore >= 0.35) {
      const isChecked = bestRadio.getAttribute('aria-checked') === 'true' || bestRadio.checked === true;
      if (!isChecked) {
        bestRadio.click();
        if (bestRadio.tagName?.toLowerCase() === 'input') {
          bestRadio.checked = true;
          bestRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      return true;
    }

    // Fallback: Check if an "Other" option exists
    const otherRadio = blockInfo.radioEls.find((rEl) => {
      const lbl = getChoiceLabel(rEl).toLowerCase();
      return lbl.includes('other') || rEl.getAttribute('aria-label')?.toLowerCase().includes('other');
    });

    if (otherRadio) {
      otherRadio.click();
      if (blockInfo.otherInput) {
        setNativeValue(blockInfo.otherInput, cleanStr);
      }
      return true;
    }
  }

  // 3. Checkboxes (Multi-select)
  if (blockInfo.type === 'checkbox' && blockInfo.checkEls?.length) {
    const targetItems = Array.isArray(value)
      ? value.map((s) => String(s).trim()).filter(Boolean)
      : cleanStr.split(/[,;\n|]+/).map((s) => s.trim()).filter(Boolean);

    let clickedAny = false;
    const unmatchedItems = [...targetItems];

    blockInfo.checkEls.forEach((cEl) => {
      const lbl = getChoiceLabel(cEl);
      if (!lbl) return;

      let isMatch = false;
      let matchedItemIdx = -1;

      for (let i = 0; i < unmatchedItems.length; i++) {
        const score = computeDynamicOptionScore(lbl, unmatchedItems[i]);
        if (score >= 0.35) {
          isMatch = true;
          matchedItemIdx = i;
          break;
        }
      }

      if (isMatch) {
        if (matchedItemIdx !== -1) unmatchedItems.splice(matchedItemIdx, 1);

        const isChecked = cEl.getAttribute('aria-checked') === 'true' || cEl.checked === true;
        if (!isChecked) {
          cEl.click();
          if (cEl.tagName?.toLowerCase() === 'input') {
            cEl.checked = true;
            cEl.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        clickedAny = true;
      }
    });

    if (unmatchedItems.length > 0 && blockInfo.otherInput) {
      const otherCheck = blockInfo.checkEls.find((cEl) => {
        const lbl = getChoiceLabel(cEl).toLowerCase();
        return lbl.includes('other') || cEl.getAttribute('aria-label')?.toLowerCase().includes('other');
      });
      if (otherCheck) {
        const isChecked = otherCheck.getAttribute('aria-checked') === 'true' || otherCheck.checked === true;
        if (!isChecked) otherCheck.click();
        setNativeValue(blockInfo.otherInput, unmatchedItems.join(', '));
        clickedAny = true;
      }
    }

    return clickedAny;
  }

  // 4. Dropdown / Picklist / Select
  if (blockInfo.type === 'dropdown') {
    if (blockInfo.selectEl) {
      const select = blockInfo.selectEl;
      let bestOpt = null;
      let highestScore = 0;

      for (const opt of Array.from(select.options)) {
        const score = Math.max(
          computeDynamicOptionScore(opt.text, cleanStr),
          computeDynamicOptionScore(opt.value, cleanStr)
        );
        if (score > highestScore) {
          highestScore = score;
          bestOpt = opt;
        }
      }

      if (bestOpt && highestScore >= 0.3) {
        select.value = bestOpt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }

    if (blockInfo.listboxEl) {
      blockInfo.listboxEl.click();
      setTimeout(() => {
        const optionEls = Array.from(
          document.querySelectorAll('div[role="option"], div.OA0qNb div[jsaction], div.MocG8c')
        );
        let bestOpt = null;
        let highestScore = 0;

        for (const oEl of optionEls) {
          const lbl = getChoiceLabel(oEl);
          if (!lbl || lbl.toLowerCase() === 'choose' || lbl.toLowerCase() === 'select') continue;
          const score = computeDynamicOptionScore(lbl, cleanStr);
          if (score > highestScore) {
            highestScore = score;
            bestOpt = oEl;
          }
        }

        if (bestOpt && highestScore >= 0.3) {
          bestOpt.click();
          bestOpt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }
      }, 180);
      return true;
    }
  }

  // 5. Date Parts (Google Forms 3-part Day/Month/Year)
  if (blockInfo.type === 'date_parts') {
    const parts = parseDateTokens(cleanStr);
    if (parts) {
      if (blockInfo.dayInput) setNativeValue(blockInfo.dayInput, parts.day);
      if (blockInfo.monthInput) setNativeValue(blockInfo.monthInput, parts.month);
      if (blockInfo.yearInput) setNativeValue(blockInfo.yearInput, parts.year);
      return true;
    }
  }

  // 6. Native Date
  if (blockInfo.type === 'date' && blockInfo.element) {
    const parts = parseDateTokens(cleanStr);
    const dateFormatted = parts ? `${parts.year}-${parts.month}-${parts.day}` : cleanStr;
    setNativeValue(blockInfo.element, dateFormatted);
    return true;
  }

  // 7. Time Parts
  if (blockInfo.type === 'time_parts') {
    const tm = cleanStr.match(/(\d{1,2})[:.](\d{2})/);
    if (tm) {
      if (blockInfo.hourInput) setNativeValue(blockInfo.hourInput, tm[1].padStart(2, '0'));
      if (blockInfo.minuteInput) setNativeValue(blockInfo.minuteInput, tm[2]);
      return true;
    }
  }

  // 8. Native Time
  if (blockInfo.type === 'time' && blockInfo.element) {
    setNativeValue(blockInfo.element, cleanStr);
    return true;
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

  // Record in Form History so Recent Forms in extension popup is immediately updated!
  msg('POST_FORM_HISTORY', {
    payload: {
      formUrl: window.location.href,
      formTitle: document.title || 'Google Form',
      action: filledCount > 0 ? 'autofill' : 'scan',
      fieldsFilledCount: filledCount,
    },
  }).catch(() => {});

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
  card.style.cssText = 'border:1px dashed rgba(24,183,160,0.4);border-radius:8px;background:rgba(24,183,160,0.06);padding:10px 14px;margin-top:8px;font-size:12px;color:#0B1F3A;';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;color:#0D7A6B;margin-bottom:6px;display:flex;align-items:center;gap:5px;';
  title.textContent = `📎 Suggested ${typeHint.toUpperCase()} Document`;
  card.appendChild(title);

  matched.forEach((doc) => {
    const row = document.createElement('div');
    row.style.cssText = 'padding:3px 0;';

    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'color:#2563EB;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:4px;';
    link.textContent = `↗ Open ${doc.label}`;

    row.appendChild(link);
    card.appendChild(row);
  });

  const reminder = document.createElement('div');
  reminder.style.cssText = 'font-size:11px;color:#667085;margin-top:6px;';
  reminder.textContent = 'ℹ️ Open/download file link, then attach to the file upload box above';
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
    if (info.currentValue) {
      currentValue = info.currentValue;
    } else if (info.type === 'radio' && info.radioEls) {
      const selected = info.radioEls.find((r) => r.getAttribute('aria-checked') === 'true' || r.checked);
      if (selected) currentValue = getChoiceLabel(selected);
      if (info.otherInput && info.otherInput.value) currentValue = info.otherInput.value;
    } else if (info.type === 'checkbox' && info.checkEls) {
      const selected = info.checkEls.filter((c) => c.getAttribute('aria-checked') === 'true' || c.checked);
      if (selected.length) currentValue = selected.map(getChoiceLabel).join(', ');
      if (info.otherInput && info.otherInput.value) {
        currentValue = currentValue ? `${currentValue}, ${info.otherInput.value}` : info.otherInput.value;
      }
    } else if (info.type === 'dropdown') {
      if (info.selectEl) {
        currentValue = info.selectEl.options[info.selectEl.selectedIndex]?.text || '';
      } else if (info.listboxEl) {
        currentValue = getChoiceLabel(info.listboxEl) || '';
      }
    } else if (info.type === 'date_parts') {
      const d = info.dayInput?.value || '';
      const m = info.monthInput?.value || '';
      const y = info.yearInput?.value || '';
      if (d && m && y) currentValue = `${y}-${m}-${d}`;
    } else if (info.type === 'time_parts') {
      const h = info.hourInput?.value || '';
      const min = info.minuteInput?.value || '';
      if (h && min) currentValue = `${h}:${min}`;
    }

    formFields.push({
      label: info.label,
      value: currentValue.trim(),
      type: info.type,
      options: info.options || [],
      placeholder: info.placeholder || '',
    });
  });

  if (!formFields.length) {
    alert('No form fields detected on this page to analyze.');
    return;
  }

  const formTitle = document.title || 'Google Form';

  // Record in Form History so Recent Forms in extension popup is immediately updated!
  msg('POST_FORM_HISTORY', {
    payload: {
      formUrl: window.location.href,
      formTitle: formTitle,
      action: 'sync',
      fieldsFilledCount: formFields.filter(f => f.value).length,
    },
  }).catch(() => {});

  const res = await msg('ANALYZE_NEW_DATA', {
    payload: { formFields, formTitle },
  });

  if (!res.ok) {
    alert(`Analysis Failed: ${res.data?.message || res.error || 'Server error'}`);
    return;
  }

  const detectedNewData = res.data?.detectedNewData || [];

  if (!detectedNewData.length) {
    alert('AI Analysis Complete: All questions on this form already match your Profile Vault!');
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
        <div class="${NS}-modal-title">✨ AI Suggested Fields to Add / Update</div>
        <button id="${NS}-close-modal" style="background:none;border:none;color:#667085;font-size:18px;cursor:pointer;line-height:1;">✕</button>
      </div>
      <div class="${NS}-modal-body">
        <p style="font-size:12.5px;color:#667085;margin-bottom:14px;line-height:1.5;">
          The AI analyzed this form and identified <strong>${items.length}</strong> detail(s) missing or updated compared to your Profile Vault. Review or edit values below:
        </p>
        <div id="${NS}-items-container">
          ${items
            .map(
              (item) => `
            <div class="${NS}-item-row" style="background:#F8FAFD;border:1px solid #E5EAF0;border-radius:10px;padding:12px;margin-bottom:12px;display:flex;gap:12px;align-items:flex-start;">
              <input type="checkbox" id="chk_${item.id}" data-id="${item.id}" checked style="margin-top:6px;accent-color:#18B7A0;cursor:pointer;flex-shrink:0;" />
              <div class="${NS}-item-info" style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <span class="${NS}-item-label" style="font-size:13px;font-weight:700;color:#0B1F3A;">${item.label}</span>
                  ${item.isFile ? `<span style="font-size:10px;font-weight:700;background:#EDE9FE;color:#5B21B6;padding:1px 6px;border-radius:4px;">File Upload</span>` : ''}
                </div>
                <div style="margin:4px 0;">
                  <input type="text" id="val_${item.id}" value="${item.value || ''}" placeholder="${item.isFile ? 'e.g. Google Drive Link or File Name' : 'Enter value to save into vault...'}" style="width:100%;padding:7px 10px;border:1px solid #CBD5E1;border-radius:6px;font-size:12.5px;color:#0B1F3A;background:#FFFFFF;outline:none;box-sizing:border-box;" />
                </div>
                <div class="${NS}-item-reason" style="font-size:11.5px;color:#667085;margin-top:4px;">${item.reason}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="${NS}-modal-footer" style="padding:14px 20px;border-top:1px solid #E5EAF0;display:flex;justify-content:flex-end;gap:10px;background:#F8FAFD;">
        <button id="${NS}-cancel-btn" class="${NS}-btn" style="background:#FFFFFF;border:1px solid #E5EAF0;color:#667085;padding:8px 16px;border-radius:6px;cursor:pointer;">Cancel</button>
        <button id="${NS}-save-db-btn" class="${NS}-btn" style="background:#0B1F3A;color:#FFFFFF;padding:8px 18px;border-radius:6px;font-weight:700;cursor:pointer;">💾 Send to Profile Vault</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById(`${NS}-close-modal`).onclick = () => overlay.remove();
  document.getElementById(`${NS}-cancel-btn`).onclick = () => overlay.remove();

  document.getElementById(`${NS}-save-db-btn`).onclick = async () => {
    const saveBtn = document.getElementById(`${NS}-save-db-btn`);
    saveBtn.disabled = true;
    saveBtn.textContent = 'Sending to Vault…';

    const fieldsToSave = items
      .filter((it) => {
        const chk = document.getElementById(`chk_${it.id}`);
        return chk && chk.checked;
      })
      .map((it) => {
        const valInput = document.getElementById(`val_${it.id}`);
        return {
          ...it,
          value: valInput ? valInput.value.trim() : it.value,
        };
      });

    if (!fieldsToSave.length) {
      alert('Please select at least one item to save.');
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Send to Profile Vault';
      return;
    }

    const syncRes = await msg('SYNC_NEW_DATA', {
      payload: {
        fieldsToSave,
        formUrl: window.location.href,
        formTitle: document.title || 'Google Form',
      }
    });
    overlay.remove();

    if (syncRes.ok) {
      alert(
        syncRes.data?.message ||
          'Candidate fields sent to your OppTrack Profile Vault! Please open OppTrack to review and verify the AI suggestions.'
      );
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
    <span style="font-weight:700;font-size:12px;color:#FFFFFF;display:flex;align-items:center;gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:#18B7A0;display:inline-block;box-shadow:0 0 6px #18B7A0;"></span> OppTrack AI</span>
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
      .then((res) => {
        try { sendResponse(res); } catch (e) {}
      })
      .catch((err) => {
        try { sendResponse({ fieldsFilledCount: 0, error: err.message }); } catch (e) {}
      });
    return true;
  }
  if (message.type === 'ANALYZE_NEW_DATA_NOW') {
    analyzeAndSaveNewData()
      .then(() => {
        try { sendResponse({ ok: true }); } catch (e) {}
      })
      .catch((err) => {
        try { sendResponse({ ok: false, error: err.message }); } catch (e) {}
      });
    return true;
  }
});
