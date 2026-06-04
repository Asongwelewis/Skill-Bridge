import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

export default function Layout() {
  const { isDark } = useTheme()
  const location = useLocation()

  return (
    <div className="workspace-shell flex h-screen overflow-hidden theme-transition"
      style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 workspace-grid pointer-events-none" aria-hidden="true" />
      <Sidebar />

      <main
        key={location.pathname}
        className="relative z-10 flex-1 overflow-y-auto page-enter"
        style={{ background: 'transparent' }}
      >
        <Outlet />
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#1e1b4b' : '#ffffff',
            color: isDark ? '#e0e7ff' : '#0f172a',
            border: isDark ? '1px solid rgba(79,70,229,0.3)' : '1px solid rgba(79,70,229,0.15)',
            borderRadius: '14px',
            fontSize: '14px',
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 4px 24px rgba(79,70,229,0.12)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  )
}
