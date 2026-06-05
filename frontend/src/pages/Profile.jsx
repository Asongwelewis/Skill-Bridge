import React, { useEffect, useState } from 'react'
import { Edit3, Save, X, TrendingUp, Award, Video, Zap, Star, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../lib/api'
import BadgeCard from '../components/BadgeCard'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'
import toast from 'react-hot-toast'

const MOCK_BADGES = [
  { name: 'First Session', tier: 'bronze', earnedAt: '2025-01-15' },
  { name: 'Quick Learner', tier: 'silver', earnedAt: '2025-02-03' },
  { name: 'Quiz Master', tier: 'gold', earnedAt: '2025-03-10' },
  { name: 'Peer Helper', tier: 'emerald', earnedAt: '2025-04-22' },
]

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ bio: '', full_name: '', location: '', avatar_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [badgesRef, badgesVisible, stagger] = useStaggerAnimation(4)

  useEffect(() => {
    if (!user) return
    userApi.getProfile(user.id)
      .then(res => {
        const p = res.data?.user || res.data
        setProfile(p)
        setForm({
          bio: p?.bio || user?.user_metadata?.bio || '',
          full_name: p?.full_name || user?.user_metadata?.full_name || '',
          location: p?.location || '',
          avatar_url: p?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
        })
      })
      .catch(() => {
        const meta = user.user_metadata || {}
        setProfile({ ...meta, email: user.email, id: user.id })
        setForm({
          bio: meta.bio || '',
          full_name: meta.full_name || '',
          location: meta.location || '',
          avatar_url: meta.avatar_url || meta.picture || '',
        })
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Send the avatar_url (and the rest) explicitly, then trust the row the
      // backend writes back so the saved value (incl. avatar_url) is authoritative.
      const res = await userApi.updateProfile(user.id, {
        full_name: form.full_name,
        bio: form.bio,
        location: form.location,
        avatar_url: form.avatar_url,
      })
      const saved = res?.data?.user || res?.data || {}
      setProfile(p => ({ ...p, ...saved }))
      setForm(f => ({
        ...f,
        bio: saved.bio ?? f.bio,
        full_name: saved.full_name ?? f.full_name,
        avatar_url: saved.avatar_url ?? f.avatar_url,
      }))
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const xp = profile?.xp || user?.user_metadata?.xp || 0
  const level = Math.floor(xp / 100) + 1
  const xpProgress = xp % 100
  const badges = profile?.badges || MOCK_BADGES
  const sessionsCount = profile?.sessionsCount || 0
  const name = form.full_name || user?.email?.split('@')[0] || 'Learner'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  // Prefer the form value so the avatar previews live while editing the URL.
  const avatarUrl = form.avatar_url || profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'var(--input-text)',
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="space-y-4">
          <div className="h-52 rounded-3xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-56 rounded-2xl skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] mb-6">
        <section className="glass-panel card-3d p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-10 h-52 w-52 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.22) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-8 h-40 w-40 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)', animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            <div className="glass-chip inline-flex mb-4">
              <Camera size={13} />
              Profile workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">My profile</h1>
            <p className="max-w-xl text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
              Keep your identity, progress, and achievements in one polished card instead of a stack of plain panels.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            {[
              { icon: TrendingUp, label: 'XP', value: xp, color: '#818CF8', bg: 'rgba(79,70,229,0.12)' },
              { icon: Star, label: 'Level', value: level, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
              { icon: Award, label: 'Badges', value: badges.length, color: '#c084fc', bg: 'rgba(168,85,247,0.12)' },
              { icon: Video, label: 'Sessions', value: sessionsCount, color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
            ].map(({ icon: Icon, label, value, color, bg }, i) => (
              <div
                key={label}
                className="rounded-[1.35rem] border border-white/10 bg-white/8 backdrop-blur-lg p-4 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-[1rem_1.25rem_1rem_1.25rem] flex items-center justify-center mb-2" style={{ background: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel card-3d p-6 md:p-7">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--text-subtle)' }}>Identity</p>
              <h2 className="text-xl font-semibold mt-1">{name}</h2>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="workspace-button text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="workspace-button text-sm"
                  style={{ background: 'rgba(79,70,229,0.22)', borderColor: 'rgba(129,140,248,0.25)' }}
                >
                  <Save size={13} />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="workspace-button text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <Edit3 size={13} /> Edit Profile
              </button>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/8 backdrop-blur-lg p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-[1.3rem_1.8rem_1.3rem_1.8rem] object-cover border-4 border-white/15 shadow-2xl shadow-indigo-500/25"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-[1.3rem_1.8rem_1.3rem_1.8rem] bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white/15 shadow-2xl shadow-indigo-500/25">
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => setEditing(true)}
                    title="Change profile picture"
                    aria-label="Change profile picture"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)', color: 'var(--text-muted)' }}
                  >
                    <Camera size={13} />
                  </button>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>Profile status</p>
                  <p className="text-lg font-semibold mt-1">Level {level} learner</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Profile picture URL</label>
                    <input
                      value={form.avatar_url}
                      onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-2.5 rounded-[1rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                      style={inputStyle}
                    />
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-subtle)' }}>Paste an image link — the preview updates above.</p>
                  </div>
                  {[
                    { label: 'Display Name', key: 'full_name', placeholder: 'Your name' },
                    { label: 'Location', key: 'location', placeholder: 'e.g. New York, USA' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                      <input
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 rounded-[1rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      placeholder="Tell peers about yourself…"
                      className="w-full px-4 py-2.5 rounded-[1rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {form.location && (
                    <p className="text-xs mb-3" style={{ color: 'var(--text-subtle)' }}>📍 {form.location}</p>
                  )}
                  {form.bio ? (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{form.bio}</p>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--text-subtle)' }}>
                      No bio yet — click Edit Profile to add one
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="glass-panel card-3d p-5 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>Progress</p>
            <h3 className="font-semibold mt-1">XP journey</h3>
          </div>
          <Zap size={20} className="text-indigo-300" />
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${xpProgress}%`,
              background: 'linear-gradient(90deg, #4F46E5, #10B981)',
              boxShadow: '0 0 10px rgba(79,70,229,0.5)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
          <span>Level {level}</span>
          <span>Level {level + 1}</span>
        </div>
      </div>

      <div className="glass-panel card-3d p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>Rewards</p>
            <h3 className="font-semibold mt-1">Badges earned</h3>
          </div>
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
