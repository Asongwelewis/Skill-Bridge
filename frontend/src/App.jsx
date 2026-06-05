import React from 'react'
import {
  BrowserRouter, Routes, Route, Navigate, useLocation,
} from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ReactLenis } from 'lenis/react'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'

import Landing  from './pages/Landing'
import Login    from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Skills   from './pages/Skills'
import Matches  from './pages/Matches'
import Sessions from './pages/Sessions'
import Session  from './pages/Session'
import Quiz     from './pages/Quiz'
import Profile  from './pages/Profile'

// Layout-group routes share one key so the sidebar never unmounts mid-transition.
// Standalone routes each get their own key to trigger the full wipe.
const LAYOUT_PATHS = ['/dashboard', '/skills', '/matches', '/sessions', '/profile']

function AppRoutes() {
  const location = useLocation()
  const isLayoutRoute = LAYOUT_PATHS.some(p => location.pathname.startsWith(p))
  const transitionKey = isLayoutRoute ? '__layout__' : location.pathname

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={transitionKey}>
        {/* Public standalone — full wipe */}
        <Route path="/"        element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login"   element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        {/* Full-screen protected — full wipe */}
        <Route
          path="/session/:id"
          element={
            <ProtectedRoute>
              <PageTransition><Session /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:sessionId"
          element={
            <ProtectedRoute>
              <PageTransition><Quiz /></PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Sidebar layout — inner transitions handled by Layout's Outlet */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/skills"    element={<Skills />} />
          <Route path="/matches"   element={<Matches />} />
          <Route path="/sessions"  element={<Sessions />} />
          <Route path="/profile"   element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

// AppInner lives inside BrowserRouter so useLocation works in AppRoutes.
// ReactLenis root gives buttery smooth scroll to the whole page.
function AppInner() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <ReactLenis
      root
      options={{
        lerp: prefersReducedMotion ? 1 : 0.08,
        duration: prefersReducedMotion ? 0 : 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
        smoothWheel: true,
      }}
    >
      <AppRoutes />
      <Toaster position="top-right" />
    </ReactLenis>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
