import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opptrack_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url && (
      err.config.url.includes('/auth/login') ||
      err.config.url.includes('/auth/register') ||
      err.config.url.includes('/auth/forgot-password') ||
      err.config.url.includes('/auth/reset-password')
    );

    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('opptrack_token');
      localStorage.removeItem('opptrack_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
