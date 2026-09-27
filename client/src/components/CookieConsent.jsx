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
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        maxWidth: 580,
        zIndex: 99999,
        background: '#0F172A',
        color: '#FFFFFF',
        borderRadius: 10,
        padding: '16px 20px',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="#2563EB" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>
            Data Privacy &amp; Local Storage
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.55 }}>
        OppTrack uses browser storage solely for session authentication and personal placement preferences. We do not use advertising cookies or sell student data. AI extraction only drafts fields for your explicit review.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
          <Link to="/privacy" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
          <Link to="/cookies" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 500 }}>Cookie Policy</Link>
        </div>

        <button
          onClick={handleAccept}
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            padding: '6px 16px',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          Got it
        </button>
      </div>
    </aside>
  );
}
