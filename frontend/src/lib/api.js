import axios from 'axios'
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://161.35.49.153:30080/api'

const api = axios.create({ baseURL: BASE })

// Auto-attach Supabase Bearer token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// ── User Service ──────────────────────────────────────────────
export const userApi = {
  getMyProfile:    ()         => api.get('/users/profiles/me'),
  getProfile:      (id)       => api.get(`/users/profiles/${id}`),
  updateProfile:   (data)     => api.put('/users/profiles/me', data),
  listProfiles:    ()         => api.get('/users/profiles'),

  getMySkills:     ()         => api.get('/users/skills/me'),
  listSkills:      ()         => api.get('/users/skills'),
  addMySkill:      (data)     => api.post('/users/skills/me', data),
  removeMySkill:   (id)       => api.delete(`/users/skills/me/${id}`),

  getMyBadges:     ()         => api.get('/users/badges/me'),
  listBadges:      ()         => api.get('/users/badges'),
  getUserBadges:   (userId)   => api.get(`/users/badges/${userId}`),
}

// ── Matching Service ──────────────────────────────────────────
export const matchingApi = {
  runMatching:     (userId)   => api.post(`/matching/run/${userId}`),
  getMyMatches:    (status)   => api.get('/matching/matches/me', { params: { status } }),
  getUserMatches:  (userId)   => api.get(`/matching/matches/${userId}`),
  updateMatch:     (id, status) => api.patch(`/matching/matches/${id}`, { status }),
}

// ── Session Service ───────────────────────────────────────────
export const sessionApi = {
  getMySessions:   (status)   => api.get('/sessions/me', { params: { status } }),
  getSession:      (id)       => api.get(`/sessions/${id}`),
  createSession:   (data)     => api.post('/sessions', data),
  startSession:    (id)       => api.patch(`/sessions/${id}/start`),
  endSession:      (id)       => api.patch(`/sessions/${id}/end`),
  cancelSession:   (id)       => api.delete(`/sessions/${id}`),
  search:          (query)    => api.get('/sessions/search', { params: { q: query } }),
}

// ── Quiz/Assessment Service ───────────────────────────────────
export const quizApi = {
  getQuizBySession: (sessionId) => api.get(`/quizzes/session/${sessionId}`),
  getQuiz:          (quizId)    => api.get(`/quizzes/${quizId}`),
  submitAttempt:    (quizId, answers) => api.post(`/quizzes/${quizId}/attempt`, { answers }),
  getMyResult:      (quizId)    => api.get(`/quizzes/${quizId}/result`),
}

// ── Notification Service ──────────────────────────────────────
export const notificationApi = {
  getAll:          ()         => api.get('/notifications'),
  markRead:        (id)       => api.patch(`/notifications/${id}/read`),
  markAllRead:     ()         => api.patch('/notifications/read-all'),
  getPrefs:        ()         => api.get('/notifications/prefs'),
  updatePrefs:     (data)     => api.put('/notifications/prefs', data),
  getCircuitStatus: ()        => api.get('/notifications/circuit-status'),
}

export default api