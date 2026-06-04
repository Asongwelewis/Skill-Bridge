import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { userApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (!user) return

    const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || null

    if (!googleAvatar && !fullName) return

    let cancelled = false

    const syncProfile = async () => {
      try {
        const res = await userApi.getMyProfile()
        const profile = res.data?.user || res.data
        const shouldUpdateAvatar = googleAvatar && !profile?.avatar_url
        const shouldUpdateName = fullName && !profile?.full_name

        if (!shouldUpdateAvatar && !shouldUpdateName) return

        await userApi.updateProfile(user.id, {
          username: profile?.username || user.email?.split('@')[0] || user.id,
          full_name: shouldUpdateName ? fullName : profile?.full_name,
          bio: profile?.bio || '',
          avatar_url: shouldUpdateAvatar ? googleAvatar : profile?.avatar_url,
          timezone: profile?.timezone || 'UTC',
        })
      } catch {
        if (!cancelled) return
      }
    }

    syncProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
