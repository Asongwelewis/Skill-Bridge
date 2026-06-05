import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Wraps the sidebar-layout routes. Once the profile has loaded, a user who has
// not completed onboarding is redirected to the wizard. While the first profile
// fetch is in flight we show the same loading spinner as ProtectedRoute to
// avoid a wrong-way redirect flash.
export default function OnboardingGate({ children }) {
  const { user, profileLoaded, needsOnboarding } = useAuth()
  const { isDark } = useTheme()

  if (user && !profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-transition"
        style={{ background: isDark ? '#09091a' : '#f3f4ff' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-600/20 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (needsOnboarding) return <Navigate to="/onboarding" replace />
  return children
}
