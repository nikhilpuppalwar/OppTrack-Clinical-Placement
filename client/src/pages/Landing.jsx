import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import {
  ArrowRight, CheckCircle2, Calendar, Mail, Sparkles, Shield,
  Puzzle, Zap, ExternalLink, ChevronRight, Check, Eye, Lock,
  GraduationCap, Clock, Award
} from 'lucide-react';

const EXTENSION_DOWNLOAD_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip';
const GITHUB_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('autofill');

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', color: '#172033', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Sticky Top Navigation ──────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #E5EAF0',
          padding: '14px 24px'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo & Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={logoImg} alt="OppTrack Logo" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }} />
            <div>
              <span style={{ fontSize: 19, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em' }}>OppTrack</span>
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: '#E8F8F5', color: '#087F71', padding: '2px 6px', borderRadius: 4 }}>
                SaaS
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'none', gap: 28, alignItems: 'center' }} className="desktop-nav">
            <a href="#features" style={{ fontSize: 13.5, fontWeight: 600, color: '#667085', textDecoration: 'none' }}>Features</a>
            <a href="#demo" style={{ fontSize: 13.5, fontWeight: 600, color: '#667085', textDecoration: 'none' }}>Product Demo</a>
            <a href="#how-it-works" style={{ fontSize: 13.5, fontWeight: 600, color: '#667085', textDecoration: 'none' }}>How It Works</a>
            <a href="#extension" style={{ fontSize: 13.5, fontWeight: 600, color: '#667085', textDecoration: 'none' }}>Extension</a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <button
                onClick={() => navigate('/')}
                style={{
                  background: '#0B1F3A',
                  color: '#FFFFFF',
                  padding: '8px 18px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                Go to Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: '#0B1F3A',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #E5EAF0',
                    background: '#FFFFFF'
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    background: '#0B1F3A',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '8px 18px',
                    borderRadius: 6,
                    boxShadow: '0 2px 6px rgba(11, 31, 58, 0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 60px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        {/* Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: '#E8F8F5',
          border: '1px solid rgba(24, 183, 160, 0.3)',
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: 12,
          fontWeight: 700,
          color: '#087F71',
          marginBottom: 24
        }}>
          <Sparkles size={13} color="#18B7A0" />
          <span>Next-Gen Placement OS for Engineering Students</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800,
          color: '#0B1F3A',
          letterSpacing: '-0.03em',
          lineHeight: 1.12,
          maxWidth: 880,
          margin: '0 auto 20px'
        }}>
          Track Today. <br />
          <span style={{ color: '#18B7A0' }}>Place Tomorrow.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: '#667085',
          maxWidth: 680,
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          Automate campus placements from start to finish. Auto-extract job notices from college emails, sync deadlines to Google Calendar, and autofill lengthy company application forms with AI in seconds.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
          <Link
            to="/register"
            style={{
              background: '#0B1F3A',
              color: '#FFFFFF',
              padding: '13px 28px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(11, 31, 58, 0.18)'
            }}
          >
            Start Tracking Free <ArrowRight size={16} />
          </Link>

          <a
            href={EXTENSION_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#18B7A0',
              color: '#FFFFFF',
              padding: '13px 24px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(24, 183, 160, 0.25)'
            }}
          >
            <Puzzle size={16} /> Get Chrome Extension
          </a>
        </div>

        {/* Trust Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, flexWrap: 'wrap', color: '#667085', fontSize: 12.5, fontWeight: 500 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#16A34A" /> Official Google OAuth 2.0
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#16A34A" /> AES-256-GCM Token Encryption
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#16A34A" /> Zero Password Storage
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="#16A34A" /> Tailored for PCCOE & B.Tech Drives
          </span>
        </div>
      </section>

      {/* ── Interactive Demo Showcase ──────────────────────────────── */}
      <section id="demo" style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 20px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderRadius: 16,
            boxShadow: '0 16px 40px rgba(11, 31, 58, 0.08)',
            overflow: 'hidden'
          }}
        >
          {/* Mockup Window Header */}
          <div style={{ background: '#0B1F3A', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #142E54' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace' }}>
                opptrack.app / live-suite
              </span>
            </div>

            {/* Switcher Tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'autofill', label: '✦ AI Autofill' },
                { id: 'gmail', label: '✉️ Gmail Auto-Fetch' },
                { id: 'calendar', label: '📅 Calendar Sync' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? '#18B7A0' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Screen Preview */}
          <div style={{ padding: '32px 28px', background: '#F8FAFD' }}>
            {activeTab === 'autofill' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F8F5', color: '#087F71', padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                    <Sparkles size={13} color="#18B7A0" /> Live AI Form Detection
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0B1F3A', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                    18 Fields Detected. 94% Confidence.
                  </h3>
                  <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                    Applying on Google Forms, Superset, Taleo, or Workday? The OppTrack Chrome Extension extracts all questions, retrieves your academic scores and projects from your encrypted vault, and autofills every field in 1 click.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Full Name & Contact', conf: '100%', status: 'high' },
                      { label: 'B.Tech CGPA (8.72) & Engineering College', conf: '98%', status: 'high' },
                      { label: 'GitHub & Portfolio URL', conf: '95%', status: 'high' },
                      { label: 'Key Technical Skills & Projects', conf: '88%', status: 'med' },
                    ].map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5EAF0' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#172033' }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: row.status === 'high' ? '#16A34A' : '#F59E0B', fontFamily: 'monospace' }}>
                          ✓ {row.conf} Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Extension Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 22, boxShadow: '0 8px 24px rgba(11,31,58,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5EAF0', paddingBottom: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={logoImg} alt="OppTrack" style={{ width: 24, height: 24 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A' }}>OppTrack Autofill</span>
                    </div>
                    <span style={{ background: '#EAF8EF', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                      Ready
                    </span>
                  </div>

                  <div style={{ background: '#F8FAFD', borderRadius: 8, padding: 14, marginBottom: 16, border: '1px solid #E5EAF0' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#667085', textTransform: 'uppercase', marginBottom: 4 }}>
                      Form Detected
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A' }}>
                      Google Form — Campus Recruitment Drive 2026
                    </div>
                    <div style={{ fontSize: 12, color: '#667085', marginTop: 4 }}>
                      18 questions mapped to your Profile Vault
                    </div>
                  </div>

                  <button
                    style={{
                      width: '100%',
                      background: '#18B7A0',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '11px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px rgba(24, 183, 160, 0.3)'
                    }}
                  >
                    <Sparkles size={15} /> Autofill 18 Fields Now
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'gmail' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F8F5', color: '#087F71', padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                    <Mail size={13} color="#18B7A0" /> Zero Scraping • Official Gmail API
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0B1F3A', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                    TPO Emails Parsed into Opportunities.
                  </h3>
                  <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Connect college TPO senders (like <code>srawandale@gmail.com</code>). OppTrack continuously queries for new recruitment drives, extracts company name, stipend, CTC, eligibility criteria, and deadlines into a Pending Review queue.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#172033' }}>
                      <Check size={16} color="#18B7A0" /> Strict sender whitelist: only reads placement emails
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#172033' }}>
                      <Check size={16} color="#18B7A0" /> Smart duplicate checking & eligibility verification
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#18B7A0' }}>
                      <Check size={16} color="#18B7A0" /> Human-in-the-loop review before adding to your pipeline
                    </li>
                  </ul>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 18, boxShadow: '0 8px 24px rgba(11,31,58,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#087F71', textTransform: 'uppercase', marginBottom: 8 }}>
                    Pending Review Queue
                  </div>
                  <div style={{ border: '1px solid #E5EAF0', borderRadius: 8, padding: 14, background: '#F8FAFD' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A' }}>Accenture India</span>
                      <span style={{ background: '#EAF8EF', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>Eligible (8.72 CGPA)</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#667085', marginBottom: 10 }}>
                      Role: Associate Software Engineer • Package: 4.5 – 6.5 LPA
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ flex: 1, background: '#0B1F3A', color: '#fff', border: 'none', padding: '6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Confirm & Track</button>
                      <button style={{ background: '#FEF0F0', color: '#DC3545', border: '1px solid #FCA5A5', padding: '6px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Ignore</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F8F5', color: '#087F71', padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                    <Calendar size={13} color="#18B7A0" /> Real-time Google Calendar Integration
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0B1F3A', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                    Never Miss an OA or Interview.
                  </h3>
                  <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    Every confirmed opportunity deadline syncs directly to your primary Google Calendar. Automated notification popups trigger 24 hours and 1 hour prior, keeping you prepared on mobile and desktop.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#172033' }}>
                      <Check size={16} color="#18B7A0" /> Dual-view: OppTrack internal view or Embedded Google Calendar
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#18B7A0' }}>
                      <Check size={16} color="#18B7A0" /> Automatic event updates when interview rounds reschedule
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#18B7A0' }}>
                      <Check size={16} color="#18B7A0" /> One-click batch sync for your entire opportunity history
                    </li>
                  </ul>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 18, boxShadow: '0 8px 24px rgba(11,31,58,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3A' }}>Upcoming Calendar Events</span>
                    <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700 }}>● Live Synced</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { title: 'TCS Digital OA Assessment', time: 'Tomorrow, 10:00 AM', tag: 'OA' },
                      { title: 'Microsoft SDE Interview Round 1', time: 'Friday, 2:30 PM', tag: 'Interview' },
                      { title: 'Barclays Registration Deadline', time: 'Sunday, 11:59 PM', tag: 'Deadline' },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#F8FAFD', borderRadius: 6, borderLeft: '3px solid #18B7A0', border: '1px solid #E5EAF0' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1F3A' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>{item.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Feature Pillars Grid ───────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
            Built Specifically for Campus Recruitment
          </h2>
          <p style={{ fontSize: 15, color: '#667085', maxWidth: 600, margin: '0 auto' }}>
            Everything you need to eliminate repetitive form filling, track ongoing drives, and stay ahead of deadlines.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {/* Feature 1 */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 26, boxShadow: '0 2px 8px rgba(11,31,58,0.03)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E8F8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Puzzle size={22} color="#18B7A0" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px 0' }}>
              AI Form Autofill Extension
            </h3>
            <p style={{ fontSize: 13.5, color: '#667085', lineHeight: 1.55, margin: 0 }}>
              Seamlessly fills job portals, Google Forms, and career pages with precision match scoring and human confirmation.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 26, boxShadow: '0 2px 8px rgba(11,31,58,0.03)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EAF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Mail size={22} color="#2563EB" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px 0' }}>
              Gmail Auto-Fetch Pipeline
            </h3>
            <p style={{ fontSize: 13.5, color: '#667085', lineHeight: 1.55, margin: 0 }}>
              Only inspects trusted college TPO senders. Automatically extracts criteria, packages, and application links with AI.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 26, boxShadow: '0 2px 8px rgba(11,31,58,0.03)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFF7E6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Calendar size={22} color="#F59E0B" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px 0' }}>
              Google Calendar Deadlines
            </h3>
            <p style={{ fontSize: 13.5, color: '#667085', lineHeight: 1.55, margin: 0 }}>
              Synchronizes assessment dates and interview slots to your phone with automated 24h & 1h notification popups.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12, padding: 26, boxShadow: '0 2px 8px rgba(11,31,58,0.03)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EAF8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Shield size={22} color="#16A34A" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px 0' }}>
              Encrypted Profile Vault
            </h3>
            <p style={{ fontSize: 13.5, color: '#667085', lineHeight: 1.55, margin: 0 }}>
              One single place for SGPA, CGPA, semester breakdowns, live portfolio URLs, projects, and certifications.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: '#FFFFFF', borderTop: '1px solid #E5EAF0', borderBottom: '1px solid #E5EAF0', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              How OppTrack Accelerates Your Placement
            </h2>
            <p style={{ fontSize: 15, color: '#667085', maxWidth: 600, margin: '0 auto' }}>
              From receiving the college announcement to getting hired in 3 easy steps.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#E8F8F5', lineHeight: 1, marginBottom: 12 }}>
                01
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', marginBottom: 8 }}>
                Build Your Profile Vault
              </h3>
              <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.6 }}>
                Add your degree details, marks across all semesters, technical stack, resume links, and achievements once.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#E8F8F5', lineHeight: 1, marginBottom: 12 }}>
                02
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', marginBottom: 8 }}>
                Connect Gmail & Calendar
              </h3>
              <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.6 }}>
                Link your Google account in Settings. OppTrack monitors your placement cell announcements and schedules alerts.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#E8F8F5', lineHeight: 1, marginBottom: 12 }}>
                03
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', marginBottom: 8 }}>
                Autofill Forms in 1 Click
              </h3>
              <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.6 }}>
                Open any company application form, click the OppTrack Chrome Extension, and let AI fill all 20+ fields error-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ──────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '80px auto', padding: '0 24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0B1F3A 0%, #123C73 100%)',
            borderRadius: 20,
            padding: '56px 40px',
            textAlign: 'center',
            color: '#FFFFFF',
            boxShadow: '0 20px 48px rgba(11, 31, 58, 0.2)'
          }}
        >
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 14px 0' }}>
            Ready to Take Control of Your Placements?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Join ambitious engineering students who spend less time filling forms and more time preparing for technical interviews.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{
                background: '#18B7A0',
                color: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(24, 183, 160, 0.4)'
              }}
            >
              Create Free Account →
            </Link>
            <a
              href={EXTENSION_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                padding: '12px 22px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              Download Extension .zip
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #E5EAF0', padding: '36px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoImg} alt="OppTrack Logo" style={{ width: 28, height: 28, borderRadius: 6 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0B1F3A' }}>OppTrack</span>
            <span style={{ fontSize: 12, color: '#667085' }}>— Track Today. Place Tomorrow.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: '#667085' }}>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              GitHub Repository
            </a>
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
