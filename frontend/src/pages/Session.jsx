import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Brain, Users, Clock, Wifi, WifiOff, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sessionApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function Session() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const streamRef = useRef(null)

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [connected, setConnected] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    sessionApi.getSession(id)
      .then(res => setSession(res.data?.session || res.data))
      .catch(() => toast.error('Session not found'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const timer = setInterval(() => setElapsed(value => value + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        setTimeout(() => setConnected(true), 1400)
      } catch {
        toast.error('Could not access camera/microphone — check browser permissions.')
      }
    }

    startMedia()
    return () => streamRef.current?.getTracks().forEach(track => track.stop())
  }, [])

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setCamOn(value => !value)
    }
  }

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setMicOn(value => !value)
    }
  }

  const endSession = async () => {
    setEnding(true)
    try {
      await sessionApi.endSession(id)
      toast.success('Session ended!')
    } catch {
      // still redirect
    }
    streamRef.current?.getTracks().forEach(track => track.stop())
    navigate(`/quiz/${id}`)
  }

  const fmt = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
  const sessionMatch = Array.isArray(session?.matches) ? session.matches[0] : session?.matches
  const sessionTopic = sessionMatch?.skills?.name || session?.skill_topic || session?.topic || 'Learning Session'
  const peerName = sessionMatch
    ? (sessionMatch.learner_id === user?.id
      ? (sessionMatch.teacher?.username || sessionMatch.teacher?.full_name || 'Peer Learner')
      : (sessionMatch.learner?.username || sessionMatch.learner?.full_name || 'Peer Learner'))
    : 'Peer Learner'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-transition" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="glass-panel card-3d px-6 py-5 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading session…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-transition animate-fade-in" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-28 left-1/3 h-72 w-72 rounded-full blur-3xl animate-float"
            style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.14) 0%, transparent 70%)' }} />
          <div className="absolute top-24 right-8 h-64 w-64 rounded-full blur-3xl animate-float"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', animationDelay: '1s' }} />
        </div>

        <header className="glass-panel card-3d relative overflow-hidden px-5 md:px-6 py-4 md:py-5 mb-5">
          <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-[1rem_1.25rem_1rem_1.25rem] bg-indigo-500/20 border border-white/10 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Brain size={18} className="text-indigo-300" />
              </div>
              <div>
                <div className="glass-chip inline-flex mb-2">
                  <Sparkles size={12} />
                  Session room
                </div>
                <p className="text-lg md:text-xl font-semibold leading-tight">{sessionTopic}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <span className={`flex items-center gap-1 ${connected ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
                    {connected ? 'Connected' : 'Connecting…'}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={11} />
                    {fmt(elapsed)}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Users size={11} />
                    2 participants
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-chip self-start lg:self-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Session live shell
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.95fr]">
          <section className="grid gap-5 md:grid-cols-2">
            <VideoTile
              label={peerName}
              videoRef={remoteVideoRef}
              showVideo
              accent="indigo"
              emptyText="Waiting for peer to join…"
              connected={connected}
            />

            <VideoTile
              label={`You ${micOn ? '' : '🔇'}`}
              videoRef={localVideoRef}
              showVideo={camOn}
              accent="emerald"
              emptyText="Camera is off"
              connected
              muted
            />
          </section>

          <aside className="glass-panel card-3d p-5 md:p-6 flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-subtle)' }}>Controls</p>
              <h2 className="text-xl font-semibold mt-1">Call actions</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Keep the room moving with the same glassy feel as the rest of the app.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ControlBtn active={micOn} onClick={toggleMic} title={micOn ? 'Mute' : 'Unmute'}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </ControlBtn>
              <ControlBtn active={camOn} onClick={toggleCam} title={camOn ? 'Turn off camera' : 'Turn on camera'}>
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </ControlBtn>
            </div>

            <button
              onClick={endSession}
              disabled={ending}
              className="workspace-button w-full justify-center py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.16)', borderColor: 'rgba(248,113,113,0.25)', color: '#fca5a5' }}
            >
              <PhoneOff size={18} />
              {ending ? 'Ending…' : 'End Session'}
            </button>

            <button
              onClick={() => toast('Screen share coming soon!')}
              className="workspace-button w-full justify-center py-3 text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <Monitor size={18} />
              Share screen
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}

function VideoTile({ label, videoRef, showVideo, accent, emptyText, connected, muted = false }) {
  const accentBg = accent === 'emerald' ? 'rgba(16,185,129,0.16)' : 'rgba(79,70,229,0.16)'
  const accentColor = accent === 'emerald' ? '#34d399' : '#818CF8'

  return (
    <div className="glass-panel card-3d relative overflow-hidden min-h-[320px]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover transition-opacity duration-300 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
      />

      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-16 h-16 rounded-[1.25rem] bg-white/8 border border-white/10 flex items-center justify-center">
            <VideoOff size={24} style={{ color: 'var(--text-subtle)' }} />
          </div>
        </div>
      )}

      {!connected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-3 animate-float"
            style={{ background: accentBg }}>
            <Users size={28} style={{ color: accentColor }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{emptyText}</p>
          <div className="flex gap-1 mt-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3 glass-chip">
        {label}
      </div>
    </div>
  )
}

function ControlBtn({ children, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="workspace-button justify-center py-3 text-sm"
      style={{
        background: active ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.20)',
        borderColor: active ? 'rgba(255,255,255,0.12)' : 'rgba(248,113,113,0.30)',
        color: active ? 'var(--text)' : '#fff',
      }}
    >
      {children}
    </button>
  )
}
