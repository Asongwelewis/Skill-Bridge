import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { isDark } = useTheme()

  if (loading) {
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

  if (!user) return <Navigate to="/login" replace />
  return children
}
