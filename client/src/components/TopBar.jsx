import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, Bell, Plus, User, Sparkles, ChevronDown, 
  Target, Calendar, Briefcase, History, CheckCircle, Clock, X
} from 'lucide-react';
import { settingsAPI } from '../api';
import logoImg from '../assets/logo.png';
import GlobalSearchModal from './GlobalSearchModal';

export default function TopBar() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showRemindersDropdown, setShowRemindersDropdown] = useState(false);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch reminders for notification badge
  useEffect(() => {
    let isMounted = true;
    const fetchReminders = async () => {
      try {
        const { data } = await settingsAPI.getUpcomingReminders();
        if (isMounted) setReminders(data?.reminders || []);
      } catch {
        // silent
      }
    };
    fetchReminders();
    const interval = setInterval(fetchReminders, 2 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Dynamic time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = user?.name ? user.name.split(' ')[0] : 'Candidate';
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OP';

  return (
    <>
      <header className="vessa-topbar">
        {/* Left: Brand Identity */}
        <Link to="/" className="vessa-brand">
          <div className="vessa-brand-logo" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 3 }}>
            <img src={logoImg} alt="OppTrack Logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 8 }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              OppTrack
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              Placement & Clinical
            </div>
          </div>
        </Link>

        {/* Center: Differentiated Global Search & Status Capsule (No Duplicate Nav) */}
        <div className="vessa-topbar-center">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="vessa-topbar-search"
            title="Global Search (Ctrl+K or ⌘K)"
          >
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="vessa-search-text">Search opportunities, companies, deadlines...</span>
            <span className="vessa-kbd">⌘K</span>
          </button>

          <div className="vessa-topbar-telemetry" title="PCCOE Campus Placement Season 2025–2026">
            <span className="vessa-pulse-dot" />
            <span>Season 2025–26</span>
          </div>
        </div>

        {/* Right Section: Notifications + Action + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Notification Bell with Badge */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRemindersDropdown((prev) => !prev)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: showRemindersDropdown ? 'var(--card-subtle)' : 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                position: 'relative',
                transition: 'all 140ms ease',
              }}
              title="Notifications & Upcoming Deadlines"
            >
              <Bell size={17} />
              {reminders.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    background: 'var(--danger)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(216, 66, 66, 0.4)',
                  }}
                >
                  {reminders.length > 9 ? '9+' : reminders.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {showRemindersDropdown && (
              <div
                className="dropdown-motion"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 320,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Upcoming Alerts ({reminders.length})
                  </div>
                  <button
                    onClick={() => setShowRemindersDropdown(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={15} />
                  </button>
                </div>
                {reminders.length === 0 ? (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                    No pending deadlines or tests today!
                  </div>
                ) : (
                  <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {reminders.map((rem, i) => (
                      <Link
                        key={i}
                        to={`/opportunities/${rem.opportunityId}`}
                        onClick={() => setShowRemindersDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 10,
                          background: 'var(--card-subtle)',
                          textDecoration: 'none',
                          transition: 'background 120ms ease',
                        }}
                      >
                        <Clock size={15} color="var(--vessa-plum)" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rem.company} — {rem.milestoneLabel}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {rem.hoursLeft > 0 ? `In ${rem.hoursLeft} hours` : 'Due today'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Primary "+ New" Action Button */}
          <Link to="/opportunities/new" className="vessa-btn-primary">
            <Plus size={16} strokeWidth={2.4} />
            <span>+ New</span>
          </Link>

          {/* User Profile Capsule */}
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: 'var(--card-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 12px 4px 6px',
              textDecoration: 'none',
              transition: 'all 140ms ease',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--vessa-plum)',
                color: '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1 }}>{greeting}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{userName}</span>
            </div>
            <ChevronDown size={13} color="var(--text-muted)" />
          </Link>
        </div>
      </header>

      {/* Global Search Dialog Overlay */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
