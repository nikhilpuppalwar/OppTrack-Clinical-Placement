import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import {
  ArrowRight, ArrowDown, CheckCircle2, Calendar, Mail, Shield,
  Puzzle, ExternalLink, Check, Lock,
  Folder, Kanban, Bell, FileText, FileUp, Sparkles,
  AlertTriangle, Download, User
} from 'lucide-react';

const EXTENSION_DOWNLOAD_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip';
const GITHUB_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── TOP NAVIGATION ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src={logoImg} alt="OppTrack Logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
              <span style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>OppTrack</span>
            </Link>
            <span style={{ color: '#CBD5E1', fontSize: 13, userSelect: 'none' }}>|</span>
            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>
              Placement &amp; Profile Tracker
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }} className="desktop-nav">
            <a href="#features" style={{ fontSize: 13, fontWeight: 500, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: 13, fontWeight: 500, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>How it Works</a>
            <a href="#extension" style={{ fontSize: 13, fontWeight: 500, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>Chrome Extension</a>
            <Link to="/help" style={{ fontSize: 13, fontWeight: 500, color: '#475569', textDecoration: 'none' }}>Help Guide</Link>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s ease'
                }}
              >
                Go to Workspace <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: '#0F172A',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: 6,
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'background 0.15s ease'
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTAINER ── */}
      <main style={{ paddingTop: 64 }}>
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── HERO SECTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: '#FFFFFF',
            padding: '64px 24px 80px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
              
              {/* Hero Content (Left) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                
                {/* Product Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1D4ED8',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Folder size={13} color="#2563EB" />
                  PCCOE Student Placement Portal • By Nikhil Puppalwar
                </div>

                {/* Hero Title */}
                <h1
                  style={{
                    fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
                    fontWeight: 800,
                    color: '#0F172A',
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    margin: 0,
                  }}
                >
                  Keep every placement application organized.
                </h1>

                {/* Hero Supporting Text */}
                <p style={{ fontSize: '1.05rem', color: '#475569', margin: 0, lineHeight: 1.6, maxWidth: 540 }}>
                  Empowering Pimpri Chinchwad College of Engineering (PCCOE) students with placement help, opportunity tracking, Profile Vault management, and 1-click Google Forms autofill across campus recruitment drives.
                </p>

                {/* Hero Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 6 }}>
                  <Link
                    to="/register"
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 600,
                      padding: '11px 22px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>Create Profile</span>
                    <ArrowRight size={15} />
                  </Link>

                  <a
                    href="#how-it-works"
                    style={{
                      color: '#0F172A',
                      fontSize: 13.5,
                      fontWeight: 600,
                      padding: '10px 16px',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>See How It Works</span>
                    <ArrowDown size={14} />
                  </a>
                </div>

                {/* Trust Points */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, paddingTop: 12, fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={15} color="#16A34A" />
                    <span>Free for students</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={15} color="#2563EB" />
                    <span>User-approved updates</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Puzzle size={15} color="#0D9488" />
                    <span>Chrome Extension</span>
                  </div>
                </div>

              </div>

              {/* Hero Realistic UI Preview (Right Column) */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 12,
                    padding: 24,
                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08), 0 0 0 1px #E2E8F0',
                    position: 'relative',
                  }}
                >
                  {/* Card App Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                        OP
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Student Workspace</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Placement Pipeline Overview</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                      Active Season
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>12</div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Applied</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#2563EB', marginTop: 2 }}>24</div>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>Deadlines</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#DC2626', marginTop: 2 }}>3 Due</div>
                    </div>
                  </div>

                  {/* Opportunities List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Tracked Opportunities
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Google India</div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>Software Engineer • CTC 32 LPA</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#FEF3C7', color: '#92400E' }}>
                        OA Assessment
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Microsoft</div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>SDE Intern • Engineering</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>
                        Interview Scheduled
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Barclays</div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>Technology Analyst • Campus Drive</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#F0FDF4', color: '#15803D' }}>
                        Applied
                      </span>
                    </div>
                  </div>

                  {/* Profile Vault Indicator */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={13} color="#16A34A" /> Profile Vault Synced
                    </span>
                    <span style={{ fontWeight: 600, color: '#2563EB' }}>18 Verified Fields</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── CORE PRODUCT FEATURES ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#F8FAFC', padding: '72px 24px', borderBottom: '1px solid #E2E8F0' }} id="features">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ maxWidth: 640, margin: '0 auto 48px', textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2563EB' }}>
                Core Capabilities
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '8px 0 10px' }}>
                Tools designed for placement season.
              </h2>
              <p style={{ fontSize: 14.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Every feature focuses on eliminating duplicate data entry and tracking deadlines reliably.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              
              {/* Feature 1: Profile Vault */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Folder size={18} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                    Profile Vault
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    Keep your reusable academic records, CGPA, backlogs, coding platform URLs, and address details in one verified repository.
                  </p>
                </div>
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Custom Fields &amp; Portfolios</span>
                  <span style={{ fontWeight: 600, color: '#2563EB' }}>Full User Control</span>
                </div>
              </div>

              {/* Feature 2: Opportunity Tracking */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Kanban size={18} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                    Opportunity Tracking
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    Track company drives, roles, CTC packages, criteria eligibility, and stage transitions from Applied to OA, Interview, and Offer.
                  </p>
                </div>
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pipeline &amp; Status Logs</span>
                  <span style={{ fontWeight: 600, color: '#16A34A' }}>Audit Trail</span>
                </div>
              </div>

              {/* Feature 3: Resume Import */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <FileUp size={18} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                    AI Resume Import
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    Upload your PDF or DOCX resume. OppTrack analyzes credentials, compares against your vault, and stages updates for your explicit approval.
                  </p>
                </div>
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>PDF &amp; DOCX Support</span>
                  <span style={{ fontWeight: 600, color: '#2563EB' }}>Selective Save</span>
                </div>
              </div>

              {/* Feature 4: Form Question Import */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <FileText size={18} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                    AI Form Import
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    Paste application questions or college circular text. OppTrack maps relevant fields to your Profile Vault without overwriting existing data.
                  </p>
                </div>
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Semantic Matching</span>
                  <span style={{ fontWeight: 600, color: '#0D9488' }}>Diff Review</span>
                </div>
              </div>

              {/* Feature 5: Calendar & Deadlines */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Calendar size={18} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                    Calendar &amp; Deadline Alerts
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    Keep drive schedules and assessment dates visible. Sync events directly to Google Calendar and receive reminders before deadlines expire.
                  </p>
                </div>
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Google Calendar Sync</span>
                  <span style={{ fontWeight: 600, color: '#D97706' }}>Custom Reminders</span>
                </div>
              </div>

              {/* Feature 6: Chrome Extension */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Puzzle size={18} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                    Chrome Extension Autofill
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    Autofills repetitive Google Forms and company registration links directly from your saved Profile Vault with a single click.
                  </p>
                </div>
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Google Forms &amp; Portals</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>1-Click Autofill</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── HOW IT WORKS (5 CLEAR STEPS) ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#FFFFFF', padding: '72px 24px', borderBottom: '1px solid #E2E8F0' }} id="how-it-works">
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ maxWidth: 640, margin: '0 auto 48px', textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2563EB' }}>
                Workflow
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '8px 0 10px' }}>
                How OppTrack works.
              </h2>
              <p style={{ fontSize: 14.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                A structured process that keeps you in complete control of your data.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 8, fontFamily: 'monospace' }}>
                  STEP 01
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Create your profile</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                  Enter your core academic records, marks, and portfolio handles once in the Profile Vault.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 8, fontFamily: 'monospace' }}>
                  STEP 02
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Track opportunities</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                  Add placement drives, track interview rounds, and set assessment deadlines on your board.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 8, fontFamily: 'monospace' }}>
                  STEP 03
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Import information</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                  Upload a resume or paste circular text. AI parses incoming details in memory.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 8, fontFamily: 'monospace' }}>
                  STEP 04
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Review suggestions</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                  Compare extracted fields with your current vault. Choose what to accept, edit, or reject.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 8, fontFamily: 'monospace' }}>
                  STEP 05
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Apply faster</h4>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                  Use the Chrome extension to autofill forms with approved data and submit before deadlines.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── TRUST & DATA CONTROL SECTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#F8FAFC', padding: '64px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield size={22} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
              Your profile data stays under your control.
            </h2>
            <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.65, margin: '0 0 20px', maxWidth: 660, marginLeft: 'auto', marginRight: 'auto' }}>
              AI suggestions are always staged for your review before information is added to your Profile Vault. No silent overwrites, no public sharing, and no hidden advertising trackers.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13, color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="#16A34A" /> Staging review before saving
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="#16A34A" /> One-click rollback support
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="#16A34A" /> Zero data monetization
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── CHROME EXTENSION SECTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#FFFFFF', padding: '72px 24px', borderBottom: '1px solid #E2E8F0' }} id="extension">
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div
              style={{
                background: '#0F172A',
                borderRadius: 12,
                padding: '40px 36px',
                color: '#FFFFFF',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 36,
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.12)', color: '#93C5FD', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                  <Puzzle size={13} /> OppTrack Chrome Extension
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                  Autofill company forms in seconds.
                </h3>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Install the OppTrack browser extension to eliminate manual copy-pasting across Google Forms and campus registration portals.
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <a
                    href={EXTENSION_DOWNLOAD_URL}
                    download
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '10px 18px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <Download size={15} /> Download Extension (.zip)
                  </a>

                  <Link
                    to="/help"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 500,
                      padding: '10px 16px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>Installation Guide</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Steps Card */}
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, padding: 20, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#93C5FD', marginBottom: 12 }}>
                  Quick Installation (Under 1 Minute):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, color: '#CBD5E1' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>1.</span>
                    <span>Download and unzip <code>OppTrack.AutoFill.Extension.zip</code></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>2.</span>
                    <span>Navigate to <code>chrome://extensions</code> in your browser and enable <strong>Developer mode</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#60A5FA' }}>3.</span>
                    <span>Click <strong>Load unpacked</strong> and select the unzipped extension directory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── FINAL CALL TO ACTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#F8FAFC', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
              Ready to organize your placement season?
            </h2>
            <p style={{ fontSize: 14.5, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
              Create your free Profile Vault and start tracking opportunities with zero missed deadlines.
            </p>
            <Link
              to="/register"
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 26px',
                borderRadius: 6,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
            >
              <span>Create Account Free</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* ── CAMPUS PLACEMENT TOPICS & KEYWORDS ── */}
        <section style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '36px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: 12 }}>
              Campus Placements &amp; PCCOE Student Resources
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                'PCCOE Placements',
                'Pimpri Chinchwad College of Engineering',
                'Nikhil Puppalwar',
                'PCCOE Placement Help',
                'PCCOE T&P Cell',
                'PCCOE Pune Campus Drives',
                'PCCOE Nigdi & Akurdi',
                'Engineering Placement Tracker',
                'Google Forms Placement Autofill',
                'Profile Vault for Students',
                'B.Tech Pune Placements',
                'SPPU Engineering Campus Drives',
                'Automated Resume Import',
                'Online Assessment Deadline Sync',
                'Campus Recruitment Automation',
                'PCCOE Training & Placement Portal'
              ].map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#334155',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36, paddingBottom: 36, borderBottom: '1px solid #E2E8F0' }}>
            
            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <img src={logoImg} alt="OppTrack Logo" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4 }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>OppTrack</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 12px' }}>
                Opportunity and application tracking platform designed for B.Tech &amp; engineering placement candidates.
              </p>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                100% Free for students
              </div>
            </div>

            {/* Product Links */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', marginBottom: 12 }}>
                Product
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <a href="#features" style={{ color: '#64748B', textDecoration: 'none' }}>Features</a>
                <a href="#how-it-works" style={{ color: '#64748B', textDecoration: 'none' }}>How it Works</a>
                <a href="#extension" style={{ color: '#64748B', textDecoration: 'none' }}>Chrome Extension</a>
                <Link to="/profile" style={{ color: '#64748B', textDecoration: 'none' }}>Profile Vault</Link>
              </div>
            </div>

            {/* Company / Information */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', marginBottom: 12 }}>
                Company &amp; Resources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <Link to="/help" style={{ color: '#64748B', textDecoration: 'none' }}>Help Guide</Link>
                <a href="/about.html" style={{ color: '#64748B', textDecoration: 'none' }}>About OppTrack</a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ color: '#64748B', textDecoration: 'none' }}>GitHub Repository</a>
                <a href="mailto:support@opptrack.io" style={{ color: '#64748B', textDecoration: 'none' }}>Contact Support</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', marginBottom: 12 }}>
                Legal
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <Link to="/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: '#64748B', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
                <Link to="/cookies" style={{ color: '#64748B', textDecoration: 'none' }}>Cookie Policy</Link>
              </div>
            </div>

          </div>

          <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#94A3B8' }}>
            <div>
              © {new Date().getFullYear()} OppTrack. All rights reserved.
            </div>
            <div>
              Created by Nikhil Puppalwar • Built for Pimpri Chinchwad College of Engineering (PCCOE) students &amp; campus placement help.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
