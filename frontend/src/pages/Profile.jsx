import React, { useEffect, useState } from 'react'
import { Edit3, Save, X, TrendingUp, Award, Video, Zap, Star, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../lib/api'
import BadgeCard from '../components/BadgeCard'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'
import toast from 'react-hot-toast'

const MOCK_BADGES = [
  { name: 'First Session', tier: 'bronze',  earnedAt: '2025-01-15' },
  { name: 'Quick Learner', tier: 'silver',  earnedAt: '2025-02-03' },
  { name: 'Quiz Master',   tier: 'gold',    earnedAt: '2025-03-10' },
  { name: 'Peer Helper',   tier: 'emerald', earnedAt: '2025-04-22' },
]

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({ bio: '', full_name: '', location: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [badgesRef, badgesVisible, stagger] = useStaggerAnimation(4)

  useEffect(() => {
    if (!user) return
    userApi.getProfile(user.id)
      .then(res => {
        const p = res.data?.user || res.data
        setProfile(p)
        setForm({ bio: p?.bio || user?.user_metadata?.bio || '', full_name: p?.full_name || user?.user_metadata?.full_name || '', location: p?.location || '' })
      })
      .catch(() => {
        const meta = user.user_metadata || {}
        setProfile({ ...meta, email: user.email, id: user.id })
        setForm({ bio: meta.bio || '', full_name: meta.full_name || '', location: meta.location || '' })
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await userApi.updateProfile(user.id, form)
      setProfile(p => ({ ...p, ...form }))
      setEditing(false)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to save profile') }
    finally { setSaving(false) }
  }

  const xp            = profile?.xp || user?.user_metadata?.xp || 0
  const level         = Math.floor(xp / 100) + 1
  const xpProgress    = xp % 100
  const badges        = profile?.badges || MOCK_BADGES
  const sessionsCount = profile?.sessionsCount || 0
  const name          = form.full_name || user?.email?.split('@')[0] || 'Learner'
  const initials      = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const inputStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--input-text)',
  }

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="h-52 rounded-3xl skeleton" />
        <div className="h-28 rounded-2xl skeleton" />
        <div className="h-56 rounded-2xl skeleton" />
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>

      <div className="mb-8 animate-slide-down">
        <h1 className="text-2xl font-bold mb-1">My Profile</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Manage your profile, view badges, and track your progress
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-3xl overflow-hidden mb-6 animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>

        {/* Cover */}
        <div className="h-28 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)' }}>
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }} />
          {/* Floating orbs */}
          <div className="absolute top-2 right-12 w-20 h-20 rounded-full animate-float"
            style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)', animationDelay: '0.5s' }} />
          <div className="absolute bottom-0 left-16 w-14 h-14 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)' }} />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center
                text-white text-2xl font-bold border-4 shadow-xl shadow-indigo-600/30"
                style={{ borderColor: 'var(--surface)' }}>
                {initials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center
                transition-all hover:scale-110"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <Camera size={13} />
              </button>
            </div>

            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <X size={13} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                    text-white text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60">
                  <Save size={13} />{saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <Edit3 size={13} /> Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              {[{ label: 'Display Name', key: 'full_name', placeholder: 'Your name' },
                { label: 'Location', key: 'location', placeholder: 'e.g. New York, USA' }].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    style={inputStyle} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3} placeholder="Tell peers about yourself…"
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none"
                  style={inputStyle} />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-1">{name}</h2>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              {form.location && <p className="text-xs mb-3" style={{ color: 'var(--text-subtle)' }}>📍 {form.location}</p>}
              {form.bio
                ? <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{form.bio}</p>
                : <p className="text-sm italic" style={{ color: 'var(--text-subtle)' }}>No bio yet — click Edit Profile to add one</p>}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: TrendingUp, label: 'Total XP',  value: xp,            color: '#818CF8', bg: 'rgba(79,70,229,0.1)' },
          { icon: Star,       label: 'Level',      value: level,         color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
          { icon: Award,      label: 'Badges',     value: badges.length, color: '#c084fc', bg: 'rgba(168,85,247,0.1)' },
          { icon: Video,      label: 'Sessions',   value: sessionsCount, color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <div key={label}
            className={`p-4 rounded-2xl flex flex-col items-center text-center animate-slide-up hover-lift`}
            style={{
              animationDelay: `${i * 80}ms`,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--card-shadow)',
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* XP Progress */}
      <div className="p-5 rounded-2xl mb-6 animate-slide-up delay-300"
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, var(--surface) 100%)',
          border: '1px solid rgba(79,70,229,0.2)',
        }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold">Level {level} — {100 - xpProgress} XP to Level {level + 1}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{xp} total XP earned</p>
          </div>
          <Zap size={20} className="text-indigo-400" />
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${xpProgress}%`,
              background: 'linear-gradient(90deg, #4F46E5, #10B981)',
              boxShadow: '0 0 10px rgba(79,70,229,0.5)',
            }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
          <span>Level {level}</span>
          <span>Level {level + 1}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-2xl p-5 animate-slide-up delay-400"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Badges Earned</h3>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{badges.length} total</span>
        </div>
        {badges.length === 0 ? (
          <div className="text-center py-8">
            <Award size={28} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No badges yet. Complete sessions and quizzes to earn them!
            </p>
          </div>
        ) : (
          <div ref={badgesRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((badge, i) => (
              <div key={i} className={`reveal ${badgesVisible ? 'visible' : ''} ${stagger(i)}`}>
                <BadgeCard badge={badge} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
