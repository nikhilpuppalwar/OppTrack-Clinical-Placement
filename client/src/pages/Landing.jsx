import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import {
  ArrowRight, ArrowDown, CheckCircle2, Calendar, Mail, Sparkles, Shield,
  Puzzle, Zap, ExternalLink, ChevronRight, Check, Eye, Lock,
  GraduationCap, Clock, Award, Folder, Kanban, Bell, FileText,
  AlertTriangle, CheckCircle, Download, Laptop, Building2, User
} from 'lucide-react';

const EXTENSION_DOWNLOAD_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip';
const GITHUB_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', color: '#172033', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── STICKY TOP NAVIGATION ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E5EAF0',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src={logoImg} alt="OppTrack Logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em' }}>OppTrack</span>
            </Link>
            <span style={{ color: '#C4C6CE', fontSize: 13, userSelect: 'none' }}>|</span>
            <span style={{ fontSize: 13, color: '#64748B', display: 'none', fontWeight: 500 }} className="brand-subtitle">
              Your placement journey, organized.
            </span>
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'none', gap: 28, alignItems: 'center' }} className="desktop-nav">
            <a href="#features" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>How it Works</a>
            <a href="#extension" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>Chrome Extension</a>
            <a href="#workspace" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>Workspace Demo</a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: '#0B1F3A',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(11, 31, 58, 0.15)'
                }}
              >
                Go to Workspace <ArrowRight size={14} />
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
                    borderRadius: 8,
                    transition: 'all 0.15s'
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  style={{
                    background: '#0B1F3A',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '9px 18px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(11, 31, 58, 0.15)',
                    transition: 'all 0.15s'
                  }}
                >
                  Get Started Free
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
            background: 'linear-gradient(180deg, #F7F9FC 0%, #EDF2F7 50%, #F7F9FC 100%)',
            padding: '70px 24px 90px',
            borderBottom: '1px solid #E5EAF0',
          }}
        >
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
              
              {/* Hero Content (Left) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
                
                {/* Status Pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 14px',
                    borderRadius: 20,
                    background: '#E8F8F5',
                    border: '1px solid rgba(24, 183, 160, 0.3)',
                    color: '#087F71',
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#18B7A0', animation: 'pulse 1.5s infinite' }} />
                  Placement Season, Simplified
                </div>

                {/* Hero Title */}
                <h1
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 3.6rem)',
                    fontWeight: 800,
                    color: '#0B1F3A',
                    lineHeight: 1.12,
                    letterSpacing: '-0.03em',
                    margin: 0,
                  }}
                >
                  Stop retyping the <span style={{ color: '#18B7A0', position: 'relative' }}>same form.</span>
                </h1>

                {/* Hero Subhead */}
                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3B5E97', margin: 0, lineHeight: 1.4 }}>
                  Track every opportunity, deadline, and application in one intelligent workspace.
                </p>

                <p style={{ fontSize: '1rem', color: '#475569', margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
                  Built for engineering and B.Tech students juggling circular emails, repetitive Google Forms, company career portals, and last-minute online assessments.
                </p>

                {/* Hero Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, paddingTop: 8 }}>
                  <Link
                    to="/register"
                    style={{
                      background: '#18B7A0',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      padding: '13px 26px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(24, 183, 160, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Get Started Free</span>
                    <ArrowRight size={16} />
                  </Link>

                  <a
                    href="#how-it-works"
                    style={{
                      color: '#3B5E97',
                      fontSize: 14,
                      fontWeight: 600,
                      padding: '12px 18px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>See how it works</span>
                    <ArrowDown size={15} />
                  </a>
                </div>

                {/* Trust Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, paddingTop: 10, fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={16} color="#18B7A0" />
                    <span>100% Student Free</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={16} color="#18B7A0" />
                    <span>Chrome Extension</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Shield size={16} color="#18B7A0" />
                    <span>Encrypted Profile Vault</span>
                  </div>
                </div>

              </div>

              {/* Hero Mockup (Right Column) */}
              <div style={{ position: 'relative' }}>
                
                {/* Main Product Workspace Card */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    padding: 24,
                    boxShadow: '0 16px 40px -8px rgba(11, 31, 58, 0.12), 0 0 0 1px #E5EAF0',
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  {/* Card App Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #E5EAF0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0B1F3A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                        OP
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1F3A' }}>OppTrack Workspace</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>PCCOE, Pune • Batch 2026 • CSE</div>
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 14, background: '#F1F5F9', fontSize: 11.5, color: '#334155', fontWeight: 600 }}>
                      <span>Rahul Sharma 👋</span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFD', border: '1px solid #E5EAF0' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1F3A' }}>12</span>
                        <span style={{ fontSize: 10.5, color: '#087F71', fontWeight: 700 }}>In pipeline</span>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFD', border: '1px solid #E5EAF0' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Applied</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1F3A' }}>24</span>
                        <span style={{ fontSize: 10.5, color: '#3B5E97', fontWeight: 700 }}>Season total</span>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: 10, background: '#FFF4F2', border: '1px solid #FECACA' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>Deadlines</span>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', animation: 'ping 1.5s infinite' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>5</span>
                        <span style={{ fontSize: 10.5, color: '#DC2626', fontWeight: 700 }}>&lt; 72 hrs</span>
                      </div>
                    </div>
                  </div>

                  {/* Opportunities in Motion List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 4px' }}>
                      <span>OPPORTUNITIES IN MOTION</span>
                      <span style={{ color: '#2563EB', cursor: 'pointer' }}>View pipeline →</span>
                    </div>

                    {/* Opportunity Item 1 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #E5EAF0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          G
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3A' }}>Google India</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>Software Engineer • CTC 32 LPA</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#E8F8F5', color: '#087F71' }}>
                        OA on Sep 28
                      </span>
                    </div>

                    {/* Opportunity Item 2 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #E5EAF0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          MS
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3A' }}>Microsoft</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>SDE Intern • Final Shortlist</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#DBEAFE', color: '#1E40AF' }}>
                        Interview Sep 26
                      </span>
                    </div>

                    {/* Urgent Alert Callout */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#FFF8E6', border: '1px solid #FCD34D', marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={15} color="#D97706" />
                        <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                          Barclays Campus Form closes in <strong>18 hours</strong>
                        </span>
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#D97706', cursor: 'pointer' }}>Submit Links →</span>
                    </div>
                  </div>
                </div>

                {/* Floating AI Smart Paste Card */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -24,
                    right: -14,
                    width: 300,
                    background: '#FFFFFF',
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: '0 20px 40px rgba(11, 31, 58, 0.16), 0 0 0 1px #E5EAF0',
                    zIndex: 20
                  }}
                  className="floating-ai-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #F0F4F8' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#E8F8F5', color: '#087F71' }}>
                      ✦ AI Email Sync
                    </span>
                    <span style={{ fontSize: 10.5, color: '#64748B' }}>Gmail Ingestion</span>
                  </div>

                  <p style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 700, color: '#0B1F3A' }}>
                    Placement email detected
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Company</span>
                      <span style={{ fontWeight: 600, color: '#0B1F3A' }}>Google India</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Deadline</span>
                      <span style={{ fontWeight: 700, color: '#DC2626' }}>Sep 25 • 23:59</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Eligibility</span>
                      <span style={{ fontWeight: 700, color: '#087F71' }}>CGPA 7.5+ (Eligible)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid #F0F4F8', fontSize: 10.5 }}>
                    <span style={{ color: '#087F71', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> Extracted & synced
                    </span>
                    <span style={{ color: '#64748B', fontFamily: 'monospace' }}>0.42s</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── THE PROBLEM SECTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px', borderBottom: '1px solid #E5EAF0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#64748B' }}>
                THE REALITY OF CAMPUS RECRUITMENT
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '8px 0 12px' }}>
                Placement season shouldn't feel this messy.
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Too many Google Forms, college circulars, company portals, and hidden deadlines. OppTrack organizes them into one unified flow.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              
              {/* Card 1 */}
              <div style={{ background: '#F8FAFD', borderRadius: 16, padding: 32, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: '#0B1F3A' }}>
                    <FileText size={24} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', margin: '0 0 10px' }}>
                    Same form, different day
                  </h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Re-entering CGPA, resume drive links, PRN, branch percentages, and 10th/12th marks from scratch for every single campus drive.
                  </p>
                </div>
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E5EAF0', fontSize: 12, color: '#64748B' }}>
                  Average time wasted: <strong style={{ color: '#0B1F3A' }}>4.5 hours / week</strong>
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ background: '#F8FAFD', borderRadius: 16, padding: 32, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: '#0B1F3A' }}>
                    <ExternalLink size={24} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', margin: '0 0 10px' }}>
                    Two links, one deadline
                  </h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Juggling company career portals, internal college Google Sheets, Superset accounts, and unofficial WhatsApp group confirmation forms.
                  </p>
                </div>
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E5EAF0', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                  Missed steps lead to permanent disqualification
                </div>
              </div>

              {/* Card 3 */}
              <div style={{ background: '#F8FAFD', borderRadius: 16, padding: 32, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: '#0B1F3A' }}>
                    <Mail size={24} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', margin: '0 0 10px' }}>
                    Buried in Gmail
                  </h3>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Digging through 140+ unread placement cell circulars just to confirm whether you meet the 60% criteria or finding the OA test link 5 minutes late.
                  </p>
                </div>
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E5EAF0', fontSize: 12, color: '#64748B' }}>
                  Critical dates get lost in inbox clutter
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── CORE SYSTEM MODULES (6 CAPABILITIES) ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#F7F9FC', padding: '80px 24px', borderBottom: '1px solid #E5EAF0' }} id="features">
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#087F71' }}>
                PRECISION ARCHITECTURE
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '8px 0 12px' }}>
                Everything you need for placement season.
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                One verified student profile. One automated tracker. Zero repetitive copy-paste.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
              
              {/* Module 1: Profile Vault */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', boxShadow: '0 2px 8px rgba(11,31,58,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EAF2FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Folder size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>01 // VAULT</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>
                    Full CRUD Student Profile Vault
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Store academics, CGPA, backlogs, certificates, coding profiles (LeetCode, CodeChef), and custom fields with quick-edit and deletion tracking.
                  </p>
                </div>
                
                <div style={{ background: '#F8FAFD', borderRadius: 10, padding: 14, border: '1px solid #E5EAF0', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>CGPA (Engineering)</span>
                    <span style={{ fontWeight: 700, color: '#0B1F3A', fontFamily: 'monospace' }}>8.84 / 10.0</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>10th / 12th Percentage</span>
                    <span style={{ fontWeight: 700, color: '#0B1F3A', fontFamily: 'monospace' }}>92.4% • 89.2%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: '1px solid #E5EAF0' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#FFFFFF', border: '1px solid #CBD5E1', fontSize: 10.5 }}>leetcode.com/user</span>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#FFFFFF', border: '1px solid #CBD5E1', fontSize: 10.5 }}>github.com/profile</span>
                  </div>
                </div>
              </div>

              {/* Module 2: AI Email Circular Ingestion */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', boxShadow: '0 2px 8px rgba(11,31,58,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8F8F5', color: '#087F71', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#087F71', fontFamily: 'monospace' }}>02 // AI SYNC</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>
                    Automated Placement Email Extraction
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                    AI extracts company names, packages (CTC/stipend), allowed branches, deadlines, and registration links from unread college placement circulars.
                  </p>
                </div>

                <div style={{ background: '#F8FAFD', borderRadius: 10, padding: 14, border: '1px solid #E5EAF0', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Extracted Company</span>
                    <span style={{ fontWeight: 700, color: '#0B1F3A' }}>Google India</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Allowed Branches</span>
                    <span style={{ fontWeight: 700, color: '#2563EB' }}>CS, IT, ENTC</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Package</span>
                    <span style={{ fontWeight: 700, color: '#16A34A' }}>CTC 32 LPA (PPO)</span>
                  </div>
                </div>
              </div>

              {/* Module 3: Tracked Opportunities Pipeline */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', boxShadow: '0 2px 8px rgba(11,31,58,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Kanban size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>03 // PIPELINE</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>
                    End-to-End Opportunity Pipeline
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Track status transitions from Not Applied $\rightarrow$ Applied $\rightarrow$ Online Assessment $\rightarrow$ Interview $\rightarrow$ HR $\rightarrow$ Offer.
                  </p>
                </div>

                <div style={{ background: '#F8FAFD', borderRadius: 10, padding: 14, border: '1px solid #E5EAF0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, textAlign: 'center', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                    <span style={{ color: '#64748B' }}>Applied</span>
                    <span style={{ color: '#2563EB' }}>OA</span>
                    <span style={{ color: '#0B1F3A' }}>Interview</span>
                    <span style={{ color: '#087F71' }}>Offer</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 20, right: 20, height: 2, background: '#E2E8F0', zIndex: 0 }} />
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#CBD5E1', color: '#1E293B', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>12</span>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>7</span>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0B1F3A', color: '#FFF', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>4</span>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#A3E5D9', color: '#087F71', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>2</span>
                  </div>
                </div>
              </div>

              {/* Module 4: Google Calendar & Notifications */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', boxShadow: '0 2px 8px rgba(11,31,58,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>04 // CALENDAR</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>
                    Google Calendar & Deadline Alerts
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Automatically creates events on Google Calendar for test dates and application deadlines. Sends email reminders 24h & 2h prior.
                  </p>
                </div>

                <div style={{ background: '#F8FAFD', borderRadius: 10, padding: 12, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: '#0B1F3A' }}>Google Calendar 2-Way Sync</span>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>● Active</span>
                  </div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>
                    Synced 14 placement deadlines & test schedules directly to phone.
                  </div>
                </div>
              </div>

              {/* Module 5: Automated Updates on Existing Jobs */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', boxShadow: '0 2px 8px rgba(11,31,58,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>05 // AUTO-UPDATE</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>
                    Shortlist & Round 2 Detection
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                    When new circulars arrive with shortlisted students, revised dates, or second round links, AI detects existing jobs and updates them automatically.
                  </p>
                </div>

                <div style={{ background: '#F8FAFD', borderRadius: 10, padding: 12, border: '1px solid #E5EAF0', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: '#0B1F3A' }}>Drive Update Detected</span>
                    <span style={{ color: '#2563EB', fontWeight: 700 }}>Round 2 Date</span>
                  </div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>
                    Auto-appended shortlist status to Microsoft application card.
                  </div>
                </div>
              </div>

              {/* Module 6: Chrome Extension Autofill */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', boxShadow: '0 2px 8px rgba(11,31,58,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8F8F5', color: '#087F71', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Puzzle size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#087F71', fontFamily: 'monospace' }}>06 // EXTENSION</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>
                    1-Click Form Autofill Extension
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Autofills complex Google Forms and company portals with one click. Staged data review prevents accidental profile overwrites.
                  </p>
                </div>

                <div style={{ background: '#F8FAFD', borderRadius: 10, padding: 12, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700 }}>
                    <span style={{ color: '#0B1F3A' }}>Google Form Detected</span>
                    <span style={{ color: '#087F71' }}>18 Fields Matched</span>
                  </div>
                  <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: '#18B7A0' }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── HOW IT WORKS SECTION (4 STEPS) ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#FFFFFF', padding: '80px 24px', borderBottom: '1px solid #E5EAF0' }} id="how-it-works">
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#087F71' }}>
                STREAMLINED WORKFLOW
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '8px 0 12px' }}>
                From placement circular to application in minutes.
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Four straightforward steps designed around your daily campus routine.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              
              {/* Step 1 */}
              <div style={{ background: '#F8FAFD', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: 'rgba(24, 183, 160, 0.35)', fontFamily: 'monospace' }}>01</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1F3A' }}>
                      <User size={18} />
                    </div>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>Create profile once</h4>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Add your academic marks, personal credentials, resume versions, portfolio URLs, and certifications once into the Profile Vault.
                  </p>
                </div>
                <div style={{ marginTop: 24, fontSize: 11, fontWeight: 700, color: '#087F71', fontFamily: 'monospace' }}>
                  STEP 01 // SETUP
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ background: '#F8FAFD', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: 'rgba(24, 183, 160, 0.35)', fontFamily: 'monospace' }}>02</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1F3A' }}>
                      <Mail size={18} />
                    </div>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>Paste or sync email</h4>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Copy-paste college circular text or let automatic Gmail sync ingest drive announcements directly from placement coordinators.
                  </p>
                </div>
                <div style={{ marginTop: 24, fontSize: 11, fontWeight: 700, color: '#087F71', fontFamily: 'monospace' }}>
                  STEP 02 // INGEST
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ background: '#F8FAFD', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: 'rgba(24, 183, 160, 0.35)', fontFamily: 'monospace' }}>03</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1F3A' }}>
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>Review AI extraction</h4>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    AI extracts company, CTC, eligibility criteria, and deadlines. Duplicate detection flags if the company was already tracked.
                  </p>
                </div>
                <div style={{ marginTop: 24, fontSize: 11, fontWeight: 700, color: '#087F71', fontFamily: 'monospace' }}>
                  STEP 03 // VERIFY
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ background: '#F8FAFD', borderRadius: 16, padding: 28, border: '1px solid #E5EAF0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: 'rgba(24, 183, 160, 0.35)', fontFamily: 'monospace' }}>04</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B1F3A' }}>
                      <Zap size={18} />
                    </div>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 8px' }}>Track & autofill forms</h4>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Use the Chrome extension to autofill application forms in seconds, while Google Calendar alerts you before deadlines expire.
                  </p>
                </div>
                <div style={{ marginTop: 24, fontSize: 11, fontWeight: 700, color: '#087F71', fontFamily: 'monospace' }}>
                  STEP 04 // EXECUTE
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── CHROME EXTENSION CALLOUT SECTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#F7F9FC', padding: '80px 24px', borderBottom: '1px solid #E5EAF0' }} id="extension">
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div
              style={{
                background: '#0B1F3A',
                borderRadius: 24,
                padding: '48px 40px',
                color: '#FFFFFF',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 40,
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 14, background: 'rgba(24, 183, 160, 0.2)', color: '#72F8DF', fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
                  <Puzzle size={14} /> OppTrack Chrome Extension v1.2
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                  Autofill company forms in one click.
                </h2>
                <p style={{ fontSize: 14.5, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Install the free OppTrack extension to eliminate manual copy-paste across Google Forms, company portals, and placement registration links.
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <a
                    href={EXTENSION_DOWNLOAD_URL}
                    download
                    style={{
                      background: '#18B7A0',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 700,
                      padding: '12px 22px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(24, 183, 160, 0.4)'
                    }}
                  >
                    <Download size={16} /> Download Extension (.zip)
                  </a>

                  <Link
                    to="/help"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 600,
                      padding: '12px 18px',
                      borderRadius: 8,
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

              {/* Extension Visual Card */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#72F8DF', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} /> Quick Installation (30 Seconds):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, color: '#E2E8F0' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#18B7A0' }}>1.</span>
                    <span>Download and unzip <code>OppTrack.AutoFill.Extension.zip</code></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#18B7A0' }}>2.</span>
                    <span>Open <code>chrome://extensions</code> and enable <strong>Developer mode</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#18B7A0' }}>3.</span>
                    <span>Click <strong>Load unpacked</strong> and select the extension folder</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ── FINAL CALL TO ACTION ── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section style={{ background: '#FFFFFF', padding: '90px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '0 0 14px' }}>
              Ready to automate your placement season?
            </h2>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.6, margin: '0 0 32px' }}>
              Join engineering students from PCCOE, Pune and top colleges tracking opportunities with zero missed deadlines.
            </p>
            <Link
              to="/register"
              style={{
                background: '#0B1F3A',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                padding: '14px 32px',
                borderRadius: 8,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(11, 31, 58, 0.25)'
              }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0B1F3A', color: '#94A3B8', padding: '48px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoImg} alt="OppTrack Logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>OppTrack</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>• Placement Productivity Platform</span>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <Link to="/login" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Student Login</Link>
            <Link to="/register" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Register</Link>
            <Link to="/help" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Help Guide</Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ color: '#CBD5E1', textDecoration: 'none' }}>GitHub</a>
          </div>

          <div style={{ fontSize: 12, color: '#64748B' }}>
            © {new Date().getFullYear()} OppTrack. Engineered for high-velocity student placement teams.
          </div>
        </div>
      </footer>

    </div>
  );
}
