import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Users, Video, Award, ArrowRight, Clock, TrendingUp, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { matchingApi, sessionApi, notificationApi } from '../lib/api'
import StatCard from '../components/StatCard'
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
          notificationApi.getAll(),   // ← no userId param
        ])
        if (m.status === 'fulfilled') setMatches(m.value.data?.matches || m.value.data || [])
        if (s.status === 'fulfilled') setSessions(s.value.data?.sessions || s.value.data || [])
        if (n.status === 'fulfilled') setNotifications(n.value.data?.notifications || n.value.data || [])
      } finally { setLoading(false) }
    }
    load()
  }, [user])

  const xp            = user?.user_metadata?.xp || 0
  const level         = Math.floor(xp / 100) + 1
  const xpProgress    = xp % 100
  const pendingMatches    = matches.filter(m => m.status === 'pending')
  const upcomingSessions  = sessions.filter(s => s.status === 'scheduled' || s.status === 'live')
  const userName      = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'
  const unreadNotifs  = notifications.filter(n => !n.read)

  const quickActions = [
    { to: '/skills',   icon: Zap,   label: 'Add Skills',   desc: 'Tell us what you know',           color: 'indigo'  },
    { to: '/matches',  icon: Users,  label: 'View Matches', desc: `${pendingMatches.length} pending`, color: 'purple'  },
    { to: '/sessions', icon: Video,  label: 'Sessions',     desc: `${upcomingSessions.length} upcoming`, color: 'emerald'},
    { to: '/profile',  icon: Award,  label: 'My Badges',   desc: 'View achievements',               color: 'amber'   },
  ]

  const actionColors = {
    indigo:  { border: 'rgba(79,70,229,0.25)',  bg: 'rgba(79,70,229,0.06)',  icon: '#818CF8' },
    purple:  { border: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.06)', icon: '#C084FC' },
    emerald: { border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.06)', icon: '#34D399' },
    amber:   { border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.06)', icon: '#FCD34D' },
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>

      {/* Header */}
      <div className="mb-8 animate-slide-down">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Good morning, <span className="text-indigo-400">{userName}</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Here's what's happening with your learning today
            </p>
          </div>
          {unreadNotifs.length > 0 && (
            <div className="relative mt-1">
              <Bell size={20} style={{ color: 'var(--text-muted)' }} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full text-white text-xs flex items-center justify-center">
                {unreadNotifs.length}
              </span>
            </div>
          )}
        </div>

        {/* XP bar */}
        <div className="mt-6 p-5 rounded-2xl animate-slide-up delay-100"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, var(--surface) 100%)', border: '1px solid rgba(79,70,229,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.2)' }}>
                <TrendingUp size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Level {level} Learner</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {xp} XP total · {100 - xpProgress} XP to next level
                </p>
              </div>
            </div>
            <span className="text-indigo-400 font-bold text-lg">{xp} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg, #4F46E5, #10B981)', boxShadow: '0 0 8px rgba(79,70,229,0.5)' }} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)
          : [
              { icon: Zap,   label: 'Total XP', value: xp,              color: 'indigo'  },
              { icon: Users, label: 'Matches',  value: matches.length,  color: 'purple'  },
              { icon: Video, label: 'Sessions', value: sessions.length, color: 'emerald' },
              { icon: Award, label: 'Badges',   value: user?.user_metadata?.badges?.length || 0, color: 'amber' },
            ].map(({ icon, label, value, color }, i) => (
              <div key={label} className={`reveal ${statsVisible ? 'visible' : ''} ${staggerDelay(i)}`}>
                <StatCard icon={icon} label={label} value={value} color={color} />
              </div>
            ))
        }
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 animate-fade-in delay-200">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ to, icon: Icon, label, desc, color }, i) => {
            const c = actionColors[color]
            return (
              <Link key={to} to={to}
                className="p-5 rounded-2xl transition-all duration-200 group hover-lift animate-slide-up"
                style={{ animationDelay: `${200 + i * 80}ms`, background: 'var(--surface)', border: `1px solid ${c.border}`, boxShadow: 'var(--card-shadow)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: c.bg }}>
                  <Icon size={18} style={{ color: c.icon }} />
                </div>
                <p className="font-semibold text-sm mb-0.5">{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                <ArrowRight size={14} className="mt-3 transition-all duration-200 group-hover:translate-x-1" style={{ color: 'var(--text-subtle)' }} />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5 animate-slide-left delay-300"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Matches</h3>
            <Link to="/matches" className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading
            ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-12 rounded-xl skeleton" />)}</div>
            : matches.length === 0
              ? <EmptyState icon={Users} msg="No matches yet" hint="Add skills to get matched →" to="/skills" />
              : <div className="space-y-1">
                  {matches.slice(0, 4).map((m, i) => (
                    <div key={m.id || i}
                      className="flex items-center justify-between p-3 rounded-xl transition-all duration-150"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                          {(m.teacher?.username || m.learner?.username || 'P')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.teacher?.username || m.learner?.username || 'Peer Learner'}</p>
                          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{m.skill_name || 'Skill exchange'}</p>
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
          }
        </div>

        <div className="rounded-2xl p-5 animate-slide-right delay-300"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upcoming Sessions</h3>
            <Link to="/sessions" className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading
            ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-12 rounded-xl skeleton" />)}</div>
            : upcomingSessions.length === 0
              ? <EmptyState icon={Clock} msg="No upcoming sessions" hint="Accept a match to schedule →" to="/matches" />
              : <div className="space-y-1">
                  {upcomingSessions.slice(0, 4).map((s, i) => (
                    <Link key={s.id || i} to={`/session/${s.id}`}
                      className="flex items-center justify-between p-3 rounded-xl transition-all duration-150 group"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                          <Video size={14} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.skill_topic || s.topic || 'Learning Session'}</p>
                          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                            {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString() : 'Scheduled'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="transition-all group-hover:translate-x-1 group-hover:text-indigo-400" style={{ color: 'var(--text-subtle)' }} />
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
    accepted: 'bg-emerald-500/15 text-emerald-400',
    pending:  'bg-amber-500/15 text-amber-400',
    declined: 'bg-red-500/15 text-red-400',
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
      <Link to={to} className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">{hint}</Link>
    </div>
  )
}