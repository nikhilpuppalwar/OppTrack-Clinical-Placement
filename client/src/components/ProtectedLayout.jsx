import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { settingsAPI } from '../api';
import { sendDesktopNotification } from '../utils/notifications';
import toast from 'react-hot-toast';

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  // Background reminder checker for tests, deadlines, campus drives & interviews
  useEffect(() => {
    if (!user) return;

    const checkUpcomingReminders = async () => {
      try {
        const { data } = await settingsAPI.getUpcomingReminders();
        const reminders = data?.reminders || [];
        if (reminders.length === 0) return;

        // Check urgent reminders (<= 24 hours)
        for (const rem of reminders) {
          if (rem.hoursLeft <= 24 && rem.hoursLeft >= -2) {
            const key = `opptrack_reminded_${rem.id}`;
            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, 'true');

              // Trigger native browser notification if enabled
              sendDesktopNotification({
                title: `${rem.icon} ${rem.milestoneLabel}: ${rem.company}`,
                body: `${rem.role} — ${rem.hoursLeft > 0 ? `In ${rem.hoursLeft} hours` : 'Due now!'}`,
                url: `/opportunities/${rem.opportunityId}`,
              });

              // Also trigger in-app toast
              toast(
                (t) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{rem.icon}</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: 13, color: '#0B1F3A' }}>
                        {rem.milestoneLabel}: {rem.company}
                      </strong>
                      <span style={{ fontSize: 12, color: '#667085' }}>
                        {rem.role} • {rem.hoursLeft > 0 ? `In ${rem.hoursLeft} hours` : 'Due today'}
                      </span>
                    </div>
                  </div>
                ),
                { duration: 7000 }
              );
            }
          }
        }
      } catch (err) {
        // Silent fail in background polling
      }
    };

    // Run once on login/mount
    checkUpcomingReminders();

    // Check every 3 minutes
    const timer = setInterval(checkUpcomingReminders, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, [user]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
