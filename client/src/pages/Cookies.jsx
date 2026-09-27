import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, CheckCircle2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Cookies() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{ height: 64, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={logoImg} alt="OppTrack Logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>OppTrack</span>
          </Link>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            <Cookie size={14} /> Transparency
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            Cookie &amp; Local Storage Policy
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            Last updated: September 26, 2026. How OppTrack uses cookies and local browser storage.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              1. What Are Cookies and Local Storage?
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>
              Cookies and local browser storage are small pieces of data saved on your computer or mobile device when you browse websites. OppTrack uses these strictly to maintain your logged-in session, remember display preferences, and securely synchronize your Profile Vault with the Chrome Extension.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>
              2. Categories of Storage We Use
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                  A. Strictly Essential (Authentication)
                </h3>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  We store your JSON Web Token (JWT) in browser storage so you do not have to sign in every time you open a new page or use the Chrome Extension. These are essential for the application to function.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                  B. Functional Preferences
                </h3>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  We store UI state such as cookie consent acknowledgment, active filter tabs on your opportunity board, and calendar view settings.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                  C. No Advertising or Third-Party Tracking
                </h3>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  OppTrack contains zero marketing trackers, tracking pixels, or cross-site ad cookies. We never track your behavior across other web domains.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              3. Managing Your Browser Storage
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>
              You can clear cookies and local storage through your browser settings at any time. Please note that clearing authentication storage will log you out of your current session.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '24px', textAlign: 'center', fontSize: 12, color: '#64748B' }}>
        OppTrack © {new Date().getFullYear()} • Privacy-first placement infrastructure.
      </footer>
    </div>
  );
}
