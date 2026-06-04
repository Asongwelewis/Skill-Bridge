import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Zap, Users, Video, User,
  LogOut, ChevronLeft, ChevronRight, Brain, Sun, Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/skills',    icon: Zap,             label: 'My Skills' },
  { to: '/matches',   icon: Users,           label: 'Matches' },
  { to: '/sessions',  icon: Video,           label: 'Sessions' },
  { to: '/profile',   icon: User,            label: 'Profile' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <aside
      className="glass-panel flex flex-col h-screen sticky top-0 shrink-0 theme-transition"
      style={{
        width: collapsed ? '84px' : '260px',
        margin: '12px 0 12px 12px',
        borderRadius: '28px',
        overflow: 'hidden',
        background: `linear-gradient(180deg, rgba(17,17,34,0.92) 0%, rgba(21,20,42,0.9) 100%)`,
        border: '1px solid var(--sidebar-border)',
        transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), margin 0.3s ease',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-10 h-10 rounded-[1rem_1.5rem_1rem_1.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
          <Brain size={17} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <span className="text-white font-bold text-lg tracking-tight block">SkillBridge</span>
            <span className="text-[11px] text-white/45">Workspace mode</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }, i) => (
          <NavLink
            key={to}
            to={to}
            style={{ animationDelay: `${i * 60}ms` }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-[1rem_1.5rem_1rem_1.5rem] text-sm font-medium
               transition-all duration-200 group relative overflow-hidden animate-slide-left
               ${isActive
                 ? 'bg-white/12 text-white shadow-lg shadow-indigo-900/30 border border-white/10'
                 : 'text-[rgba(255,255,255,0.58)] hover:text-white hover:bg-[rgba(255,255,255,0.07)] border border-transparent'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active glow blob */}
                {isActive && (
                  <span className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-xl pointer-events-none" />
                )}
                <Icon
                  size={17}
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive ? '' : 'group-hover:scale-110'
                  }`}
                />
                {!collapsed && (
                  <span className="relative z-10">{label}</span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    text-white bg-gray-900 border border-white/10 whitespace-nowrap
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* User chip */}
        {!collapsed && user && (
          <div className="glass-chip mb-1 justify-between">
            <p className="text-white text-xs font-semibold truncate leading-tight">{user.email}</p>
            <p className="text-indigo-300/70 text-xs mt-0.5">Learner</p>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 workspace-button text-sm font-medium
            text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-[rgba(255,255,255,0.07)]
            transition-all duration-200 group relative"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="shrink-0 transition-transform duration-300 group-hover:rotate-12">
            {isDark
              ? <Sun size={17} className="text-amber-300" />
              : <Moon size={17} className="text-indigo-300" />
            }
          </span>
          {!collapsed && (
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
              text-white bg-gray-900 border border-white/10 whitespace-nowrap
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </div>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 workspace-button text-sm font-medium
            text-[rgba(255,255,255,0.45)] hover:text-red-400 hover:bg-red-500/10
            transition-all duration-200 group relative"
        >
          <LogOut size={17} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
          {!collapsed && <span>Sign Out</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
              text-white bg-gray-900 border border-white/10 whitespace-nowrap
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Sign Out
            </div>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-3 w-full px-3 py-2 workspace-button
            text-[rgba(255,255,255,0.3)] hover:text-white/60 hover:bg-white/5
            transition-all duration-200 text-xs"
        >
          <span className="shrink-0 transition-transform duration-300">
            {collapsed
              ? <ChevronRight size={15} />
              : <ChevronLeft size={15} />
            }
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
