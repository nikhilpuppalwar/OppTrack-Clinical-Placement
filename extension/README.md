# OppTrack Autofill — Chrome Extension

A Chrome Extension that autofills Google Forms with your OppTrack profile data, with intelligent confidence scoring, sensitive field masking, and opportunity tracking.

## Directory Structure

```
extension/
├── manifest.json          # MV3 manifest
├── background.js          # Service worker (token storage, API relay, submission detection)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styles
└── content/
    └── content.js         # Content script injected into Google Forms
```

## Installation (Developer Mode)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` directory from this project
5. The OppTrack icon will appear in your toolbar

## Configuration

The extension is pre-configured for the live deployment:

| Setting | Value |
|---------|-------|
| **Backend API** | `https://opptrack-clinical-placement.onrender.com/api` |
| **Frontend** | `https://opp-track-clinical-placement.vercel.app` |

For **local development**, update `background.js` line 12:

```js
// Switch to local backend during dev
const API_BASE = 'http://localhost:5000/api';
```

## Features

### 1. Sensitive Field Confirmation Gate
Fields marked `sensitive: true` in your profile (Aadhar, PAN, or manually flagged) show a blurred overlay. Click to reveal and autofill. Every reveal is logged to ActivityLogs with event type `sensitive_field_revealed` — value is **never** logged.

### 2. Per-Field Confidence Indicator
After autofill, each filled field shows a colored dot:
- 🟢 **Green** — ≥85% confidence (exact or strong match)
- 🟡 **Yellow** — 50–84% confidence (fuzzy/semantic match, worth reviewing)
- No dot/no fill — <50% confidence (skipped to avoid wrong data)

Hover the dot to see: `"Matched to: [Profile Field] (XX% confidence)"`

### 3. Manual Override Detection
When you edit an autofilled field (detected on `blur`), the confidence dot turns 🔵 **blue** ("Manually edited"). The correction is stored in session memory — if you trigger Save/Sync afterward, the corrected value is used, not the original autofilled value.

### 4. Auto-Detect + Link to Opportunity
If the current Google Form URL matches a link stored in any of your Opportunities, a banner appears in the popup showing the company and role. You can opt in to auto-marking the opportunity as "Applied" when you submit the form (detected by the confirmation page URL pattern).

### 5. Form History Log
Every autofill action is logged to the `FormHistory` MongoDB collection and appears:
- In the extension popup (last 5 entries under "Recent Forms")
- In the web app at `/history` → **Extension Activity** tab (paginated, chronological)

### 6. File Upload Helper
When a form has a file upload question (Resume, Marksheet, etc.), a helper card is injected **above** the file input showing your matching documents with preview/download links and a reminder to upload manually. The actual `<input type="file">` is **never touched**.

## Backend Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/opportunities/match-url?url=` | Match form URL to an opportunity |
| POST | `/api/form-history` | Log form autofill/sync action |
| GET | `/api/form-history` | Paginated form history |
| POST | `/api/form-history/sensitive-reveal` | Log a sensitive field reveal |

All endpoints require JWT `Authorization: Bearer <token>` header and are scoped to `req.user._id`.

## Marking Fields as Sensitive

In the Profile Vault, any field's `sensitive` flag can be set to `true`. The following fields are treated as sensitive by default (detected by label matching in the content script):

- Aadhar Number / Aadhaar No
- PAN Number / PAN No

To mark additional fields sensitive: update the field in your profile via the Settings or Profile page (the `sensitive` flag is now stored in the `fields` sub-document schema).
