# 🎯 OppTrack — Placement & Clinical Application Assistant

> **Intelligent campus placement tracker, Google OAuth calendar & email synchronizer, and AI-powered Chrome Extension for automatic form filling.**

[![Live Demo](https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel)](https://opp-track-clinical-placement.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎨 Modern Design System

OppTrack features a curated, high-contrast productivity design system:
- **Primary Navy (`#0B1F3A`)**: Structural headers, navigation sidebar, and primary call-to-actions.
- **Deep Blue (`#123C73`)**: Active states, emphasis text, and brand badges.
- **Vibrant Teal (`#18B7A0` / `#22C7AE`)**: Accents, progress indicators, highlights, and success cues.
- **Background (`#F7F9FC`) & Cards (`#FFFFFF`)**: Clean, distraction-free surfaces with soft borders (`#E5EAF0`).

---

## ✨ Features & Capabilities

### 1. 🌐 Web Application
- **Dashboard Overview** — High-level metrics for active opportunities, upcoming deadlines, placement statistics, and quick actions.
- **Opportunities Tracker** — Create, organize, filter, and track applications across multiple stages (Applied, Assessment, Interview, Offer, Rejected).
- **Calendar View** — Full-month and weekly schedule of interview dates, drive deadlines, and preparation milestones.
- **Google OAuth Integrations**:
  - **Gmail Auto-Fetch**: Queries your inbox for campus drive emails, shortlists, and placement notifications with one-click conversion into opportunity cards.
  - **Google Calendar Sync**: Automatically writes application deadlines, online tests, and interview schedules to your Google Calendar with custom reminders.
- **Developer Testing Program (100-User Cap)**:
  - Built-in applicant request page (`/google-tester`) for students to submit their Gmail.
  - Shows real-time slots availability (1 Developer + Approved Testers / 100 User Google Cap).
  - Automatically dispatches an instant notification email to the administrator with one-click links to Google Cloud Console Audience test users.
- **Automated Deadline Notifications**:
  - Daily cron service notifies students before critical test and application deadlines directly via platform SMTP — no manual user SMTP configuration required!
- **Profile Vault** — Centralized, secure storage for candidate credentials:
  - Personal information, Contact details, Academic scores (10th, 12th, B.Tech/Graduation, CGPA).
  - Technical skills, projects, certifications, LinkedIn, GitHub, and portfolio links.
- **Multi-LLM AI Configuration** — Support for Groq Cloud, Google Gemini, OpenAI, OpenRouter, and Anthropic with automatic client-extension synchronization.

---

### 2. 🧩 Chrome Extension (MV3)
- **AI Vector Autofill** — Scans active web forms (e.g., Google Forms) and maps questions to your Profile Vault data using LLM reasoning.
- **Confidence Scoring** — Visual confidence badge for every filled answer so students can review before submitting.
- **Local Fallback Engine** — Uses cosine vector similarity directly against MongoDB profile records if the primary LLM is unavailable.
- **New Data Learning** — Detects any new profile fields entered in external forms and prompts you to save them back to your Profile Vault.
- **Instant Settings Sync** — Seamlessly synchronizes AI models and API keys with your OppTrack web account.

---

## 🏗️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 (Vite), React Router v6, Lucide Icons, Modern CSS-in-JS |
| **Backend** | Node.js, Express.js, Nodemailer, Cron Services |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Integrations** | Google Cloud OAuth2, Gmail API (v1), Google Calendar API (v3) |
| **AI Providers** | Groq (Llama 3.3 / 3.1), Google Gemini (2.0 / 1.5 Flash), OpenAI (GPT-4o), OpenRouter |
| **Extension** | Chrome Manifest V3 (Vanilla JS, Content Scripts, Service Worker) |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement.git
cd OppTrack-Clinical-Placement
```

### 2. Configure Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173

# Google OAuth Credentials (Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback

# Platform SMTP (For automated student reminders & tester notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
ADMIN_EMAIL=your_email@gmail.com
```

### 3. Install & Start Backend

```bash
cd server
npm install
npm run dev
```

The backend server starts on `http://localhost:5000`.

### 4. Install & Start Frontend

```bash
cd ../client
npm install
npm run dev
```

The frontend web app will be available at `http://localhost:5173`.

---

## 🧩 Chrome Extension Installation

### Developer Mode Installation

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` directory from this repository.
5. Pin the OppTrack extension to your toolbar and sign in with your OppTrack account.

### Packaged Download (.zip)

> ⬇️ **[Download OppTrack.AutoFill.Extension.zip](https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip)**

---

## 🛡️ Google OAuth & Tester Program Workflow

Under Google Cloud policies, unverified applications run in **Testing Mode**, which enforces a hard limit of **100 authorized test users**:

```
[Student / Applicant]
         │
         ▼
Submits Gmail at /google-tester
         │
         ▼
[OppTrack Backend] ─────────► Sends Alert Email to Platform Admin
                                  │
                                  ▼
                     Admin clicks direct link to
                     Google Cloud Console Audience
                                  │
                                  ▼
                     Admin adds Gmail to Test Users
                                  │
                                  ▼
[Student connects Gmail & Calendar with zero verification errors!]
```

---

## 📁 Repository Structure

```
OppTrack-Clinical-Placement/
├── client/                     # React.js Frontend (Vite)
│   ├── src/
│   │   ├── pages/              # Dashboard, Opportunities, Calendar, HelpGuide, GoogleTesterPage...
│   │   ├── components/         # Sidebar, Navbar, Modals...
│   │   ├── api/                # Centralized Axios API services
│   │   └── context/            # AuthContext & state providers
│   └── package.json
│
├── server/                     # Node.js / Express Backend
│   ├── controllers/            # opportunity, gmail, calendar, tester, settings...
│   ├── models/                 # User, Opportunity, TesterRequest, Profile...
│   ├── routes/                 # API endpoints (REST)
│   ├── services/               # reminder.service, gmailSync.service, calendarSync.service...
│   ├── server.js               # Express application entrypoint
│   └── package.json
│
└── extension/                  # Chrome Manifest V3 Extension
    ├── popup/                  # Extension UI & controls
    ├── content/                # Page scanner & intelligent autofill
    ├── background.js           # Background worker & auth router
    └── manifest.json
```

---

## 👤 Author

**Nikhil Puppalwar**
- Institution: Pimpri Chinchwad College of Engineering (PCCOE), Pune
- Email: nikhilpuppalwar16@gmail.com
- GitHub: [@nikhilpuppalwar](https://github.com/nikhilpuppalwar)

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
