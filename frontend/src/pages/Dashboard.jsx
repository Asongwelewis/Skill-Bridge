import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Users, Video, Award, ArrowRight, Clock, TrendingUp, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { matchingApi, sessionApi, notificationApi } from '../lib/api'
import StatCard from '../components/StatCard'
import Avatar from '../components/Avatar'
import ReactiveGlass from '../components/ReactiveGlass'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'

export default function Dashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [sessions, setSessions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statsRef, statsVisible, staggerDelay] = useStaggerAnimation(4)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [m, s, n] = await Promise.allSettled([
          matchingApi.getMyMatches(),
          sessionApi.getMySessions(),
          notificationApi.getAll(),
        ])
        if (m.status === 'fulfilled') setMatches(m.value.data?.matches || m.value.data || [])
        if (s.status === 'fulfilled') setSessions(s.value.data?.sessions || s.value.data || [])
        if (n.status === 'fulfilled') setNotifications(n.value.data?.notifications || n.value.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const xp = user?.user_metadata?.xp || 0
  const level = Math.floor(xp / 100) + 1
  const xpProgress = xp % 100
  const pendingMatches = matches.filter(m => m.status === 'pending')
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' || s.status === 'live')
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
  const unreadNotifs = notifications.filter(n => !n.read)

  const peerOf = (m) => {
    const peer = m.teacher_id === user?.id ? m.learner : m.teacher
    return peer || m.teacher || m.learner || null
  }

  const quickActions = [
    { to: '/skills', icon: Zap, label: 'Add Skills', desc: 'Tell us what you know', color: 'indigo' },
    { to: '/matches', icon: Users, label: 'View Matches', desc: `${pendingMatches.length} pending`, color: 'purple' },
    { to: '/sessions', icon: Video, label: 'Sessions', desc: `${upcomingSessions.length} upcoming`, color: 'emerald' },
    { to: '/profile', icon: Award, label: 'My Badges', desc: 'View achievements', color: 'amber' },
  ]

  const actionColors = {
    indigo: { border: 'rgba(79,70,229,0.28)', bg: 'rgba(79,70,229,0.08)', icon: '#818CF8' },
    purple: { border: 'rgba(168,85,247,0.28)', bg: 'rgba(168,85,247,0.08)', icon: '#C084FC' },
    emerald: { border: 'rgba(16,185,129,0.28)', bg: 'rgba(16,185,129,0.08)', icon: '#34D399' },
    amber: { border: 'rgba(245,158,11,0.28)', bg: 'rgba(245,158,11,0.08)', icon: '#FCD34D' },
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr] mb-6">
        <ReactiveGlass as="section" className="card-3d p-6 md:p-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-12 h-64 w-64 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.25) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-24 -left-8 h-56 w-56 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', animationDelay: '1.1s' }} />
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <Avatar
                  src={userAvatar}
                  name={userName}
                  size={52}
                  shape="1.1rem 1.5rem 1.1rem 1.5rem"
                  className="mt-1 border-2 border-white/15 shadow-lg shadow-indigo-500/20"
                />
                <div>
                  <div className="glass-chip inline-flex items-center gap-2 mb-4">
                    <TrendingUp size={13} />
                    Workspace overview
                  </div>
                  <h1
                    className="mb-2"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.08,
                    }}
                  >
                    Good morning, <span className="text-indigo-400">{userName}</span>
                  </h1>
                  <p className="max-w-xl text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
                    Your matches, sessions, and learning momentum all live here in one calm workspace.
                  </p>
                </div>
              </div>

              {unreadNotifs.length > 0 && (
                <div className="glass-chip relative">
                  <Bell size={18} />
                  <span className="ml-2 text-sm font-medium">{unreadNotifs.length} new</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'XP', value: xp },
                { label: 'Level', value: level },
                { label: 'Matches', value: matches.length },
                { label: 'Sessions', value: sessions.length },
              ].map(item => (
                <div key={item.label} className="glass-chip flex-col items-start gap-1 py-4 px-4">
                  <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-subtle)' }}>{item.label}</span>
                  <span
                    className="text-2xl font-semibold"
                    style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                  >{item.value}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/skills" className="workspace-button justify-center">
                <Zap size={16} />
                Add skills
                <ArrowRight size={15} />
              </Link>
              <Link to="/matches" className="workspace-button justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Users size={16} />
                See matches
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </ReactiveGlass>

        <ReactiveGlass as="section" className="card-3d p-6 md:p-7">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
            <div className="absolute right-8 top-12 h-52 w-52 rounded-full blur-3xl animate-slow-float"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 68%)' }} />
          </div>

          <div className="relative z-10 h-full min-h-[320px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em]" style={{ color: 'var(--text-subtle)' }}>Momentum</p>
                <h2 className="text-xl font-semibold mt-1">Level {level} learner</h2>
              </div>
              <div className="glass-chip">
                {100 - xpProgress} XP to next level
              </div>
            </div>

            <div className="relative flex-1 rounded-[2rem] overflow-hidden border border-white/10"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))' }}>
              <div className="absolute inset-0 opacity-40"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="h-36 w-36 rounded-full border border-white/15 bg-white/8 backdrop-blur-xl animate-spin-slow shadow-2xl shadow-indigo-500/20" />
                  <div className="absolute inset-6 rounded-full border border-white/20 bg-gradient-to-br from-white/25 to-transparent backdrop-blur-md" />
                  <div className="absolute inset-10 rounded-full bg-gradient-to-br from-indigo-400/80 to-cyan-300/40 shadow-[0_0_40px_rgba(99,102,241,0.45)]" />
                </div>
              </div>
              <div className="absolute left-4 top-4 glass-chip">Scroll-reveal workspace</div>
              <div className="absolute right-4 bottom-4 glass-chip">3D motion effects</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Pending matches', value: pendingMatches.length },
                { label: 'Upcoming sessions', value: upcomingSessions.length },
                { label: 'Unread alerts', value: unreadNotifs.length },
              ].map(item => (
                <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-white/8 backdrop-blur-lg px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>{item.label}</p>
                  <p className="text-xl font-semibold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </ReactiveGlass>
      </div>

      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)
          : [
              { icon: Zap, label: 'Total XP', value: xp, color: 'indigo' },
              { icon: Users, label: 'Matches', value: matches.length, color: 'purple' },
              { icon: Video, label: 'Sessions', value: sessions.length, color: 'emerald' },
              { icon: Award, label: 'Badges', value: user?.user_metadata?.badges?.length || 0, color: 'amber' },
            ].map(({ icon, label, value, color }, i) => (
              <div key={label} className={`reveal ${statsVisible ? 'visible' : ''} ${staggerDelay(i)}`}>
                <StatCard icon={icon} label={label} value={value} color={color} />
              </div>
            ))}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>Jump straight into the next step</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ to, icon: Icon, label, desc, color }, i) => {
            const c = actionColors[color]
            return (
              <Link key={to} to={to}
                className="glass-panel card-3d p-5 rounded-[1.75rem] transition-all duration-200 group hover:-translate-y-1"
                style={{ animationDelay: `${200 + i * 80}ms` }}>
                <div className="w-11 h-11 rounded-[1rem_1.25rem_1rem_1.25rem] flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <Icon size={18} style={{ color: c.icon }} />
                </div>
                <p className="font-semibold text-sm mb-1">{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                <ArrowRight size={14} className="mt-4 transition-all duration-200 group-hover:translate-x-1" style={{ color: 'var(--text-subtle)' }} />
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-panel card-3d p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>Connections</p>
              <h3 className="font-semibold mt-1">Recent Matches</h3>
            </div>
            <Link to="/matches" className="glass-chip">
              View all
              <ArrowRight size={12} />
            </Link>
          </div>
          {loading
            ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-12 rounded-xl skeleton" />)}</div>
            : matches.length === 0
              ? <EmptyState icon={Users} msg="No matches yet" hint="Add skills to get matched →" to="/skills" />
              : <div className="space-y-2">
                  {matches.slice(0, 4).map((m, i) => {
                    const peer = peerOf(m)
                    const peerName = peer?.full_name || peer?.username || 'Peer Learner'
                    return (
                    <div key={m.id || i}
                      className="flex items-center justify-between p-3 rounded-[1.15rem] transition-all duration-150"
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={peer?.avatar_url}
                          name={peerName}
                          size={36}
                          shape="1rem 1.25rem 1rem 1.25rem"
                        />
                        <div>
                          <p className="text-sm font-medium">{peerName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{m.skills?.name || m.skill_name || 'Skill exchange'}</p>
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    )
                  })}
                </div>
          }
        </div>

        <div className="glass-panel card-3d p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>Sessions</p>
              <h3 className="font-semibold mt-1">Upcoming Sessions</h3>
            </div>
            <Link to="/sessions" className="glass-chip">
              View all
              <ArrowRight size={12} />
            </Link>
          </div>
          {loading
            ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-12 rounded-xl skeleton" />)}</div>
            : upcomingSessions.length === 0
              ? <EmptyState icon={Clock} msg="No upcoming sessions" hint="Accept a match to schedule →" to="/matches" />
              : <div className="space-y-2">
                  {upcomingSessions.slice(0, 4).map((s, i) => (
                    <Link key={s.id || i} to={`/session/${s.id}`}
                      className="flex items-center justify-between p-3 rounded-[1.15rem] transition-all duration-150 group"
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[1rem_1.25rem_1rem_1.25rem] bg-emerald-500/15 flex items-center justify-center">
                          <Video size={14} className="text-emerald-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{(Array.isArray(s.matches) ? s.matches[0] : s.matches)?.skills?.name || s.skill_topic || s.topic || 'Learning Session'}</p>
                          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                            {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString() : 'Scheduled'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="transition-all group-hover:translate-x-1 group-hover:text-indigo-300" style={{ color: 'var(--text-subtle)' }} />
                    </Link>
                  ))}
                </div>
          }
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    accepted: 'bg-emerald-500/15 text-emerald-300',
    pending: 'bg-amber-500/15 text-amber-300',
    declined: 'bg-red-500/15 text-red-300',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${cfg[status] || cfg.pending}`}>
      {status || 'pending'}
    </span>
  )
}

function EmptyState({ icon: Icon, msg, hint, to }) {
  return (
    <div className="text-center py-8">
      <Icon size={26} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{msg}</p>
      <Link to={to} className="text-indigo-300 text-xs hover:text-indigo-200 transition-colors">{hint}</Link>
    </div>
  )
}
