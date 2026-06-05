import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Brain } from 'lucide-react'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

export default function Layout() {
  const { isDark } = useTheme()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <div className="workspace-shell flex h-screen overflow-hidden theme-transition"
      style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 workspace-grid pointer-events-none" aria-hidden="true" />

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar (hidden on lg where the sidebar is always visible) */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 shrink-0 theme-transition"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-[0.9rem_1.1rem_0.9rem_1.1rem] flex items-center justify-center shrink-0"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text)' }}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[0.8rem_1rem_0.8rem_1rem] bg-indigo-600 flex items-center justify-center shrink-0">
              <Brain size={15} className="text-white" />
            </div>
            <span className="font-semibold tracking-tight" style={{ color: 'var(--text)' }}>SkillBridge</span>
          </div>
        </header>

        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto page-enter"
          style={{ background: 'transparent' }}
        >
          <Outlet />
        </main>
      </div>

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
