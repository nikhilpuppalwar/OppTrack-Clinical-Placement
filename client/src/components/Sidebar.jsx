// OppTrack Professional SaaS Sidebar Component
import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import {
  LayoutDashboard, Briefcase, Calendar, History,
  User, Settings, LogOut, Puzzle, HelpCircle, ExternalLink,
  Bell, X, Clock, Send, Sparkles, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { settingsAPI, profileAPI } from '../api';
import { sendDesktopNotification, requestNotificationPermission } from '../utils/notifications';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/history', icon: History, label: 'Activity Log' },
  { to: '/profile', icon: User, label: 'Profile Vault' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/google-tester', icon: ShieldCheck, label: 'Google Testers' },
  { to: '/help', icon: HelpCircle, label: 'Help & Extension' },
];

const GITHUB_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement';
const EXTENSION_DOWNLOAD_URL = 'https://github.com/nikhilpuppalwar/OppTrack-Clinical-Placement/releases/download/extension/OppTrack.AutoFill.Extension.zip';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const fetchReminders = async () => {
    try {
      const { data } = await settingsAPI.getUpcomingReminders();
      setUpcomingReminders(data?.reminders || []);
    } catch {
      // ignore
    }
  };

  const fetchPendingSyncs = async () => {
    try {
      if (!user) return;
      const { data } = await profileAPI.getPendingSyncs();
      setPendingSyncCount(data?.syncs?.length || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchReminders();
    fetchPendingSyncs();
    const interval = setInterval(() => {
      fetchReminders();
      fetchPendingSyncs();
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleQuickTestNotification = async () => {
    setTestingNotification(true);
    const toastId = toast.loading('Triggering test reminder notification...');
    try {
      await requestNotificationPermission();
      const { data } = await settingsAPI.testNotification({ milestoneType: 'test' });

      // Trigger desktop notification
      sendDesktopNotification({
        title: data?.notification?.title || '🎯 Test Reminder: Google Online Assessment',
        body: data?.notification?.body || 'Upcoming assessment alert test.',
      });

      toast.success(
        data?.notification?.emailSent
          ? 'Notification popped + email sent via SMTP!'
          : 'Desktop notification sent! (Configure SMTP in Settings for email alerts)',
        { id: toastId }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test notification', { id: toastId });
    } finally {
      setTestingNotification(false);
    }
  };

  return (
    <aside
      style={{
        width: 250,
        minWidth: 250,
        background: '#FFFFFF',
        borderRight: '1px solid #E5EAF0',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100,
        boxShadow: '1px 0 4px rgba(11, 31, 58, 0.02)'
      }}
    >
      {/* Brand Logo Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 8px 20px 8px',
          borderBottom: '1px solid #E5EAF0',
          marginBottom: 20
        }}
      >
        <img
          src={logoImg}
          alt="OppTrack Logo"
          style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }}
        />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0B1F3A', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            OppTrack
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 11, fontWeight: 600, color: '#667085', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Career OS
          </p>
        </div>
      </div>

      {/* Nav Label & Notification Bell */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>
          Main Menu
        </span>
        <button
          type="button"
          onClick={() => {
            fetchReminders();
            setShowRemindersModal(true);
          }}
          title="Placement Milestone Alerts & Upcoming Tests"
          style={{
            background: upcomingReminders.some(r => r.isUrgent) ? '#FEF3C7' : '#F1F5F9',
            border: `1px solid ${upcomingReminders.some(r => r.isUrgent) ? '#FCD34D' : '#E2E8F0'}`,
            color: upcomingReminders.some(r => r.isUrgent) ? '#B45309' : '#475569',
            borderRadius: 6,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s ease',
          }}
        >
          <Bell size={12} color={upcomingReminders.some(r => r.isUrgent) ? '#D97706' : '#64748B'} />
          <span>{upcomingReminders.length > 0 ? `${upcomingReminders.length} Due` : 'Alerts'}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '9px 12px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#087F71' : '#667085',
              background: isActive ? '#E8F8F5' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} color={isActive ? '#18B7A0' : '#667085'} />
                <span>{label}</span>
                {to === '/profile' && pendingSyncCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: '#18B7A0',
                    color: '#FFFFFF',
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 10,
                    boxShadow: '0 1px 4px rgba(24, 183, 160, 0.3)'
                  }}>
                    New ({pendingSyncCount})
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Chrome Extension Card */}
      <div style={{ margin: '16px 0 14px', padding: '14px', background: '#F8FAFD', borderRadius: 10, border: '1px solid #E5EAF0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#087F71', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          <Puzzle size={13} color="#18B7A0" /> Chrome Extension
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#667085', lineHeight: 1.45 }}>
          Autofill company placement forms in 1 click with AI.
        </p>
        <a
          href={EXTENSION_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: '#18B7A0', color: '#FFFFFF',
            borderRadius: 6, padding: '7px 10px',
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(24, 183, 160, 0.25)',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#22C7AE'}
          onMouseLeave={e => e.currentTarget.style.background = '#18B7A0'}
        >
          Download Extension
        </a>
      </div>

      {/* Sidebar Footer / User Profile */}
      <div style={{ borderTop: '1px solid #E5EAF0', paddingTop: 16 }}>
        <div style={{ padding: '0 6px 12px 6px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A', lineHeight: 1.2 }}>
            {user?.name || 'Student'}
          </div>
          <div style={{ fontSize: 12, color: '#667085', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || 'student@opptrack.io'}
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            background: '#FFFFFF',
            border: '1px solid #E5EAF0',
            borderRadius: 6,
            color: '#DC3545',
            padding: '7px 12px',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEF0F0';
            e.currentTarget.style.borderColor = '#FCA5A5';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = '#E5EAF0';
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* ── UPCOMING MILESTONE REMINDERS MODAL ── */}
      {showRemindersModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 31, 58, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowRemindersModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(11, 31, 58, 0.2)',
              border: '1px solid #E5EAF0',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #E5EAF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EAF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <Bell size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1F3A' }}>
                    Milestone Reminders & Tests
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#667085' }}>
                    {upcomingReminders.length} upcoming tests, drives, and deadlines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRemindersModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#667085', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ padding: '10px 22px', background: '#F8FAFD', borderBottom: '1px solid #E5EAF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={handleQuickTestNotification}
                disabled={testingNotification}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #BFDBFE',
                  color: '#2563EB',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Send size={12} /> {testingNotification ? 'Dispatching…' : 'Send Test Notification'}
              </button>

              <Link
                to="/settings"
                onClick={() => setShowRemindersModal(false)}
                style={{ fontSize: 12, fontWeight: 600, color: '#087F71', textDecoration: 'none' }}
              >
                Reminder Settings →
              </Link>
            </div>

            {/* Reminders List */}
            <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingReminders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#667085' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <strong style={{ display: 'block', fontSize: 14, color: '#0B1F3A', marginBottom: 4 }}>
                    No upcoming tests or deadlines due!
                  </strong>
                  <p style={{ margin: 0, fontSize: 12 }}>
                    When new online assessments or campus drives are extracted from your emails, automatic alerts will appear here.
                  </p>
                </div>
              ) : (
                upcomingReminders.map(rem => (
                  <div
                    key={rem.id}
                    style={{
                      background: rem.isUrgent ? '#FFFBEB' : '#FFFFFF',
                      border: `1px solid ${rem.isUrgent ? '#FDE68A' : '#E5EAF0'}`,
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 18 }}>{rem.icon}</span>
                        <div>
                          <strong style={{ fontSize: 13, color: '#0B1F3A' }}>{rem.company}</strong>
                          <span style={{ fontSize: 12, color: '#667085', marginLeft: 6 }}>— {rem.role}</span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: rem.isUrgent ? '#FEF0F0' : '#EAF2FF',
                          color: rem.isUrgent ? '#DC2626' : '#2563EB',
                          border: `1px solid ${rem.isUrgent ? '#FCA5A5' : '#BFDBFE'}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rem.hoursLeft > 0 ? `In ${rem.hoursLeft}h` : 'Due today'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569', marginTop: 2 }}>
                      <div>
                        <strong>{rem.milestoneLabel}: </strong>
                        <span>{new Date(rem.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      {rem.package && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#087F71' }}>
                          {rem.package}
                        </span>
                      )}
                    </div>

                    {rem.shortlistInfo && (
                      <div style={{ fontSize: 11, color: '#B45309', background: '#FEF3C7', padding: '4px 8px', borderRadius: 4, marginTop: 4 }}>
                        Update: {rem.shortlistInfo}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <Link
                        to={`/opportunities/${rem.opportunityId}`}
                        onClick={() => setShowRemindersModal(false)}
                        style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}
                      >
                        View Opportunity Details →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
