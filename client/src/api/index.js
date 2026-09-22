import api from './axios';

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  createField: (data) => api.post('/profile/field', data),
  updateField: (fieldId, data) => api.put(`/profile/field/${fieldId}`, data),
  deleteField: (fieldId) => api.delete(`/profile/field/${fieldId}`),
  restoreDefaults: () => api.post('/profile/restore-defaults'),
  getPendingSyncs: () => api.get('/profile/pending-syncs'),
  verifySync: (id, data) => api.post(`/profile/verify-sync/${id}`, data),
  rejectSync: (id) => api.post(`/profile/reject-sync/${id}`),
  analyzeText: (data) => api.post('/profile/analyze-text', data),
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

// Form History (Chrome Extension Activity — Feature 5)
export const formHistoryAPI = {
  list:   (params) => api.get('/form-history', { params }),
  create: (data)   => api.post('/form-history', data),
  logSensitiveReveal: (data) => api.post('/form-history/sensitive-reveal', data),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  testEmail: (data) => api.post('/settings/test-email', data),
  testAiKey: (data) => api.post('/settings/test-ai', data),
  testNotification: (data) => api.post('/settings/test-notification', data),
  getUpcomingReminders: () => api.get('/settings/upcoming-reminders'),
  export: () => api.get('/settings/export', { responseType: 'blob' }),
  exportCsv: () => api.get('/settings/export-csv', { responseType: 'blob' }),
  importBackup: (data) => api.post('/settings/import-backup', data),
};

// Google OAuth & Status
export const googleAPI = {
  getAuthUrl: () => api.get('/google/auth-url'),
  getStatus: () => api.get('/google/status'),
  status: () => api.get('/google/status'),
  disconnect: () => api.post('/google/disconnect'),
  updateSettings: (data) => api.patch('/google/settings', data),
};

// Gmail Auto-Fetch & Review Queue
export const gmailAPI = {
  getSenders: () => api.get('/gmail/senders'),
  addSender: (data) => api.post('/gmail/senders', data),
  deleteSender: (id) => api.delete(`/gmail/senders/${id}`),
  sync: (data) => api.post('/gmail/sync', data),
  getPending: () => api.get('/gmail/pending-review'),
  getAutoUpdates: () => api.get('/gmail/auto-updates'),
  reExtractPending: (id) => api.post(`/gmail/pending-review/${id}/re-extract`),
  confirmPending: (id, data) => api.post(`/gmail/pending-review/${id}/confirm`, data),
  ignorePending: (id) => api.post(`/gmail/pending-review/${id}/ignore`),
};

// Google Calendar Sync
export const calendarAPI = {
  syncAll: () => api.post('/calendar/sync-all'),
};

// Google OAuth Tester Requests (100-User Cap)
export const testerAPI = {
  getStats: () => api.get('/tester-requests/stats'),
  create: (data) => api.post('/tester-requests', data),
  getMyStatus: (params) => api.get('/tester-requests/my-status', { params }),
  listAll: (params) => api.get('/tester-requests/all', { params }),
  updateStatus: (id, data) => api.patch(`/tester-requests/${id}/status`, data),
};

