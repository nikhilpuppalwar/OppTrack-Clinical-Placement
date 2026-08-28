# 🎯 OppTrack — Clinical Placement Tracker

> **AI-powered placement opportunity tracker with intelligent form autofill Chrome Extension.**

[![Live Demo](https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel)](https://opp-track-clinical-placement.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Features

### 🌐 Web Application
- **Dashboard** — Overview of active opportunities, upcoming deadlines, and recent activity
- **Opportunities Tracker** — Add, update, and manage placement company applications
- **Calendar View** — Visual deadline tracker for all opportunities
- **Activity Log** — Full history of all form submissions and profile updates
- **Profile Vault** — Store all placement profile data in one place (academics, skills, address, achievements, links)
- **AI Settings** — Configure your preferred AI provider (Groq, Gemini, OpenAI, OpenRouter, Anthropic) and API key — synced with the extension

### 🧩 Chrome Extension
- **AI Vector Autofill** — Detects form fields intelligently and fills them using your Profile Vault data via LLM
- **Confidence Scoring** — Each filled answer carries a confidence score
- **Database Fallback** — If AI fails, uses direct vector search from your MongoDB profile data
- **New Data Detection** — Prompts to save new information found in a form back to your profile
- **Settings Sync** — Extension AI settings (provider, model, API key) are fully synced with the web app account
- **Register Redirect** — Not registered? The extension redirects you directly to the website registration page

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Vite), CSS-in-JS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **AI Providers** | Groq Cloud, Google Gemini, OpenAI, OpenRouter, Anthropic |
| **Vector Search** | In-memory cosine similarity vector index (custom) |
| **Extension** | Chrome MV3 Extension (Vanilla JS) |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement.git
cd OppTrack-Clinical-Placement
```

### 2. Setup Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

> **Note:** AI API keys are **not** stored in `.env` — they are managed per-user in the database via the Settings page.

### 3. Install & Run Backend

```bash
cd server
npm install
npm run dev
```

### 4. Install & Run Frontend

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🧩 Chrome Extension Setup

### Load as Unpacked Extension (Development)

1. Go to `chrome://extensions/` in your browser
2. Enable **Developer Mode** (toggle top-right)
3. Click **Load Unpacked**
4. Select the `extension/` folder from this repo
5. The OppTrack AI Autofill extension will appear in your extensions bar

### Download Packaged Extension (Release)

> ⬇️ **[Download OppTrack.AutoFill.Extension.zip](https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip)**

---

## 🤖 AI Provider Configuration

After registering and logging in:

1. Go to **Settings** in the web app (or click ⚙️ in the extension)
2. Select your **AI Provider**:
   - **Groq Cloud** — Free, ultra-fast (recommended for beginners) — API key from [console.groq.com](https://console.groq.com/keys) starts with `gsk_`
   - **Google Gemini** — Free tier available — API key from [aistudio.google.com](https://aistudio.google.com/apikey) starts with `AIzaSy`
   - **OpenAI** — GPT-4o-mini / GPT-4o — API key from [platform.openai.com](https://platform.openai.com/api-keys) starts with `sk-`
   - **OpenRouter** — Access 100+ models — API key from [openrouter.ai](https://openrouter.ai) starts with `sk-or-`
   - **Anthropic** — Claude models
3. Select a **Model** from the dropdown
4. Paste your **API Key**
5. Click **Test AI Connection** then **Save AI Settings**

> Settings sync automatically between the web app and extension!

---

## 📁 Project Structure

```
OppTrack-Clinical-Placement/
├── client/                    # React.js Frontend (Vite)
│   └── src/
│       ├── pages/             # Dashboard, Opportunities, Profile, Settings...
│       ├── components/        # Sidebar, MissingKeyModal, etc.
│       ├── api/               # Axios API layer
│       └── context/           # Auth context
│
├── server/                    # Node.js / Express Backend
│   ├── controllers/           # aiFormController, settingsController...
│   ├── models/                # User, Profile, Opportunity, ActivityLog...
│   ├── routes/                # API route definitions
│   ├── services/              # aiExtraction.service, vector.service...
│   └── middleware/            # Auth middleware (JWT)
│
└── extension/                 # Chrome MV3 Extension
    ├── popup/                 # popup.html, popup.js, popup.css
    ├── content/               # content.js (form scanner & autofill)
    └── background.js          # Service worker (auth, message routing)
```

---

## 🔗 Links

| Resource | URL |
|---|---|
| 🌐 Live Web App | [opp-track-clinical-placement.vercel.app](https://opp-track-clinical-placement.vercel.app) |
| 📦 Extension Download | [OppTrack.AutoFill.Extension.zip](https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip) |
| ⭐ GitHub Repo | [nikhilpuppalwar/OppTrack-Clinical-Placement](https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement) |

---

## 👤 Author

**Nikhil Puppalwar**
- College: Pimpri Chinchwad College of Engineering (PCCOE), Pune
- Email: nikhil.puppalwar23@pccoepune.org

---

## 📜 License

This project is licensed under the MIT License.
