import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Brain, Users, Clock, Wifi, WifiOff, Sparkles, MessageSquare, Send, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sessionApi } from '../lib/api'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: '78b8400a474fb68e68d3f472',
    credential: 'MTUu8p1AmTPcl/J2',
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: '78b8400a474fb68e68d3f472',
    credential: 'MTUu8p1AmTPcl/J2',
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: '78b8400a474fb68e68d3f472',
    credential: 'MTUu8p1AmTPcl/J2',
  },
  {
    urls: 'turns:global.relay.metered.ca:443?transport=tcp',
    username: '78b8400a474fb68e68d3f472',
    credential: 'MTUu8p1AmTPcl/J2',
  },
]

export default function Session() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const streamRef = useRef(null)
  const pcRef = useRef(null)
  const wsRef = useRef(null)
  const screenStreamRef = useRef(null)
  const chatOpenRef = useRef(false)
  const chatScrollRef = useRef(null)

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [connected, setConnected] = useState(false)
  const [peerPresent, setPeerPresent] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [ending, setEnding] = useState(false)

  // ── In-call text chat (over the existing signaling socket) ──
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await sessionApi.getSession(id)
        let data = res.data?.session || res.data

        // The host puts the session "live" on entering the room so it shows
        // as an ongoing session and can later be ended (end requires 'live').
        if (data?.status === 'scheduled' && data?.host_id === user?.id) {
          try {
            const started = await sessionApi.startSession(id)
            data = started.data?.session || started.data || { ...data, status: 'live' }
          } catch {
            // Non-host or already started — keep whatever we loaded.
          }
        }

        if (active) setSession(data)
      } catch {
        if (active) toast.error('Session not found')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (user) load()
    return () => { active = false }
  }, [id, user])

  useEffect(() => {
    const timer = setInterval(() => setElapsed(value => value + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Keep a ref of the open state for the (long-lived) ws.onmessage closure,
  // and clear the unread badge whenever the panel is opened.
  useEffect(() => {
    chatOpenRef.current = chatOpen
    if (chatOpen) setUnread(0)
  }, [chatOpen])

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (chatOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, chatOpen])

  const sendChat = (e) => {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error('Chat is not connected yet.')
      return
    }
    const senderName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'
    ws.send(JSON.stringify({ type: 'chat', text, senderName }))
    // Optimistically append our own message.
    setMessages(list => [...list, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      senderName,
      mine: true,
      ts: Date.now(),
    }])
    setChatInput('')
  }

  // Tears down the call: notify the peer, close the socket + connection,
  // and stop every local track (camera, mic, screen share). Idempotent.
  const teardown = () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'leave' }))
      }
    } catch { /* socket already gone */ }
    try { wsRef.current?.close() } catch { /* noop */ }
    wsRef.current = null
    try { pcRef.current?.close() } catch { /* noop */ }
    pcRef.current = null
    screenStreamRef.current?.getTracks().forEach(track => track.stop())
    screenStreamRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    let active = true

    const sendSignal = (payload) => {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload))
      }
    }

    const start = async () => {
      // 1. Local camera + mic
      let localStream
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch {
        toast.error('Could not access camera/microphone — check browser permissions.')
        return
      }
      if (!active) {
        localStream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = localStream
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream

      // 2. Peer connection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 })
      pcRef.current = pc
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        if (active) setPeerPresent(true)
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ type: 'ice-candidate', candidate: event.candidate })
        }
      }

      pc.onconnectionstatechange = () => {
        if (!active) return
        const state = pc.connectionState
        if (state === 'connected') setConnected(true)
        else if (state === 'disconnected' || state === 'failed' || state === 'closed') setConnected(false)
      }

      // 3. Signaling socket
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const token = authSession?.access_token
      if (!token) {
        toast.error('You are not signed in — cannot join the call.')
        return
      }
      if (!active) return

      const apiBase = import.meta.env.VITE_API_URL || 'https://skillbridge-sen3244.duckdns.org'
      const wsUrl = `${apiBase.replace(/^http/, 'ws')}/ws/signal?token=${encodeURIComponent(token)}&room=${encodeURIComponent(id)}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = async (event) => {
        let msg
        try { msg = JSON.parse(event.data) } catch { return }

        try {
          if (msg.type === 'joined') {
            if (msg.isInitiator) {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              sendSignal({ type: 'offer', sdp: pc.localDescription })
            }
          } else if (msg.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            sendSignal({ type: 'answer', sdp: pc.localDescription })
          } else if (msg.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          } else if (msg.type === 'ice-candidate') {
            if (msg.candidate) {
              try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)) } catch { /* ignore */ }
            }
          } else if (msg.type === 'peer-joined') {
            if (active) setPeerPresent(true)
          } else if (msg.type === 'peer-left') {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
            if (active) {
              setPeerPresent(false)
              setConnected(false)
            }
            toast('Your peer left the session.')
          } else if (msg.type === 'chat') {
            if (active && typeof msg.text === 'string') {
              setMessages(list => [...list, {
                id: `${msg.ts || Date.now()}-${Math.random().toString(36).slice(2)}`,
                text: msg.text,
                senderName: msg.senderName || 'Peer',
                mine: false,
                ts: msg.ts || Date.now(),
              }])
              if (!chatOpenRef.current) setUnread(u => u + 1)
            }
          } else if (msg.type === 'room-full') {
            toast.error('This session room is already full.')
          }
        } catch { /* ignore malformed signaling */ }
      }
    }

    start()

    return () => {
      active = false
      teardown()
    }
  }, [id])

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

  const stopScreenShare = async () => {
    const videoSender = pcRef.current?.getSenders().find(s => s.track && s.track.kind === 'video')
    const cameraTrack = streamRef.current?.getVideoTracks()[0]
    if (videoSender && cameraTrack) {
      try { await videoSender.replaceTrack(cameraTrack) } catch { /* noop */ }
    }
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current
    }
    screenStreamRef.current?.getTracks().forEach(track => track.stop())
    screenStreamRef.current = null
    setSharing(false)
  }

  const toggleScreenShare = async () => {
    const pc = pcRef.current
    if (!pc) return

    if (sharing) {
      await stopScreenShare()
      return
    }

    const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
    if (!videoSender) return

    let screenStream
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
    } catch {
      return // user cancelled the picker
    }

    screenStreamRef.current = screenStream
    const screenTrack = screenStream.getVideoTracks()[0]
    try { await videoSender.replaceTrack(screenTrack) } catch { /* noop */ }
    if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
    setSharing(true)

    // Revert to the camera when the browser's native "Stop sharing" is used.
    screenTrack.onended = () => { stopScreenShare() }
  }

  const endSession = async () => {
    setEnding(true)
    try {
      await sessionApi.endSession(id)
      toast.success('Session ended!')
    } catch {
      // still redirect
    }
    teardown()
    navigate(`/quiz/${id}`)
  }

  const fmt = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
  const sessionMatch = Array.isArray(session?.matches) ? session.matches[0] : session?.matches
  const sessionTopic = sessionMatch?.skills?.name || session?.skill_topic || session?.topic || 'Learning Session'
  const peer = sessionMatch
    ? (sessionMatch.learner_id === user?.id ? sessionMatch.teacher : sessionMatch.learner)
    : null
  const peerName = peer?.full_name || peer?.username || 'Peer Learner'
  const peerAvatar = peer?.avatar_url || null
  const myName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'
  const myAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
  const statusText = connected ? 'Connected' : (peerPresent ? 'Connecting…' : 'Waiting for peer…')

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
                    {statusText}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={11} />
                    {fmt(elapsed)}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Users size={11} />
                    {peerPresent ? '2 participants' : '1 participant'}
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
              connected={peerPresent}
              avatarUrl={peerAvatar}
              avatarName={peerName}
            />

            <VideoTile
              label={`You ${micOn ? '' : '🔇'}`}
              videoRef={localVideoRef}
              showVideo={camOn}
              accent="emerald"
              emptyText="Camera is off"
              connected
              muted
              avatarUrl={myAvatar}
              avatarName={myName}
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
              onClick={toggleScreenShare}
              className="workspace-button w-full justify-center py-3 text-sm"
              style={{
                background: sharing ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.08)',
                borderColor: sharing ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.12)',
              }}
            >
              <Monitor size={18} />
              {sharing ? 'Stop sharing' : 'Share screen'}
            </button>

            <button
              onClick={() => setChatOpen(open => !open)}
              className="workspace-button w-full justify-center py-3 text-sm relative"
              style={{
                background: chatOpen ? 'rgba(79,70,229,0.16)' : 'rgba(255,255,255,0.08)',
                borderColor: chatOpen ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.12)',
              }}
            >
              <MessageSquare size={18} />
              {chatOpen ? 'Hide chat' : 'Chat'}
              {!chatOpen && unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                  flex items-center justify-center bg-indigo-500 text-white shadow-lg">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </aside>
        </div>
      </div>

      {/* Collapsible in-call chat — fixed so it never disturbs the video layout */}
      {chatOpen && (
        <div className="fixed z-40 bottom-3 right-3 left-3 sm:left-auto sm:w-[340px] animate-scale-in">
          <div className="glass-panel card-3d flex flex-col overflow-hidden rounded-[1.5rem]"
            style={{ height: 'min(70vh, 440px)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-indigo-300" />
                <span className="text-sm font-semibold">Session chat</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-4">
                  <MessageSquare size={22} style={{ color: 'var(--text-subtle)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No messages yet — say hello to your peer.</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] mb-0.5 px-1" style={{ color: 'var(--text-subtle)' }}>
                      {m.mine ? 'You' : m.senderName}
                    </span>
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words"
                      style={{
                        background: m.mine ? 'rgba(79,70,229,0.22)' : 'var(--surface-3)',
                        border: `1px solid ${m.mine ? 'rgba(129,140,248,0.30)' : 'var(--border)'}`,
                        color: 'var(--text)',
                      }}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendChat} className="flex items-center gap-2 p-3 border-t shrink-0"
              style={{ borderColor: 'var(--border)' }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'rgba(79,70,229,0.85)', color: '#fff' }}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function VideoTile({ label, videoRef, showVideo, accent, emptyText, connected, muted = false, avatarUrl, avatarName }) {
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {avatarUrl ? (
            <Avatar src={avatarUrl} name={avatarName} size={72} shape="1.4rem 1.8rem 1.4rem 1.8rem" className="border-2 border-white/15 shadow-xl" />
          ) : (
            <div className="w-16 h-16 rounded-[1.25rem] bg-white/8 border border-white/10 flex items-center justify-center">
              <VideoOff size={24} style={{ color: 'var(--text-subtle)' }} />
            </div>
          )}
        </div>
      )}

      {!connected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {avatarUrl ? (
            <div className="mb-3 animate-float">
              <Avatar src={avatarUrl} name={avatarName} size={72} shape="1.4rem 1.8rem 1.4rem 1.8rem" className="border-2 border-white/15 shadow-xl" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-3 animate-float"
              style={{ background: accentBg }}>
              <Users size={28} style={{ color: accentColor }} />
            </div>
          )}
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
