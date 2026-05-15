import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gram_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gram_token');
      localStorage.removeItem('gram_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const chatAPI = {
  sendMessage: (data) => api.post('/api/chat/message', data),
  getHistory: (sessionId) => api.get(`/api/chat/history/${sessionId}`),
  clearHistory: (sessionId) => api.delete(`/api/chat/history/${sessionId}`),
};

export const cropAPI = {
  uploadImage: (formData) => api.post('/api/crop/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  getReports: () => api.get('/api/crop/reports'),
};

export const voiceAPI = {
  transcribe: (formData) => api.post('/api/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }),
  synthesize: (data) => api.post('/api/voice/synthesize', data, {
    responseType: 'blob',
  }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getAgentStats: () => api.get('/api/analytics/agents'),
  getTimeSeries: (range) => api.get(`/api/analytics/timeseries?range=${range}`),
};

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  signup: (data) => api.post('/api/auth/signup', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};

export default api;
