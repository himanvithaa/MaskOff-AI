import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('maskoff_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('maskoff_token');
        localStorage.removeItem('maskoff_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  completeOnboarding: (data) => api.post('/auth/onboarding', data),
};

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getProgress: () => api.get('/dashboard/progress'),
};

export const scenariosAPI = {
  getCategories: () => api.get('/scenarios/categories'),
  getScenarios: (params) => api.get('/scenarios', { params }),
  getScenario: (id) => api.get(`/scenarios/${id}`),
};

export const sessionsAPI = {
  createSession: (data) => api.post('/sessions', data),
  getSessions: () => api.get('/sessions'),
  getSession: (id) => api.get(`/sessions/${id}`),
  updateSessionInterviewer: (sessionId, data) => api.post(`/sessions/${sessionId}/interviewer`, data),
  sendMessage: (sessionId, data) => api.post(`/sessions/${sessionId}/messages`, data),
  completeSession: (sessionId, data) => api.post(`/sessions/${sessionId}/complete`, data),
};

export const audioAPI = {
  transcribe: (formData) => api.post('/audio/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const analysisAPI = {
  getAnalysis: (id) => api.get(`/analysis/${id}`),
  compareAttempts: (data) => api.post('/analysis/compare', data),
};

export const weaknessAPI = {
  getProfile: () => api.get('/weakness/profile'),
  getHistory: () => api.get('/weakness/history'),
};

export const recommendationsAPI = {
  getRecommendations: () => api.get('/recommendations'),
};

export const missionsAPI = {
  getMissions: () => api.get('/missions'),
  completeMission: (id, data) => api.post(`/missions/${id}/complete`, data),
};

export const mindspaceAPI = {
  getReflections: () => api.get('/mindspace/reflections'),
  createReflection: (data) => api.post('/mindspace/reflections', data),
  deleteReflection: (id) => api.delete(`/mindspace/reflections/${id}`),
  reframeStatement: (data) => api.post('/mindspace/reframe', data),
  recordExercise: (data) => api.post('/mindspace/exercises', data),
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  deleteData: () => api.delete('/profile/data'),
};

export const chatbotAPI = {
  sendMessage: (data) => api.post('/chatbot/message', data),
};

export default api;

