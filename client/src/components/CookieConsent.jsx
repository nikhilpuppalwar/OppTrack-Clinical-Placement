import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('opptrack_consent_accepted');
    if (!consent) {
      // Small timeout so it doesn't jarringly pop on immediate page paint
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('opptrack_consent_accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Privacy and Cookie Consent"
      className="screen-enter"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        maxWidth: 580,
        zIndex: 99999,
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        borderRadius: 12,
        padding: '16px 20px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'inherit'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="var(--primary-brand)" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
            Data Privacy &amp; Local Storage
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        OppTrack uses browser storage solely for session authentication and personal placement preferences. We do not use advertising cookies or sell student data. AI extraction only drafts fields for your explicit review.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
          <Link to="/privacy" style={{ color: 'var(--primary-brand)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
          <Link to="/cookies" style={{ color: 'var(--primary-brand)', textDecoration: 'none', fontWeight: 500 }}>Cookie Policy</Link>
        </div>

        <button
          onClick={handleAccept}
          style={{
            background: 'var(--primary-brand)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            padding: '7px 18px',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-plum)',
            transition: 'opacity 0.15s ease'
          }}
        >
          Got it
        </button>
      </div>
    </aside>
  );
}
