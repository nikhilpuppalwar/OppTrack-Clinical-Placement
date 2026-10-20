import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, Bell, Plus, User, Sparkles, ChevronDown, 
  Target, Calendar, Briefcase, History, CheckCircle, Clock, X,
  LogOut, Settings, HelpCircle
} from 'lucide-react';
import { settingsAPI } from '../api';
import logoImg from '../assets/logo.png';
import GlobalSearchModal from './GlobalSearchModal';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showRemindersDropdown, setShowRemindersDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on route change
  useEffect(() => {
    setShowUserDropdown(false);
    setShowRemindersDropdown(false);
  }, [location.pathname]);

  // Click outside listener for user menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* User Profile Capsule with Interactive Dropdown */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserDropdown((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                background: showUserDropdown ? 'var(--surface)' : 'var(--card-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 12px 4px 6px',
                cursor: 'pointer',
                transition: 'all 140ms ease',
              }}
              title="Account Menu & Sign Out"
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
              <ChevronDown size={13} color="var(--text-muted)" style={{ transform: showUserDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 140ms ease' }} />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div
                className="dropdown-motion"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 250,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 250,
                  padding: '8px',
                }}
              >
                {/* User Info Header */}
                <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email || 'student@pccoe.edu'}
                  </div>
                </div>

                {/* Menu Navigation Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Link
                    to="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={16} color="var(--primary-brand)" />
                    <span>Profile Vault</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Settings size={16} color="var(--text-muted)" />
                    <span>System Settings</span>
                  </Link>

                  <Link
                    to="/help"
                    onClick={() => setShowUserDropdown(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <HelpCircle size={16} color="var(--text-muted)" />
                    <span>Help & Guide</span>
                  </Link>
                </div>

                {/* Divider & Sign Out Action */}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowLogoutConfirm(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 10,
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Overlay */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Sign Out Confirmation Modal via Portal */}
      {showLogoutConfirm && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 31, 58, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            pointerEvents: 'auto',
            animation: 'fadeIn var(--motion-fast) var(--ease-standard)',
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '28px 24px 22px',
              maxWidth: 400,
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              pointerEvents: 'auto',
              animation: 'scaleIn var(--motion-fast) var(--ease-spring)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
              }}
              title="Cancel"
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                marginBottom: 16,
              }}
            >
              <LogOut size={26} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Sign Out Confirmation
            </h3>

            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 24px 0' }}>
              Are you sure you want to log out of your OppTrack session? You will need to sign in again to access your profile vault and opportunities.
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--card-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                }}
              >
                <LogOut size={16} />
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
