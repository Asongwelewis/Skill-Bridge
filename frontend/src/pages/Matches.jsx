import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, CheckCircle, XCircle, Clock, Video, Star, Zap, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { matchingApi, sessionApi } from '../lib/api'
import Avatar from '../components/Avatar'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'
import toast from 'react-hot-toast'

const STATUS_CFG = {
  pending: { label: 'Pending', textColor: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: Clock },
  accepted: { label: 'Accepted', textColor: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: CheckCircle },
  declined: { label: 'Declined', textColor: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', Icon: XCircle },
  completed: { label: 'Completed', textColor: '#818cf8', bg: 'rgba(79,70,229,0.12)', border: 'rgba(79,70,229,0.3)', Icon: CheckCircle },
}

export default function Matches() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [listRef, listVisible, stagger] = useStaggerAnimation(8)

  useEffect(() => {
    if (!user) return
    matchingApi.getMyMatches()
      .then(res => {
        const raw = res.data?.matches || res.data || []
        const normalized = raw.map(m => {
          const peer = m.teacher_id === user.id ? m.learner : m.teacher
          return {
            id: m.id,
            status: m.status || 'pending',
            skill: (Array.isArray(m.skills) ? m.skills[0] : m.skills)?.name || m.skill_name || m.skill || '',
            score: m.match_score || m.score || 0,
            matchedUser: {
              name: peer?.full_name || peer?.username
                || (m.teacher_id === user.id ? m.learner_id : m.teacher_id),
              avatar_url: peer?.avatar_url || null,
            },
          }
        })
        setMatches(normalized)
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [user])

  const handleAction = async (matchId, action) => {
    setActionLoading(matchId + action)
    try {
      await matchingApi.updateMatch(matchId, action)
      setMatches(m => m.map(x => x.id === matchId ? { ...x, status: action } : x))
      toast.success(action === 'accepted' ? 'Match accepted!' : 'Match declined.')
    } catch {
      toast.error('Failed to update match')
    } finally {
      setActionLoading(null)
    }
  }

  const startSession = async (match) => {
    try {
      const res = await sessionApi.createSession({ match_id: match.id })
      const sid = res.data?.id || res.data?.session?.id
      if (sid) navigate(`/session/${sid}`)
      else toast.error('Session created — check sessions page')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create session')
    }
  }

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter)
  const pendingCount = matches.filter(m => m.status === 'pending').length
  const acceptedCount = matches.filter(m => m.status === 'accepted').length

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] mb-6">
        <section className="glass-panel card-3d p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-10 h-52 w-52 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-8 h-36 w-36 rounded-full blur-3xl animate-float"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)', animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            <div className="glass-chip inline-flex mb-4">
              <Users size={13} />
              Match workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">Skill matches</h1>
            <p className="max-w-xl text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
              Review people matched to you, accept the right connections, and spin up sessions when it feels right.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'All', value: matches.length },
                { label: 'Pending', value: pendingCount },
                { label: 'Accepted', value: acceptedCount },
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
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--text-subtle)' }}>Actions</p>
          <div className="mt-3 space-y-3">
            <LinkRow to="/skills" icon={Zap} title="Add more skills" description="Improve your match pool" />
            <LinkRow to="/sessions" icon={Video} title="Open sessions" description="See accepted sessions" />
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/8 backdrop-blur-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium">Matching flow</p>
              <ArrowRight size={14} className="text-indigo-300" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Accept a peer, create a session, and keep the workspace moving without breaking the glassmorphic rhythm.
            </p>
          </div>
        </section>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'accepted', 'declined'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="workspace-button text-sm"
            style={{
              background: filter === f ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.08)',
              borderColor: filter === f ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.12)',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span className="ml-1.5 text-xs opacity-70">{matches.filter(m => m.status === f).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel card-3d text-center py-20">
          <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-500/12 flex items-center justify-center mx-auto mb-4 animate-float">
            <Users size={28} className="text-indigo-300" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{filter === 'all' ? 'No matches yet' : `No ${filter} matches`}</h3>
          <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            {filter === 'all'
              ? 'Add skills to your profile so the matching algorithm can find your ideal peers.'
              : `No matches with status "${filter}" found.`}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-3">
          {filtered.map((match, i) => {
            const cfg = STATUS_CFG[match.status] || STATUS_CFG.pending
            const StatusIcon = cfg.Icon
            const isPending = match.status === 'pending'
            const isAccepted = match.status === 'accepted'
            return (
              <div key={match.id || i} className={`reveal visible ${stagger(i)}`}>
                <div className="glass-panel card-3d p-5 transition-all duration-200"
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(129,140,248,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'}>
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={match.matchedUser?.avatar_url}
                      name={match.matchedUser?.name || 'Peer Learner'}
                      size={48}
                      shape="1.15rem 1.45rem 1.15rem 1.45rem"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold">{match.matchedUser?.name || 'Peer Learner'}</p>
                        <span
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0"
                          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.textColor }}
                        >
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </div>

                      {match.skill && (
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={13} className="text-indigo-300" />
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{match.skill}</span>
                        </div>
                      )}

                      {match.score > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          {Array(5).fill(0).map((_, j) => (
                            <Star
                              key={j}
                              size={11}
                              style={{ color: j < Math.round(match.score / 20) ? '#fbbf24' : 'var(--border-2)' }}
                              fill={j < Math.round(match.score / 20) ? 'currentColor' : 'none'}
                            />
                          ))}
                          <span className="text-xs ml-1" style={{ color: 'var(--text-subtle)' }}>{match.score}% match</span>
                        </div>
                      )}

                      {isPending && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAction(match.id, 'accepted')}
                            disabled={!!actionLoading}
                            className="workspace-button text-sm"
                            style={{ background: 'rgba(16,185,129,0.14)', borderColor: 'rgba(16,185,129,0.22)', color: '#34d399' }}
                          >
                            <CheckCircle size={14} />
                            {actionLoading === match.id + 'accepted' ? 'Accepting…' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleAction(match.id, 'declined')}
                            disabled={!!actionLoading}
                            className="workspace-button text-sm"
                            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text-muted)' }}
                          >
                            <XCircle size={14} />
                            {actionLoading === match.id + 'declined' ? 'Declining…' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {isAccepted && (
                        <button
                          onClick={() => startSession(match)}
                          className="workspace-button mt-3 text-sm"
                          style={{ background: 'rgba(79,70,229,0.22)', borderColor: 'rgba(129,140,248,0.25)' }}
                        >
                          <Video size={14} />
                          Start Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LinkRow({ to, icon: Icon, title, description }) {
  return (
    <Link to={to} className="workspace-button w-full justify-between">
      <span className="flex items-center gap-2">
        <Icon size={15} />
        <span className="font-medium">{title}</span>
      </span>
      <span className="text-xs opacity-70">{description}</span>
    </Link>
  )
}
