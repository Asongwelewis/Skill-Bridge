import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Video, Clock, CheckCircle, Calendar, ArrowRight, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sessionApi } from '../lib/api'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'

const STATUS_CFG = {
  scheduled: { label: 'Upcoming',  textColor: '#818CF8', bg: 'rgba(79,70,229,0.12)',  border: 'rgba(79,70,229,0.3)',  Icon: Clock },
  live:      { label: 'Live Now',  textColor: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Video },
  completed: { label: 'Completed', textColor: 'var(--text-subtle)', bg: 'var(--surface-3)', border: 'var(--border)', Icon: CheckCircle },
  cancelled: { label: 'Cancelled', textColor: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)', Icon: Clock },
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
        // Normalize snake_case → camelCase for display
        const normalized = raw.map(s => ({
          id:          s.id,
          status:      s.status || 'scheduled',
          topic:       (Array.isArray(s.matches) ? s.matches[0] : s.matches)?.skills?.name
                       || s.skill_topic
                       || s.topic
                       || 'Learning Session',
          scheduledAt: s.scheduled_at || s.scheduledAt,
          duration:    s.duration_seconds ? Math.floor(s.duration_seconds / 60) : null,
          webrtcRoomId: s.webrtc_room_id,
        }))
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

  const upcoming  = sessions.filter(s => s.status === 'scheduled' || s.status === 'live')
  const completed = sessions.filter(s => s.status === 'completed')

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>
      <div className="mb-8 animate-slide-down">
        <h1 className="text-2xl font-bold mb-1">Sessions</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Manage your upcoming and past learning sessions
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 animate-slide-up delay-100">
        {[
          { label: 'Upcoming',  value: upcoming.length,  color: '#818CF8' },
          { label: 'Completed', value: completed.length, color: '#34d399' },
          { label: 'Total',     value: sessions.length,  color: 'var(--text)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-2xl text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6 flex-col sm:flex-row animate-fade-in delay-200">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'scheduled', 'live', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: filter === f ? '#4F46E5' : 'var(--surface)',
                color:      filter === f ? '#fff'    : 'var(--text-muted)',
                border:     filter === f ? '1px solid transparent' : '1px solid var(--border)',
                boxShadow:  filter === f ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/12 flex items-center justify-center mx-auto mb-4 animate-float">
            <Video size={28} className="text-indigo-400" />
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
                <Link to={`/session/${session.id}`}
                  className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 group"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(79,70,229,0.12)' }}>
                    <StatusIcon size={18} style={{ color: isLive ? '#34d399' : '#818CF8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold truncate">{session.topic}</p>
                      {isLive && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-subtle)' }}>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled'}
                      </span>
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />{session.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg border"
                      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.textColor }}>
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
