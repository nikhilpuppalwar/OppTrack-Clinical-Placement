import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Briefcase, Calendar, History,
  User, Settings, LogOut, HelpCircle, Sun, Moon,
  ShieldCheck, MoreHorizontal, X, ChevronRight, Plus
} from 'lucide-react';
import { profileAPI, opportunityAPI } from '../api';

export default function MobileNav() {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [oppCount, setOppCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  // Close drawer whenever route changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen || showLogoutConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, showLogoutConfirm]);

  // Fetch telemetry counts
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        if (!user) return;
        const [syncRes, statsRes] = await Promise.allSettled([
          profileAPI.getPendingSyncs(),
          opportunityAPI.stats(),
        ]);
        if (!isMounted) return;
        if (syncRes.status === 'fulfilled') {
          setPendingSyncCount(syncRes.value.data?.syncs?.length || 0);
        }
        if (statsRes.status === 'fulfilled') {
          const data = statsRes.value.data;
          setOppCount(data?.inProgress || data?.applied || 0);
          setUpcomingCount(data?.upcoming?.length || 0);
        }
      } catch {
        // silent
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const PRIMARY_TABS = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/opportunities', icon: Briefcase, label: 'Opps', badge: oppCount },
    { to: '/calendar', icon: Calendar, label: 'Calendar', badge: upcomingCount },
    { to: '/profile', icon: User, label: 'Vault', badge: pendingSyncCount },
  ];

  const DRAWER_ITEMS = [
    { to: '/history', icon: History, label: 'Activity Log', desc: 'Timeline of applications & sync audits' },
    { to: '/google-tester', icon: ShieldCheck, label: 'Google Tester Access', desc: 'Unlock Gmail fetch & Calendar sync' },
    { to: '/settings', icon: Settings, label: 'System Settings', desc: 'AI keys, notifications & account' },
    { to: '/help', icon: HelpCircle, label: 'Help & Extension Guide', desc: 'Setup guide, APK/extension download' },
  ];

  return (
    <>
      {/* ── Fixed Mobile Bottom Navigation Bar ── */}
      <nav className="vessa-mobile-nav" aria-label="Mobile Navigation">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`vessa-mobile-tab ${isActive ? 'active' : ''}`}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="vessa-mobile-badge">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="vessa-mobile-tab-label">{tab.label}</span>
            </NavLink>
          );
        })}

        {/* More Menu Trigger */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`vessa-mobile-tab ${isDrawerOpen ? 'active' : ''}`}
          aria-label="Open More Menu"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MoreHorizontal size={20} strokeWidth={isDrawerOpen ? 2.4 : 1.9} />
          </div>
          <span className="vessa-mobile-tab-label">More</span>
        </button>
      </nav>

      {/* ── Slide-up Drawer Menu Overlay ── */}
      {isDrawerOpen && (
        <div
          className="vessa-mobile-drawer-backdrop"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="vessa-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div className="vessa-mobile-drawer-handle" />

            {/* User Capsule in Drawer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 16px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, var(--primary-brand) 0%, #10B981 100%)',
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(24, 183, 160, 0.25)',
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user?.name || 'Student Portal'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {user?.email || 'PCCOE Placement Vault'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Action: New Opportunity Button */}
            <NavLink
              to="/opportunities/new"
              className="vessa-mobile-drawer-new-btn"
              onClick={() => setIsDrawerOpen(false)}
            >
              <Plus size={16} strokeWidth={2.4} />
              <span>Add New Opportunity</span>
            </NavLink>

            {/* Navigation Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '14px 0' }}>
              {DRAWER_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: isActive ? 'var(--card-subtle)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'background 140ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isActive ? 'rgba(24, 183, 160, 0.15)' : 'var(--card-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? '#18B7A0' : 'var(--text-primary)',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </NavLink>
                );
              })}
            </div>

            {/* Footer Utilities: Theme Switcher & Sign Out */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Theme Toggle Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isDark ? <Moon size={17} color="#A78BFA" /> : <Sun size={17} color="#F59E0B" />}
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isDark ? 'Dark Theme' : 'Light Theme'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    borderRadius: 9999,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  Switch to {isDark ? 'Light' : 'Dark'}
                </button>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setShowLogoutConfirm(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#EF4444',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 140ms ease',
                }}
              >
                <LogOut size={16} />
                <span>Sign Out of OppTrack</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Sign Out Confirmation Modal ── */}
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
              maxWidth: 380,
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
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                marginBottom: 14,
              }}
            >
              <LogOut size={24} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Sign Out Confirmation
            </h3>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to log out of your session? You will need to sign in again to access your opportunities.
            </p>

            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--card-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
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
                  padding: '11px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                }}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
