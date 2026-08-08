import api from './axios';

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
};

// Documents
export const documentAPI = {
  list: () => api.get('/documents'),
  add: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Opportunities
export const opportunityAPI = {
  list: (params) => api.get('/opportunities', { params }),
  create: (data) => api.post('/opportunities', data),
  get: (id) => api.get(`/opportunities/${id}`),
  update: (id, data) => api.put(`/opportunities/${id}`, data),
  delete: (id) => api.delete(`/opportunities/${id}`),
  updateStatus: (id, newStatus) => api.patch(`/opportunities/${id}/status`, { newStatus }),
  extract: (rawText) => api.post('/opportunities/extract', { rawText }),
  aiUpdate: (id, rawText) => api.post(`/opportunities/${id}/ai-update`, { rawText }),
  stats: () => api.get('/opportunities/stats'),
};

// History
export const historyAPI = {
  list: (params) => api.get('/history', { params }),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  testEmail: (data) => api.post('/settings/test-email', data),
  testAiKey: (data) => api.post('/settings/test-ai', data),
  export: () => api.get('/settings/export', { responseType: 'blob' }),
};
