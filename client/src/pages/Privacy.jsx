import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';

export default function Privacy() {
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
                Privacy &amp; Data Security
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
            <Shield size={14} /> Legal &amp; Data Protection
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Last updated: September 26, 2026. Effective immediately for all OppTrack users.
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
              1. Our Privacy Commitment
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              OppTrack was built by students, for students. We believe placement data is sensitive and personal. We do not sell, rent, monetize, or share your academic credentials, resumes, or application history with third-party advertisers or recruitment brokers. You maintain full ownership of your data at all times.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              2. Data We Collect
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 14px' }}>
              OppTrack only collects data that you explicitly provide or approve:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: 'var(--text-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span><strong>Account Information:</strong> Name, email address, password hash (salted using bcrypt), college name, and department.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span><strong>Profile Vault Data:</strong> CGPA, 10th/12th percentages, active backlogs, coding handles (LeetCode, GitHub), skills, and addresses you save into your vault.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span><strong>Resume Documents:</strong> When using AI Resume Import, your PDF or DOCX file is processed in server memory to extract fields for your review. Files are not stored on public drives.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span><strong>Opportunity Records:</strong> Company names, roles, CTC, application deadlines, recruitment stages, and personal notes you track.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span><strong>Integration Credentials (Optional):</strong> If configured, your personal Groq/Gemini API key and SMTP notification credentials are saved exclusively to your encrypted account row.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              3. AI Analysis &amp; Explicit User Consent
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 10px' }}>
              When you use AI Form Import or AI Resume Import:
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <li>The AI extracts candidate information solely to draft proposed fields for your review.</li>
              <li><strong>OppTrack never automatically updates your Profile Vault.</strong> Extraction results are staged in a temporary state until you explicitly accept, edit, or reject each field.</li>
              <li>Resume contents are treated as untrusted text and sanitized against prompt injections.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              4. Chrome Extension &amp; Client Privacy
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              The OppTrack Chrome Extension operates only on tabs where you activate it (e.g., Google Forms or recruitment application pages). It accesses form input elements solely to suggest autofill data from your Profile Vault. It does not track your general browsing history or monitor unrelated tabs.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              5. Data Retention &amp; Deletion Rights
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              You may modify or delete any Profile Vault field, opportunity record, or import history at any time. When you delete a record or reset your Profile Vault, the data is permanently removed from our active database. If you wish to delete your entire account, you can request full account deletion via Settings.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              6. Contact &amp; Questions
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              If you have any questions regarding how your data is handled, please contact our support team at{' '}
              <a href="mailto:privacy@opptrack.io" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
                privacy@opptrack.io
              </a>{' '}
              or file an issue on our GitHub repository.
            </p>
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
        OppTrack © {new Date().getFullYear()} • Built for transparent student productivity.
      </footer>
    </div>
  );
}
