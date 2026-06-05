import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingGate from './components/OnboardingGate'
import Layout from './components/Layout'
import CustomCursor from './components/CustomCursor'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Skills from './pages/Skills'
import Matches from './pages/Matches'
import Sessions from './pages/Sessions'
import Session from './pages/Session'
import Quiz from './pages/Quiz'
import Profile from './pages/Profile'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <CustomCursor />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Full-screen protected onboarding (no sidebar, not gated) */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            {/* Full-screen protected (no sidebar) — intentionally not onboarding-gated */}
            <Route path="/session/:id" element={<ProtectedRoute><Session /></ProtectedRoute>} />
            <Route path="/quiz/:sessionId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />

            {/* Protected with sidebar layout — onboarding-gated */}
            <Route element={<ProtectedRoute><OnboardingGate><Layout /></OnboardingGate></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
