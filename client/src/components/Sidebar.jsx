import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Briefcase, Calendar, History,
  User, Settings, LogOut, HelpCircle, Sun, Moon,
  ShieldCheck, PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react';
import { profileAPI, opportunityAPI } from '../api';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: Briefcase, label: 'Opportunities', badgeKey: 'opps' },
  { to: '/calendar', icon: Calendar, label: 'Calendar', badgeKey: 'calendar' },
  { to: '/history', icon: History, label: 'Activity Log' },
  { to: '/profile', icon: User, label: 'Profile Vault', badgeKey: 'profile' },
  { to: '/google-tester', icon: ShieldCheck, label: 'Google Testers' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isExpanded = false, onToggleExpand }) {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [oppCount, setOppCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close logout confirmation on Escape
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowLogoutConfirm(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutConfirm]);

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

  const getBadgeValue = (key) => {
    if (key === 'profile') return pendingSyncCount;
    if (key === 'opps') return oppCount;
    if (key === 'calendar') return upcomingCount;
    return 0;
  };

  return (
    <aside className={`vessa-sidebar ${isExpanded ? 'expanded' : ''}`}>
      {/* ── 1. TOP ISLAND: THEME SWITCHER CAPSULE ── */}
      <div className="vessa-sidebar-island vessa-sidebar-island-theme">
        {isExpanded ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 4,
            }}
          >
            <button
              onClick={() => isDark && toggleTheme()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 9999,
                border: 'none',
                background: !isDark ? 'var(--primary-navy)' : 'transparent',
                color: !isDark ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--motion-fast) var(--ease-standard)',
                boxShadow: !isDark ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}
              title="Light theme"
            >
              <Sun size={15} strokeWidth={2.3} />
              <span>Light</span>
            </button>
            <button
              onClick={() => !isDark && toggleTheme()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 9999,
                border: 'none',
                background: isDark ? 'var(--vessa-plum)' : 'transparent',
                color: isDark ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--motion-fast) var(--ease-standard)',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
              title="Dark theme"
            >
              <Moon size={15} strokeWidth={2.3} />
              <span>Dark</span>
            </button>
          </div>
        ) : (
          <div
            onClick={toggleTheme}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: !isDark ? 'var(--primary-navy)' : 'transparent',
                color: !isDark ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: !isDark ? '0 2px 6px rgba(0,0,0,0.25)' : 'none',
                transition: 'all var(--motion-fast) var(--ease-standard)',
              }}
            >
              <Sun size={17} strokeWidth={2.3} />
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? 'var(--vessa-plum)' : 'transparent',
                color: isDark ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: isDark ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                transition: 'all var(--motion-fast) var(--ease-standard)',
              }}
            >
              <Moon size={16} strokeWidth={2.3} />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. MIDDLE ISLAND: NAVIGATION STACK ── */}
      <nav className="vessa-sidebar-island vessa-sidebar-island-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const badgeCount = getBadgeValue(item.badgeKey);

          return (
            <div
              key={item.to}
              style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  width: isExpanded ? '100%' : 46,
                  height: 46,
                  borderRadius: isExpanded ? 14 : 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  padding: isExpanded ? '0 14px' : 0,
                  gap: 12,
                  background: isActive
                    ? 'var(--vessa-plum)'
                    : hoveredItem === item.to
                    ? 'var(--card-subtle)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  position: 'relative',
                  boxShadow: isActive ? 'var(--shadow-plum)' : 'none',
                  transition: 'all var(--motion-fast) var(--ease-standard)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={21} strokeWidth={isActive ? 2.3 : 2} style={{ flexShrink: 0 }} />
                    {isExpanded && (
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: isActive ? 600 : 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                    {badgeCount > 0 && (
                      <span
                        style={{
                          position: isExpanded ? 'static' : 'absolute',
                          top: 3,
                          right: 3,
                          background: 'var(--danger)',
                          color: '#FFFFFF',
                          fontSize: 10.5,
                          fontWeight: 700,
                          minWidth: 18,
                          height: 18,
                          padding: isExpanded ? '0 7px' : '0 2px',
                          borderRadius: 9999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>

              {/* Tooltip when collapsed */}
              {!isExpanded && hoveredItem === item.to && (
                <div
                  style={{
                    position: 'absolute',
                    left: 'calc(100% + 14px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#0B1120',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    animation: 'screenEnter 140ms ease forwards',
                  }}
                >
                  {item.label}
                  <div
                    style={{
                      position: 'absolute',
                      right: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      borderWidth: 5,
                      borderStyle: 'solid',
                      borderColor: 'transparent #0B1120 transparent transparent',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── 3. BOTTOM ISLAND: UTILITIES CARD ── */}
      <div className="vessa-sidebar-island vessa-sidebar-island-utils">
        {/* Help Link */}
        <div
          style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
          onMouseEnter={() => setHoveredItem('/help')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <NavLink
            to="/help"
            style={({ isActive }) => ({
              width: isExpanded ? '100%' : 44,
              height: 44,
              borderRadius: isExpanded ? 14 : 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '0 12px' : 0,
              gap: 12,
              background: isActive
                ? 'var(--card-subtle)'
                : hoveredItem === '/help'
                ? 'var(--card-subtle)'
                : 'transparent',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'all var(--motion-fast) var(--ease-standard)',
            })}
          >
            <HelpCircle size={20} style={{ flexShrink: 0 }} />
            {isExpanded && <span style={{ fontSize: 13, fontWeight: 500 }}>Help</span>}
          </NavLink>

          {!isExpanded && hoveredItem === '/help' && (
            <div
              style={{
                position: 'absolute',
                left: 'calc(100% + 14px)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#0B1120',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              Help & Guide
              <div
                style={{
                  position: 'absolute',
                  right: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderWidth: 5,
                  borderStyle: 'solid',
                  borderColor: 'transparent #0B1120 transparent transparent',
                }}
              />
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <div
          style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: isExpanded ? '100%' : 44,
              height: 44,
              borderRadius: isExpanded ? 14 : 16,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '0 12px' : 0,
              gap: 12,
              background: hoveredItem === 'logout' ? 'var(--card-subtle)' : 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all var(--motion-fast) var(--ease-standard)',
            }}
          >
            <LogOut size={19} style={{ flexShrink: 0 }} />
            {isExpanded && <span style={{ fontSize: 13, fontWeight: 500 }}>Sign out</span>}
          </button>

          {!isExpanded && hoveredItem === 'logout' && (
            <div
              style={{
                position: 'absolute',
                left: 'calc(100% + 14px)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#0B1120',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              Sign out
              <div
                style={{
                  position: 'absolute',
                  right: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderWidth: 5,
                  borderStyle: 'solid',
                  borderColor: 'transparent #0B1120 transparent transparent',
                }}
              />
            </div>
          )}
        </div>

        {/* Collapse Option at the very bottom */}
        <div
          style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
          onMouseEnter={() => setHoveredItem('collapse')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <button
            onClick={onToggleExpand}
            style={{
              width: isExpanded ? '100%' : 44,
              height: 44,
              borderRadius: isExpanded ? 14 : 16,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '0 12px' : 0,
              gap: 12,
              background: hoveredItem === 'collapse' ? 'var(--card-subtle)' : 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--motion-fast) var(--ease-standard)',
            }}
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? (
              <PanelLeftClose size={19} style={{ flexShrink: 0 }} />
            ) : (
              <PanelLeftOpen size={19} style={{ flexShrink: 0 }} />
            )}
            {isExpanded && (
              <span style={{ fontSize: 13, fontWeight: 500 }}>Collapse</span>
            )}
          </button>

          {!isExpanded && hoveredItem === 'collapse' && (
            <div
              style={{
                position: 'absolute',
                left: 'calc(100% + 14px)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#0B1120',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              Expand sidebar
              <div
                style={{
                  position: 'absolute',
                  right: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderWidth: 5,
                  borderStyle: 'solid',
                  borderColor: 'transparent #0B1120 transparent transparent',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 31, 58, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
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
              animation: 'scaleIn var(--motion-fast) var(--ease-spring)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close cross button */}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--motion-fast) var(--ease-standard)',
              }}
              title="Cancel"
            >
              <X size={18} />
            </button>

            {/* Warning / Logout Icon Badge */}
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

            {/* Title */}
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
              }}
            >
              Sign Out Confirmation
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: 13.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                margin: '0 0 24px 0',
              }}
            >
              Are you sure you want to log out of your OppTrack session? You will need to sign in again to access your profile vault and opportunities.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                width: '100%',
                justifyContent: 'center',
              }}
            >
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
                  transition: 'all var(--motion-fast) var(--ease-standard)',
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
                  transition: 'all var(--motion-fast) var(--ease-standard)',
                }}
              >
                <LogOut size={16} />
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
