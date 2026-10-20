import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';

export default function Terms() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* ── TOP FLOATING NAVIGATION BAR (VESSA DOCK) ── */}
      <div style={{ position: 'sticky', top: 14, zIndex: 100, padding: '0 20px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <header className="vessa-topbar">
          <Link to="/" className="vessa-brand">
            <div className="vessa-brand-logo" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 3 }}>
              <img src={logoImg} alt="OppTrack Logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 8 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                OppTrack
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                Terms &amp; Policies
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--card-subtle)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Link
              to="/"
              className="vessa-pill-tab"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>
        </header>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '36px 20px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'var(--primary-brand-light)',
              color: 'var(--primary-brand-text)',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
              border: '1px solid var(--border)',
            }}
          >
            <FileText size={14} /> Agreement
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Last updated: September 26, 2026. Please read these terms carefully before using OppTrack.
          </p>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '36px 32px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              By registering for, accessing, or using OppTrack ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use the service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              2. Student Platform &amp; Permitted Use
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 12px' }}>
              OppTrack is an educational productivity tool intended for students, campus placement preparation, and job tracking. You agree to:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: 'var(--text-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Provide accurate academic information in your personal Profile Vault.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Use the Chrome extension solely for legitimate recruitment forms and job portal submissions.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Maintain the confidentiality of your account credentials and personal API keys.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              3. Disclaimer of Application Outcomes
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              OppTrack assists in organizing deadlines and autofilling profile values. OppTrack does not guarantee employment, job interviews, offers, or admission into any campus placement drive. Students are solely responsible for reviewing application data before final submission to company recruiters.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              4. AI Extraction Accuracy &amp; Verification
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              AI extraction (e.g. from circular emails, form questions, and resumes) is provided as an assistive draft tool. OppTrack displays confidence levels and comparison diffs, but you must verify that all extracted information is accurate before saving it into your Profile Vault.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              5. Free Tier &amp; Fair Usage
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              OppTrack is 100% free for students. There are no hidden subscription fees or credit card requirements. We reserve the right to apply reasonable rate limits on API and extraction endpoints to ensure reliable uptime for all campus students.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              6. Governing Law &amp; Inquiries
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              These terms are governed by the laws applicable in India. For questions or support, contact{' '}
              <a href="mailto:support@opptrack.io" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
                support@opptrack.io
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
        OppTrack © {new Date().getFullYear()} • Engineered for students with transparency.
      </footer>
    </div>
  );
}
