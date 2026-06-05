import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { userApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch the current user's profile into context. Exposed so pages (e.g. the
  // onboarding wizard) can refresh after they change profile data.
  const refreshProfile = useCallback(async () => {
    try {
      const res = await userApi.getMyProfile()
      const p = res.data?.user || res.data
      setProfile(p)
      return p
    } catch {
      setProfile(null)
      return null
    } finally {
      setProfileLoaded(true)
    }
  }, [])

  // Load the profile whenever the signed-in user changes, then run the existing
  // Google avatar/name sync against the freshly loaded profile.
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoaded(false)
      return
    }

    let cancelled = false

    const init = async () => {
      const current = await refreshProfile()
      if (cancelled || !current) return

      const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
      const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || null
      if (!googleAvatar && !fullName) return

      const shouldUpdateAvatar = googleAvatar && !current?.avatar_url
      const shouldUpdateName = fullName && !current?.full_name
      if (!shouldUpdateAvatar && !shouldUpdateName) return

      try {
        await userApi.updateProfile(user.id, {
          username: current?.username || user.email?.split('@')[0] || user.id,
          full_name: shouldUpdateName ? fullName : current?.full_name,
          bio: current?.bio || '',
          avatar_url: shouldUpdateAvatar ? googleAvatar : current?.avatar_url,
          timezone: current?.timezone || 'UTC',
        })
        if (!cancelled) refreshProfile()
      } catch {
        // best-effort sync; ignore failures
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [user, refreshProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setProfileLoaded(false)
  }

  // A user needs onboarding only once their profile has loaded and the flag is
  // explicitly false (avoids redirecting before the profile is known).
  const needsOnboarding = !!user && !!profile && profile.onboarded === false

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        profile,
        profileLoaded,
        needsOnboarding,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
