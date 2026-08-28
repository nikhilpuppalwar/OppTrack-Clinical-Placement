import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Briefcase, Calendar, History,
  User, Settings, LogOut, Puzzle
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/history', icon: History, label: 'Activity Log' },
  { to: '/profile', icon: User, label: 'Profile Vault' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const GITHUB_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement';
const EXTENSION_DOWNLOAD_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip';

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: '#171B18',
        borderRight: '1px solid #2A302B',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100,
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      {/* Brand Logo Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 8px 24px 8px',
          borderBottom: '1px solid #2A302B',
          marginBottom: 24
        }}
      >
        <img src="/logo.svg" alt="OppTrack Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <div>
          <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, fontWeight: 400, color: '#F2F3ED', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
            OppTrack
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Clinical Placement
          </p>
        </div>
      </div>

      {/* Nav Label */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(242,243,237,0.4)', padding: '0 8px', marginBottom: 12 }}>
        Main Menu
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#F2F3ED' : 'rgba(242,243,237,0.65)',
              background: isActive ? '#121413' : 'transparent',
              borderLeft: isActive ? '3px solid #b7e34a' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} color={isActive ? '#b7e34a' : 'rgba(242,243,237,0.5)'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Extension + GitHub Promo */}
      <div style={{ margin: '16px 0 12px', padding: '12px', background: '#121413', borderRadius: 8, border: '1px solid #2A302B' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#b7e34a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          🧩 Chrome Extension
        </div>
        <p style={{ margin: '0 0 8px', fontSize: 11, color: 'rgba(242,243,237,0.5)', lineHeight: 1.5 }}>
          Autofill any form with AI using your profile data.
        </p>
        <a
          href={EXTENSION_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: '#b7e34a', color: '#0f1210',
            borderRadius: 5, padding: '6px 10px',
            fontSize: 11, fontWeight: 700, textDecoration: 'none',
            transition: 'opacity 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Puzzle size={12} /> Download Extension
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            color: 'rgba(242,243,237,0.4)', marginTop: 6,
            fontSize: 10, textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#F2F3ED'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(242,243,237,0.4)'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub Repo ↗
        </a>
      </div>

      {/* Sidebar Footer */}
      <div style={{ borderTop: '1px solid #2A302B', paddingTop: 20 }}>
        <div style={{ padding: '0 8px 14px 8px' }}>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: '#F2F3ED', lineHeight: 1.2 }}>
            {user?.name || 'Student'}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.45)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || 'user@opptrack.io'}
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            background: '#121413',
            border: '1px solid #2A302B',
            borderRadius: 6,
            color: '#ffb4ab',
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.15s ease'
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}
