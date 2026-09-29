import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, gmailAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('opptrack_user');
    const token = localStorage.getItem('opptrack_token');
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // First session of the day check
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastDailySync = localStorage.getItem(`opptrack_last_daily_sync_${parsedUser._id}`);
      if (lastDailySync !== todayStr) {
        localStorage.setItem(`opptrack_last_daily_sync_${parsedUser._id}`, todayStr);
        // Silently sync in background on first visit of the day
        gmailAPI.sync().catch(() => {});
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('opptrack_token', data.token);
    localStorage.setItem('opptrack_user', JSON.stringify(data));
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`opptrack_last_daily_sync_${data._id}`, todayStr);
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('opptrack_token', data.token);
    localStorage.setItem('opptrack_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('opptrack_token');
    localStorage.removeItem('opptrack_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
