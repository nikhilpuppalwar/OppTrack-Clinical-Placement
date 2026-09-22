import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Puzzle, HelpCircle, Key, Sparkles, Download, ExternalLink, CheckCircle2, ShieldCheck, Zap, Terminal, BookOpen, Calendar, Mail, ArrowRight } from 'lucide-react';

const EXTENSION_DOWNLOAD_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip';
const GITHUB_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement';

export default function HelpGuide() {
  const [activeTab, setActiveTab] = useState('extension');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0D7A6B', background: '#E8F8F5', border: '1px solid rgba(24,183,160,0.3)', padding: '3px 8px', borderRadius: 4 }}>
              User Guide & Documentation
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B1F3A', margin: 0, letterSpacing: '-0.02em' }}>
            Help & Extension Guide
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#667085' }}>
            Everything you need to set up the Chrome extension, configure AI models, and connect Google OAuth.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/google-tester"
            style={{
              background: '#E8F8F5',
              color: '#0D7A6B',
              border: '1px solid rgba(24,183,160,0.4)',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={16} /> Request Google Tester Access
          </Link>
          <a
            href={EXTENSION_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#0B1F3A',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(11,31,58,0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={15} /> Download Extension (.zip)
          </a>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, background: '#F0F4F8', border: '1px solid #E5EAF0', borderRadius: 10, padding: 5, marginBottom: 28, overflowX: 'auto' }}>
        {[
          { id: 'extension', label: 'Chrome Extension Setup', icon: Puzzle },
          { id: 'google', label: 'Google OAuth & Calendar', icon: ShieldCheck },
          { id: 'about', label: 'About OppTrack', icon: BookOpen },
          { id: 'ai', label: 'AI & API Keys Guide', icon: Key },
          { id: 'faq', label: 'Troubleshooting & FAQ', icon: HelpCircle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 7,
                border: 'none',
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#0B1F3A' : '#667085',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isActive ? '0 1px 3px rgba(11,31,58,0.08)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={15} color={isActive ? '#18B7A0' : '#667085'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Extension Setup */}
      {activeTab === 'extension' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Banner */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0B1F3A' }}>
                OppTrack AI Autofill Extension v1.0
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#667085' }}>
                Autofills Google Forms using your Profile Vault data powered by LLM vector matching.
              </p>
            </div>
            <a
              href={EXTENSION_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#E8F8F5',
                color: '#087F71',
                border: '1px solid #A3E5D9',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={14} /> Download ZIP
            </a>
          </div>

          {/* Installation Steps */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 20px', paddingBottom: 14, borderBottom: '1px solid #F0F4F8' }}>
              How to Install the Extension in Google Chrome
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  step: '01',
                  title: 'Download & Extract Extension ZIP',
                  desc: 'Click the Download Extension button above. Once downloaded, right-click the .zip file and extract its contents into a folder on your computer.',
                },
                {
                  step: '02',
                  title: 'Open Chrome Extensions Page',
                  desc: 'Open Google Chrome and type chrome://extensions/ in the address bar (or go to Menu → Extensions → Manage Extensions).',
                },
                {
                  step: '03',
                  title: 'Enable Developer Mode',
                  desc: 'In the top right corner of the Chrome Extensions page, toggle ON the "Developer Mode" switch.',
                },
                {
                  step: '04',
                  title: 'Click "Load Unpacked"',
                  desc: 'Click the "Load Unpacked" button that appears in the top left header bar.',
                },
                {
                  step: '05',
                  title: 'Select the Extension Folder',
                  desc: 'Browse to and select the extracted extension folder containing manifest.json.',
                },
                {
                  step: '06',
                  title: 'Pin & Sign In',
                  desc: 'Pin the OppTrack extension to your Chrome toolbar. Click the extension icon and log in with your OppTrack account credentials!',
                },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, background: '#F8FAFD', padding: 14, borderRadius: 10, border: '1px solid #E5EAF0' }}>
                  <div style={{ background: '#E8F8F5', color: '#087F71', border: '1px solid #A3E5D9', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                    {item.step}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 3px', fontSize: 14, color: '#0B1F3A', fontWeight: 600 }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Google OAuth & Calendar */}
      {activeTab === 'google' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0B1F3A 0%, #123C73 100%)',
            borderRadius: 16, padding: 30, color: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(11,31,58,0.12)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 20
          }}>
            <div style={{ maxWidth: 580 }}>
              <span style={{
                background: 'rgba(24,183,160,0.2)', color: '#22C7AE',
                border: '1px solid rgba(24,183,160,0.4)', padding: '4px 10px',
                borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex',
                alignItems: 'center', gap: 6, marginBottom: 12
              }}>
                <ShieldCheck size={14} /> Google Cloud OAuth Testing Program
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px 0', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                Gmail Auto-Fetch & Google Calendar 2-Way Sync
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.6 }}>
                Under Google Cloud policy, unverified apps are capped at <strong>100 authorized test users</strong>. Submit your Gmail to be added by the admin and unlock seamless email scanning & calendar reminders.
              </p>
            </div>
            <Link
              to="/google-tester"
              style={{
                background: '#18B7A0', color: '#0B1F3A', padding: '12px 22px',
                borderRadius: 9, fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 2px 10px rgba(24,183,160,0.3)', transition: 'all 0.15s ease'
              }}
            >
              Request Access (99 Slots Open) <ArrowRight size={15} />
            </Link>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8F8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Mail size={20} color="#0D7A6B" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 6px 0' }}>
                1. Gmail Auto-Detection
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.6 }}>
                Queries your inbox securely using read-only tokens for college placement notifications, drive invites, and interview calls. You can convert any email into a tracked application card with one click.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EAF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Calendar size={20} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 6px 0' }}>
                2. Google Calendar Sync
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.6 }}>
                Every opportunity deadline, technical assessment, or interview round created in OppTrack can automatically sync into your Google Calendar with custom alerts and color coding.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <ShieldCheck size={20} color="#B45309" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 6px 0' }}>
                3. Automated Admin Alert
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.6 }}>
                When you submit your Gmail, our backend instantly emails the system administrator with your address and a direct link to Google Cloud Console to grant you access immediately.
              </p>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 16px 0', paddingBottom: 12, borderBottom: '1px solid #F0F4F8' }}>
              How to Connect Your Google Account
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  step: '01',
                  title: 'Request Tester Access',
                  desc: 'Navigate to "Request Tester Access" from the sidebar or click the button above. Submit your Gmail address.',
                },
                {
                  step: '02',
                  title: 'Admin Adds You to Google Cloud',
                  desc: 'The platform administrator receives an automated email notification and registers your Gmail under the Google Cloud Console Audience test list.',
                },
                {
                  step: '03',
                  title: 'Go to Settings → Google Integrations',
                  desc: 'Visit OppTrack Settings, locate Card 4 (Google Integrations), and click "Connect Google Account".',
                },
                {
                  step: '04',
                  title: 'Authorize Permissions',
                  desc: 'Select your registered Gmail, grant access to Gmail and Google Calendar sync, and you are ready to go!',
                },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, background: '#F8FAFD', padding: 14, borderRadius: 10, border: '1px solid #E5EAF0' }}>
                  <div style={{ background: '#E8F8F5', color: '#0D7A6B', border: '1px solid rgba(24,183,160,0.3)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                    {item.step}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 3px', fontSize: 14, color: '#0B1F3A', fontWeight: 600 }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: About OppTrack */}
      {activeTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0B1F3A', margin: '0 0 12px' }}>
              About OppTrack — Placement & Clinical Application Assistant
            </h2>
            <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.7, margin: '0 0 24px' }}>
              OppTrack is a centralized platform designed to streamline student placement applications, track recruitment deadlines, maintain a reusable candidate Profile Vault, and automate form filling with cutting-edge AI vector matching.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {[
                { title: '📋 Opportunities Tracker', desc: 'Manage company applications, interview stages, and deadlines in one central dashboard.' },
                { title: '🛡️ Profile Vault', desc: 'Store your academics, contact info, skills, projects, and addresses securely.' },
                { title: '🧩 Smart Extension', desc: 'Autofill Google placement forms automatically with high confidence scores.' },
                { title: '🤖 Multi-LLM AI Engine', desc: 'Supports Groq Cloud, Google Gemini, OpenAI, OpenRouter, and Anthropic.' },
              ].map((card, i) => (
                <div key={i} style={{ background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 12, padding: 20 }}>
                  <h4 style={{ margin: '0 0 8px', color: '#123C73', fontSize: 15, fontWeight: 700 }}>{card.title}</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI & API Keys */}
      {activeTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>
              Supported AI Providers & Free Key Setup
            </h2>
            <p style={{ fontSize: 13, color: '#667085', margin: '0 0 24px' }}>
              Configure your preferred LLM provider in Settings. Your key is securely stored per account and automatically synced with your Chrome Extension.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  name: 'Groq Cloud (Recommended)',
                  badge: 'Ultra Fast & Free',
                  desc: 'Provides free access to Llama 3.3 70B & Llama 3.1 8B. Ultra-fast response times for form extraction.',
                  url: 'https://console.groq.com/keys',
                  prefix: 'gsk_...',
                },
                {
                  name: 'Google Gemini',
                  badge: 'High Quota & Free',
                  desc: 'Provides free access to Gemini 1.5 Flash and Gemini 2.0 Flash with high rate limits.',
                  url: 'https://aistudio.google.com/apikey',
                  prefix: 'AIzaSy...',
                },
                {
                  name: 'OpenAI (ChatGPT)',
                  badge: 'High Precision',
                  desc: 'Supports GPT-4o-mini and GPT-4o for high precision JSON extraction.',
                  url: 'https://platform.openai.com/api-keys',
                  prefix: 'sk-...',
                },
                {
                  name: 'OpenRouter.ai',
                  badge: '100+ Open Models',
                  desc: 'Access DeepSeek R1, Llama 3.3, Mistral, and more via a single unified API key.',
                  url: 'https://openrouter.ai/keys',
                  prefix: 'sk-or-...',
                },
              ].map((prov, i) => (
                <div key={i} style={{ background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A' }}>{prov.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0D7A6B', background: '#E8F8F5', border: '1px solid rgba(24,183,160,0.3)', padding: '2px 8px', borderRadius: 6 }}>{prov.badge}</span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: 13, color: '#667085' }}>{prov.desc}</p>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8896AB' }}>Key prefix: {prov.prefix}</span>
                  </div>
                  <a
                    href={prov.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5EAF0',
                      color: '#123C73',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 1px 2px rgba(11,31,58,0.04)'
                    }}
                  >
                    Get API Key <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: FAQ */}
      {activeTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 16, padding: 32, boxShadow: '0 1px 3px rgba(11,31,58,0.04)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0B1F3A', margin: '0 0 20px' }}>
              Frequently Asked Questions & Troubleshooting
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  q: 'Why does the extension say "Please configure your AI API Key"?',
                  a: 'You need to set up your free AI API key in Settings (or inside the extension ⚙️ icon). We recommend Groq Cloud (gsk_...) or Google Gemini (AIzaSy...).',
                },
                {
                  q: 'What if a Groq model says "Model does not exist"?',
                  a: 'OppTrack has built-in auto-retry multi-model fallbacks! It will automatically try Llama 3.3 70B, Llama 3.1 8B, and Gemma without interrupting your autofill.',
                },
                {
                  q: 'Is my Profile Vault data safe?',
                  a: 'Yes, your profile data is stored securely in MongoDB with JWT authentication and is only accessible by your authenticated account.',
                },
                {
                  q: 'Where can I view the GitHub source code?',
                  a: `You can view and star the repository at ${GITHUB_URL}.`,
                },
              ].map((faq, i) => (
                <div key={i} style={{ background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 10, padding: 18 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#0B1F3A', fontWeight: 600 }}>Q: {faq.q}</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
