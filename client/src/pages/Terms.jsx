import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Terms() {
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
            <FileText size={14} /> Agreement
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            Last updated: September 26, 2026. Please read these terms carefully before using OppTrack.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>
              By registering for, accessing, or using OppTrack ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use the service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              2. Student Platform &amp; Permitted Use
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: '0 0 12px' }}>
              OppTrack is an educational productivity tool intended for students, campus placement preparation, and job tracking. You agree to:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Provide accurate academic information in your personal Profile Vault.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Use the Chrome extension solely for legitimate recruitment forms and job portal submissions.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckCircle2 size={16} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Maintain the confidentiality of your account credentials and personal API keys.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              3. Disclaimer of Application Outcomes
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>
              OppTrack assists in organizing deadlines and autofilling profile values. OppTrack does not guarantee employment, job interviews, offers, or admission into any campus placement drive. Students are solely responsible for reviewing application data before final submission to company recruiters.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              4. AI Extraction Accuracy &amp; Verification
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>
              AI extraction (e.g. from circular emails, form questions, and resumes) is provided as an assistive draft tool. OppTrack displays confidence levels and comparison diffs, but you must verify that all extracted information is accurate before saving it into your Profile Vault.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              5. Free Tier &amp; Fair Usage
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>
              OppTrack is 100% free for students. There are no hidden subscription fees or credit card requirements. We reserve the right to apply reasonable rate limits on API and extraction endpoints to ensure reliable uptime for all campus students.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
              6. Governing Law &amp; Inquiries
            </h2>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>
              These terms are governed by the laws applicable in India. For questions or support, contact <a href="mailto:support@opptrack.io" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>support@opptrack.io</a>.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '24px', textAlign: 'center', fontSize: 12, color: '#64748B' }}>
        OppTrack © {new Date().getFullYear()} • Engineered for students with transparency.
      </footer>
    </div>
  );
}
