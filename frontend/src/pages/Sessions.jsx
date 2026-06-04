import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Video, Clock, CheckCircle, Calendar, ArrowRight, Search, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sessionApi } from '../lib/api'
import Avatar from '../components/Avatar'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'

const STATUS_CFG = {
  scheduled: { label: 'Upcoming', textColor: '#818CF8', bg: 'rgba(79,70,229,0.12)', border: 'rgba(79,70,229,0.3)', Icon: Clock },
  live: { label: 'Live Now', textColor: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Video },
  completed: { label: 'Completed', textColor: 'var(--text-subtle)', bg: 'var(--surface-3)', border: 'var(--border)', Icon: CheckCircle },
  cancelled: { label: 'Cancelled', textColor: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', Icon: Clock },
}

export default function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [listRef, listVisible, stagger] = useStaggerAnimation(8)

  useEffect(() => {
    if (!user) return
    sessionApi.getMySessions()
      .then(res => {
        const raw = res.data?.sessions || res.data || []
        const normalized = raw.map(s => {
          const match = Array.isArray(s.matches) ? s.matches[0] : s.matches
          const peer = match
            ? (match.teacher_id === user.id ? match.learner : match.teacher)
            : null
          return {
            id: s.id,
            status: s.status || 'scheduled',
            topic: match?.skills?.name || s.skill_topic || s.topic || 'Learning Session',
            scheduledAt: s.scheduled_at || s.scheduledAt,
            duration: s.duration_seconds ? Math.floor(s.duration_seconds / 60) : null,
            webrtcRoomId: s.webrtc_room_id,
            peerName: peer?.full_name || peer?.username || null,
            peerAvatar: peer?.avatar_url || null,
          }
        })
        setSessions(normalized)
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = sessions.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter
    const matchSearch = !search || (s.topic || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const upcoming = sessions.filter(s => s.status === 'scheduled' || s.status === 'live')
  const completed = sessions.filter(s => s.status === 'completed')

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] mb-6">
        <section className="glass-panel card-3d p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 right-0 h-56 w-56 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-12 h-40 w-40 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.16) 0%, transparent 70%)', animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            <div className="glass-chip inline-flex mb-4">
              <Sparkles size={13} />
              Session workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">Sessions</h1>
            <p className="max-w-xl text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
              Manage upcoming calls, revisit completed sessions, and keep your learning rhythm easy to scan.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'Upcoming', value: upcoming.length },
                { label: 'Completed', value: completed.length },
                { label: 'Total', value: sessions.length },
              ].map(item => (
                <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-white/8 backdrop-blur-lg px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>{item.label}</p>
                  <p className="text-xl font-semibold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel card-3d p-6 md:p-7">
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--text-subtle)' }}>Overview</p>
          <div className="mt-4 space-y-3">
            <InfoRow title="Next step" value="Accept a match to schedule" />
            <InfoRow title="Search hint" value="Use the topic name to filter sessions" />
            <InfoRow title="Live sessions" value={`${sessions.filter(s => s.status === 'live').length} running now`} />
          </div>
        </section>
      </div>

      <div className="glass-panel card-3d p-4 md:p-5 mb-6">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions…"
              className="w-full pl-10 pr-4 py-3 rounded-[1.2rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--input-text)' }}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'scheduled', 'live', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="workspace-button text-xs"
                style={{
                  background: filter === f ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.08)',
                  borderColor: filter === f ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.12)',
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel card-3d text-center py-20">
          <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-500/12 flex items-center justify-center mx-auto mb-4 animate-float">
            <Video size={28} className="text-indigo-300" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No sessions found</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {sessions.length === 0
              ? 'Accept a match to schedule your first session'
              : 'Try adjusting your search or filter'}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-3">
          {filtered.map((session, i) => {
            const cfg = STATUS_CFG[session.status] || STATUS_CFG.scheduled
            const StatusIcon = cfg.Icon
            const isLive = session.status === 'live'
            return (
              <div key={session.id || i} className={`reveal ${listVisible ? 'visible' : ''} ${stagger(i)}`}>
                <Link
                  to={`/session/${session.id}`}
                  className="glass-panel card-3d flex items-center gap-4 p-5 transition-all duration-200 group"
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(129,140,248,0.35)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {session.peerName || session.peerAvatar ? (
                    <Avatar
                      src={session.peerAvatar}
                      name={session.peerName || 'Peer Learner'}
                      size={44}
                      shape="1rem 1.25rem 1rem 1.25rem"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-[1rem_1.25rem_1rem_1.25rem] flex items-center justify-center shrink-0"
                      style={{ background: isLive ? 'rgba(16,185,129,0.16)' : 'rgba(79,70,229,0.14)' }}>
                      <StatusIcon size={18} style={{ color: isLive ? '#34d399' : '#818CF8' }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold truncate">{session.topic}</p>
                      {isLive && (
                        <span
                          className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-subtle)' }}>
                      {session.peerName && (
                        <span className="truncate">with {session.peerName}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled'}
                      </span>
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {session.duration} min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-lg border"
                      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.textColor }}
                    >
                      {cfg.label}
                    </span>
                    <ArrowRight size={15} className="transition-all group-hover:translate-x-1" style={{ color: 'var(--text-subtle)' }} />
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InfoRow({ title, value }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/8 backdrop-blur-lg px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-subtle)' }}>{title}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  )
}
