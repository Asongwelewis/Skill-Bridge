import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCircle, XCircle, Clock, Video, Star, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { matchingApi, sessionApi } from '../lib/api'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'
import toast from 'react-hot-toast'

const STATUS_CFG = {
  pending:  { label: 'Pending',  textColor: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  Icon: Clock },
  accepted: { label: 'Accepted', textColor: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  Icon: CheckCircle },
  declined: { label: 'Declined', textColor: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   Icon: XCircle },
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
    matchingApi.getMatches(user.id)
      .then(res => setMatches(res.data?.matches || res.data || []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [user])

  const handleAction = async (matchId, action) => {
    setActionLoading(matchId + action)
    try {
      await matchingApi.updateMatch(matchId, { status: action })
      setMatches(m => m.map(x => x._id === matchId ? { ...x, status: action } : x))
      toast.success(action === 'accepted' ? 'Match accepted!' : 'Match declined.')
    } catch { toast.error('Failed to update match') }
    finally { setActionLoading(null) }
  }

  const startSession = async (match) => {
    try {
      const res = await sessionApi.createSession({
        matchId: match._id,
        participants: [user.id, match.matchedUserId],
        topic: `${match.skill || 'Skill'} Exchange Session`,
        status: 'scheduled',
      })
      const sid = res.data?.session?._id || res.data?._id
      if (sid) navigate(`/session/${sid}`)
      else toast.error('Session created — check sessions page')
    } catch { toast.error('Failed to create session') }
  }

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>

      {/* Header */}
      <div className="mb-8 animate-slide-down">
        <h1 className="text-2xl font-bold mb-1">Skill Matches</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Peers matched to you based on complementary skills
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap animate-fade-in delay-100">
        {['all', 'pending', 'accepted', 'declined'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: filter === f ? '#4F46E5' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              border: filter === f ? '1px solid transparent' : '1px solid var(--border)',
              boxShadow: filter === f ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
            }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                {matches.filter(m => m.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/12 flex items-center justify-center mx-auto mb-4 animate-float">
            <Users size={28} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {filter === 'all' ? 'No matches yet' : `No ${filter} matches`}
          </h3>
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
            const isPending  = match.status === 'pending'
            const isAccepted = match.status === 'accepted'

            return (
              <div key={match._id || i}
                className={`reveal ${listVisible ? 'visible' : ''} ${stagger(i)}`}>
                <div className="p-5 rounded-2xl transition-all duration-200"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center
                      text-indigo-400 font-bold text-lg shrink-0">
                      {(match.matchedUser?.name || match.matchedUser?.email || 'P')[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold">
                          {match.matchedUser?.name || match.matchedUser?.email || 'Peer Learner'}
                        </p>
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0"
                          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.textColor }}>
                          <StatusIcon size={11} />
                          {cfg.label}
                        </span>
                      </div>

                      {match.skill && (
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={13} className="text-indigo-400" />
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{match.skill}</span>
                        </div>
                      )}

                      {match.score && (
                        <div className="flex items-center gap-1 mb-3">
                          {Array(5).fill(0).map((_, j) => (
                            <Star key={j} size={11}
                              style={{ color: j < Math.round(match.score / 20) ? '#fbbf24' : 'var(--border-2)' }}
                              fill={j < Math.round(match.score / 20) ? 'currentColor' : 'none'}
                            />
                          ))}
                          <span className="text-xs ml-1" style={{ color: 'var(--text-subtle)' }}>
                            {match.score}% match
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      {isPending && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleAction(match._id, 'accepted')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                              transition-all hover:-translate-y-0.5 disabled:opacity-60"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <CheckCircle size={14} />
                            {actionLoading === match._id + 'accepted' ? 'Accepting…' : 'Accept'}
                          </button>
                          <button onClick={() => handleAction(match._id, 'declined')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                              transition-all hover:-translate-y-0.5 disabled:opacity-60"
                            style={{ background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            <XCircle size={14} />
                            {actionLoading === match._id + 'declined' ? 'Declining…' : 'Decline'}
                          </button>
                        </div>
                      )}
                      {isAccepted && (
                        <button onClick={() => startSession(match)}
                          className="flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                            text-white text-sm font-medium transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20">
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
