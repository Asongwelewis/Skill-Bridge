import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Brain, Users, Clock, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { sessionApi } from '../lib/api'
import toast from 'react-hot-toast'

export default function Session() {
  const { id } = useParams()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  const streamRef      = useRef(null)

  const [session,  setSession]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [camOn,    setCamOn]    = useState(true)
  const [micOn,    setMicOn]    = useState(true)
  const [connected,setConnected]= useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const [ending,   setEnding]   = useState(false)

  useEffect(() => {
    sessionApi.getSession(id)
      .then(res => setSession(res.data?.session || res.data))
      .catch(() => toast.error('Session not found'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        setTimeout(() => setConnected(true), 2000)
      } catch {
        toast.error('Could not access camera/microphone — check browser permissions.')
      }
    }
    startMedia()
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setCamOn(c => !c) }
  }
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setMicOn(m => !m) }
  }

  const endSession = async () => {
    setEnding(true)
    try {
      await sessionApi.endSession(id)
      toast.success('Session ended!')
    } catch { /* still redirect */ }
    streamRef.current?.getTracks().forEach(t => t.stop())
    navigate(`/quiz/${id}`)
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const surface = isDark ? 'rgba(15,14,26,0.95)' : 'rgba(243,244,255,0.97)'
  const videoBg = isDark ? '#0a091a' : '#e8eaff'
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(79,70,229,0.12)'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center theme-transition"
      style={{ background: isDark ? '#09091a' : '#f3f4ff' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading session…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col theme-transition animate-fade-in"
      style={{ background: isDark ? '#09091a' : '#f3f4ff', color: 'var(--text)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 animate-slide-down"
        style={{ background: surface, borderBottom: `1px solid ${borderC}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Brain size={15} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">{session?.topic || 'Learning Session'}</p>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs ${connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
                {connected ? 'Connected' : 'Connecting…'}
              </span>
              <span style={{ color: 'var(--border-2)' }}>·</span>
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                <Clock size={11} />{fmt(elapsed)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Users size={16} /><span>2 participants</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 p-4 md:p-6">
        <div className="h-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Remote video */}
          <div className="relative rounded-2xl overflow-hidden min-h-64 md:min-h-0 animate-slide-left"
            style={{ background: videoBg, border: `1px solid ${borderC}` }}>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!connected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: videoBg }}>
                <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-3 animate-float">
                  <Users size={28} className="text-indigo-400" />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Waiting for peer to join…</p>
                <div className="flex gap-1 mt-3">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-white text-xs font-medium"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
              {session?.participants?.[1] || 'Peer Learner'}
            </div>
          </div>

          {/* Local video */}
          <div className="relative rounded-2xl overflow-hidden min-h-64 md:min-h-0 animate-slide-right"
            style={{ background: videoBg, border: `1px solid ${borderC}` }}>
            <video ref={localVideoRef} autoPlay playsInline muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${camOn ? 'opacity-100' : 'opacity-0'}`} />
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: videoBg }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--surface-3)' }}>
                  <VideoOff size={24} style={{ color: 'var(--text-subtle)' }} />
                </div>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-white text-xs font-medium"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
              You {!micOn && '🔇'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="py-5 px-6 flex items-center justify-center gap-3 animate-slide-up"
        style={{ background: surface, borderTop: `1px solid ${borderC}` }}>

        <ControlBtn active={micOn} onClick={toggleMic} title={micOn ? 'Mute' : 'Unmute'} isDark={isDark}>
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </ControlBtn>

        <ControlBtn active={camOn} onClick={toggleCam} title={camOn ? 'Turn off camera' : 'Turn on camera'} isDark={isDark}>
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </ControlBtn>

        <button onClick={endSession} disabled={ending}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold
            px-6 py-3 rounded-full transition-all duration-200 shadow-lg shadow-red-600/30
            hover:shadow-red-600/50 hover:-translate-y-0.5 disabled:opacity-60">
          <PhoneOff size={18} />
          {ending ? 'Ending…' : 'End Session'}
        </button>

        <ControlBtn active onClick={() => toast('Screen share coming soon!')} title="Share screen" isDark={isDark}>
          <Monitor size={20} />
        </ControlBtn>
      </div>
    </div>
  )
}

function ControlBtn({ children, active, onClick, title, isDark }) {
  const inactive = !active
  return (
    <button onClick={onClick} title={title}
      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
      style={{
        background: inactive ? '#dc2626' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(79,70,229,0.1)',
        color: inactive ? '#fff' : isDark ? '#fff' : '#4F46E5',
        border: inactive ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(79,70,229,0.2)'}`,
      }}>
      {children}
    </button>
  )
}
