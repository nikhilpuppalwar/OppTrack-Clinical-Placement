/**
 * notifications.js
 * Native Web Notification API helper for desktop & browser reminders.
 */

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Notification permission error:', err);
    return 'denied';
  }
};

export const sendDesktopNotification = ({ title, body, icon = '/favicon.ico', tag, url }) => {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const options = {
      body: body || '',
      icon: icon,
      badge: icon,
      tag: tag || `opptrack-reminder-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
    };

    const notification = new Notification(title || 'OppTrack Reminder', options);

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      if (url) {
        window.location.href = url;
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Native notification failed, falling back to in-app:', err);
    return false;
  }
};
