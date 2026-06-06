import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Zap, Video, Award, ArrowRight, Star, Sun, Moon,
  Search, Settings, Bell, Play, Grid3X3, Clock, BarChart3, CircleDot, ChevronRight
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation'
import howItWorksImg from '../assets/How it works.png'
import dataExtractionImg from '../assets/Data extraction-amico.png'
import scheduleImg from '../assets/schedule.png'
import iconDark from '../assets/Icon(dark).jpg'
import iconWhite from '../assets/Icon(white).jpg'

const features = [
  { icon: Zap, title: 'Smart Matching', desc: 'AI pairs you with the right learning partner based on your goals.' },
  { icon: Video, title: 'Live Video Sessions', desc: 'Run peer sessions in the browser with no extra downloads.' },
  { icon: Brain, title: 'AI-Generated Quizzes', desc: 'Turn each completed session into a quick knowledge check.' },
  { icon: Award, title: 'Badges & XP', desc: 'Track progress with visible achievements and growth loops.' },
]

const steps = [
  { step: '01', title: 'List Your Skills', desc: 'Add what you teach and what you want to learn.' },
  { step: '02', title: 'Get Matched', desc: 'Find peers with complementary strengths.' },
  { step: '03', title: 'Schedule & Learn', desc: 'Open a session and learn together live.' },
  { step: '04', title: 'Earn & Grow', desc: 'Complete quizzes and unlock badges.' },
]

const testimonials = [
  { name: 'Sarah Chen', role: 'Software Engineer', text: 'SkillBridge helped me master React by teaching Python. The exchange model is excellent.', avatar: 'SC' },
  { name: 'Marcus Kim', role: 'Data Scientist', text: 'The quiz workflow keeps every session useful after the call ends.', avatar: 'MK' },
  { name: 'Aisha Patel', role: 'UX Designer', text: 'I found a study partner fast and the experience felt like a real workspace, not a brochure.', avatar: 'AP' },
]

const stats = [
  { value: '10K+', label: 'Active Learners' },
  { value: '50K+', label: 'Sessions Completed' },
  { value: '200+', label: 'Skills Available' },
  { value: '4.9', label: 'Average Rating' },
]

function Reveal({ children, className = '', delay = 0, type = 'up' }) {
  const [ref, visible] = useScrollAnimation()
  const base = type === 'left' ? 'reveal-left' : type === 'scale' ? 'reveal-scale' : 'reveal'
  return (
    <div
      ref={ref}
      className={`${base} ${visible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function StatPill({ value, label }) {
  return (
    <div className="p-4 rounded-2xl glass">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>{label}</p>
    </div>
  )
}

export default function Landing() {
  const { isDark, toggleTheme } = useTheme()
  const [scrollY, setScrollY] = useState(0)
  const sphereRef = useRef(null)
  const [featuresRef, featuresVisible, featureDelay] = useStaggerAnimation(features.length, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  })
  // Scroll-triggered reveals for the two bar charts (grow + stagger one-by-one).
  const [barsRef, barsVisible] = useScrollAnimation()
  const [timelineRef, timelineVisible] = useScrollAnimation()
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mouse-driven parallax for the 3D sphere only. The site-wide custom cursor
  // lives in <CustomCursor /> at the app root. Kept gentle so the sphere always
  // stays within its (overflow-clipped) panel as you move/scroll.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const move = (event) => {
      if (!sphereRef.current) return
      const { clientX, clientY } = event
      const dx = (clientX / window.innerWidth - 0.5) * 14
      const dy = (clientY / window.innerHeight - 0.5) * 10
      sphereRef.current.style.transform =
        `translate3d(${dx}px, ${dy}px, 0) rotateX(${8 - dy * 0.18}deg) rotateY(${-dx * 0.22}deg)`
    }

    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const boardTransform = useMemo(() => {
    const rotateX = Math.min(scrollY * 0.01, 9)
    const rotateY = Math.max(Math.min(scrollY * -0.006, 7), -7)
    const translateY = Math.min(scrollY * 0.04, 20)
    return `perspective(1600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px)`
  }, [scrollY])

  return (
    <div className="min-h-screen theme-transition overflow-x-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <nav
        className="fixed top-0 inset-x-0 z-50 theme-transition animate-slide-down"
        style={{
          background: isDark
            ? `rgba(9,9,26,${Math.min(scrollY / 120, 0.92)})`
            : `rgba(243,244,255,${Math.min(scrollY / 120, 0.92)})`,
          backdropFilter: scrollY > 10 ? 'blur(18px)' : 'none',
          borderBottom: scrollY > 10 ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={isDark ? iconWhite : iconDark}
              alt="SkillBridge"
              className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-indigo-600/30"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">SkillBridge</p>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Peer learning workspace</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl glass" style={{ minWidth: 420 }}>
            <Search size={14} style={{ color: 'var(--text-subtle)' }} />
            <span className="text-sm" style={{ color: 'var(--text-subtle)' }}>Search skills, sessions, and matches</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/about"
              className="hidden md:inline-flex px-4 py-2.5 rounded-[1.3rem_2rem_1.3rem_2rem] font-medium hover-lift"
              style={{ color: 'var(--text-muted)' }}
            >
              About
            </Link>
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-[1.25rem_1.75rem_1.25rem_1.75rem] flex items-center justify-center hover-lift glass"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-500" />}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-[1.3rem_2rem_1.3rem_2rem] font-medium hover-lift glass"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[0.95rem_2rem_0.95rem_2rem] font-semibold bg-indigo-600 text-white hover-lift shadow-lg shadow-indigo-600/30"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-28 md:pt-32 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-28 -right-16 h-96 w-96 rounded-full animate-spin-slow"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)',
              transform: `translate(${scrollY * 0.02}px, ${-scrollY * 0.01}px)`,
            }}
          />
          <div
            className="absolute bottom-0 -left-24 h-80 w-80 rounded-full"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
              transform: `translate(${-scrollY * 0.015}px, ${scrollY * 0.02}px)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(148,163,184,0.16)' : 'rgba(79,70,229,0.12)'} 1px, transparent 0)`,
              backgroundSize: '36px 36px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-[1.1fr_0.95fr] gap-8 lg:gap-10 items-center">
            <Reveal type="left" className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold glass w-fit">
                <Star size={11} fill="currentColor" className="text-amber-400" />
                A learning workspace with depth
              </div>

              <img
                src={scheduleImg}
                alt=""
                aria-hidden="true"
                className="w-56 sm:w-72 md:w-80 object-contain pointer-events-none select-none -mb-2"
              />

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight">
                  Build your
                  <span className="block gradient-text">learning command center.</span>
                </h1>
                <p className="max-w-xl text-lg md:text-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  SkillBridge turns your profile into a living workspace for skills, matches, and sessions.
                  The structure is intentionally dashboard-like, so the product feels active before you log in.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-semibold hover-lift">
                  Start free
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl glass font-semibold hover-lift">
                  Sign in
                  <Play size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg">
                <StatPill value="10K+" label="Learners" />
                <StatPill value="200+" label="Skills" />
                <StatPill value="4.9" label="Rating" />
              </div>
            </Reveal>

              <div className="relative perspective-1200">
              <div
                className="absolute inset-0 rounded-[2rem] blur-3xl opacity-50"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle, rgba(79,70,229,0.22), transparent 65%)'
                    : 'radial-gradient(circle, rgba(79,70,229,0.14), transparent 65%)',
                  transform: `translateY(${scrollY * 0.02}px)`,
                }}
              />

              <div
                className="relative rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-5 glass rotate-3d card-3d"
                style={{ transform: boardTransform, boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
              >
                <div className="rounded-[1.7rem] overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass">
                      <Grid3X3 size={12} />
                      Workspace
                    </div>
                  </div>

                  <div className="p-4 md:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-subtle)' }}>Welcome in</p>
                        <h2 className="text-3xl md:text-4xl font-black mt-1">Nixtio workspace</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl glass"><Bell size={16} /></div>
                        <div className="p-3 rounded-2xl glass"><Settings size={16} /></div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-4">
                      <div className="rounded-[1.5rem] p-4 md:p-5 glass" style={{ minHeight: 260 }}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-subtle)' }}>Profile</p>
                            <p className="text-xl font-semibold mt-1">Alex Chen</p>
                          </div>
                          <div className="px-3 py-1.5 rounded-full text-sm glass">$1,500</div>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                          <div className="aspect-[3/4] rounded-[1.5rem] overflow-hidden relative"
                            style={{
                              background: 'linear-gradient(180deg, rgba(79,70,229,0.18), rgba(16,185,129,0.08))',
                              transform: 'translateZ(40px)',
                            }}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_48%)]" />
                            <div className="absolute inset-x-4 bottom-4 p-3 rounded-2xl glass">
                              <p className="text-sm font-semibold">MIA Designer</p>
                              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Learning / Teaching loop</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {[
                              { title: 'Profile', detail: 'Your learning identity' },
                              { title: 'Progress', detail: 'Weekly momentum' },
                              { title: 'Sessions', detail: 'Today at 3:45 PM' },
                              { title: 'Matches', detail: '3 new peers available' },
                            ].map(({ title, detail }) => (
                              <div key={title} className="p-3 rounded-2xl glass min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                                  <p className="text-sm font-semibold">{title}</p>
                                </div>
                                <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>{detail}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: '92', label: 'Employees' },
                            { value: '75', label: 'Hiring' },
                            { value: '315', label: 'Projects' },
                          ].map(({ value, label }) => (
                            <div key={label} className="p-4 rounded-[1.2rem] glass text-center">
                              <p className="text-3xl font-black">{value}</p>
                              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>{label}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="rounded-[1.4rem] p-4 glass">
                            <div className="flex items-center justify-between mb-4">
                              <p className="font-semibold">Progress</p>
                              <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>This week</span>
                            </div>
                            <div ref={barsRef} className="h-36 flex items-end gap-2">
                              {[42, 78, 56, 90, 68, 82].map((height, index) => {
                                const grown = reduceMotion || barsVisible
                                return (
                                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                      className="w-full rounded-t-full rounded-b-lg bg-indigo-500/80"
                                      style={{
                                        height: grown ? `${height}%` : '0%',
                                        opacity: grown ? 1 : 0,
                                        transition: reduceMotion ? 'none' : 'height 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
                                        transitionDelay: reduceMotion ? '0ms' : `${index * 80}ms`,
                                      }}
                                    />
                                    <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>{'MTWTF'.charAt(index) || 'S'}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] p-4 glass">
                            <div className="flex items-center justify-between mb-4">
                              <p className="font-semibold">Time tracker</p>
                              <Clock size={14} style={{ color: 'var(--text-subtle)' }} />
                            </div>
                            <div className="aspect-square rounded-full mx-auto max-w-[150px] border-[10px] border-indigo-500/15 flex items-center justify-center relative"
                              style={{ boxShadow: 'inset 0 0 0 10px rgba(79,70,229,0.08)' }}>
                              <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-indigo-500 animate-spin-slow" />
                              <div className="text-center">
                                <p className="text-3xl font-black">03:45</p>
                                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>Work Time</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] p-4 glass">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold">Onboarding</p>
                            <p className="text-xl font-black">42%</p>
                          </div>
                          <div className="flex gap-2">
                            <div className="h-10 flex-[1.1] rounded-full bg-indigo-500" />
                            <div className="h-10 flex-[0.7] rounded-full bg-sky-500" />
                            <div className="h-10 flex-[0.3] rounded-full bg-slate-400" />
                          </div>
                          <div className="mt-4 rounded-[1.2rem] p-4" style={{ background: 'rgba(15,23,42,0.92)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-white font-semibold">Onboarding task</p>
                              <p className="text-white/80 text-sm">3/8</p>
                            </div>
                            <div className="space-y-3">
                              {['Client meeting', 'Design review', 'Project update', 'Daily standup'].map((item, index) => (
                                <div key={item} className="flex items-center gap-3 rounded-2xl px-3 py-2 bg-white/5">
                                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                    <CircleDot size={13} className="text-sky-300" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{item}</p>
                                    <p className="text-[11px] text-white/45">Task {index + 1}</p>
                                  </div>
                                  <ChevronRight size={13} className="text-white/40" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-4">
                      <div className="rounded-[1.5rem] p-4 glass">
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-semibold">3D Sphere</p>
                          <span className="text-xs px-2.5 py-1 rounded-full glass">Live</span>
                        </div>
                        <div className="relative h-44 p-3 flex items-center justify-center overflow-hidden rounded-[1.3rem]"
                          style={{
                            background: isDark
                              ? 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.10), rgba(15,23,42,0.96) 56%)'
                              : 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.7), rgba(241,245,255,0.96) 56%)',
                            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 62%, transparent 95%)',
                            maskImage: 'radial-gradient(circle at 50% 50%, #000 62%, transparent 95%)',
                          }}>
                          <div
                            ref={sphereRef}
                            className="landing-sphere"
                            style={{
                              transform: 'translate3d(0, 0, 0) rotateX(8deg) rotateY(-18deg)',
                            }}
                          >
                            <span className="landing-sphere-core" />
                            <span className="landing-sphere-ring landing-sphere-ring-a" />
                            <span className="landing-sphere-ring landing-sphere-ring-b" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] p-4 glass">
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-semibold">Live actions</p>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                            <CircleDot size={12} className="text-emerald-400" />
                            Following cursor
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {['Ask a peer', 'Join session', 'Review skill', 'Track progress'].map((label, index) => (
                            <button
                              key={label}
                              type="button"
                              className="landing-action-btn"
                              style={{
                                animationDelay: `${index * 70}ms`,
                              }}
                            >
                              <span className="landing-action-icon">
                                <ChevronRight size={13} />
                              </span>
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] p-4 md:p-5 glass">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold">Workspace timeline</p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                          <BarChart3 size={13} />
                          24-hour overview
                        </div>
                      </div>
                      <div ref={timelineRef} className="grid grid-cols-5 md:grid-cols-7 gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                          const grown = reduceMotion || timelineVisible
                          return (
                            <div key={day} className="p-3 rounded-2xl text-center glass">
                              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>{day}</p>
                              <div className="mt-3 h-12 rounded-xl bg-indigo-600/15 relative overflow-hidden">
                                <div
                                  className="absolute inset-x-0 bottom-0 bg-indigo-500 rounded-xl"
                                  style={{
                                    height: grown ? `${40 + index * 6}%` : '0%',
                                    transition: reduceMotion ? 'none' : 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
                                    transitionDelay: reduceMotion ? '0ms' : `${index * 80}ms`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <img
            src={scheduleImg}
            alt=""
            aria-hidden="true"
            className="w-56 sm:w-72 md:w-80 mx-auto mb-6 object-contain pointer-events-none select-none"
          />
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A cleaner structure, with real depth</h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              The landing page now leans into layered boards, glass panels, and scroll-revealed blocks instead of a flat brochure layout.
            </p>
          </Reveal>

          <div ref={featuresRef} className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }, index) => {
              return (
                <div
                  key={title}
                  className={`reveal-left ${featureDelay(index)} ${featuresVisible ? 'visible' : ''}`}
                >
                  <div className="p-5 rounded-[1.6rem] glass hover-lift h-full">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 flex items-center justify-center mb-4">
                      <Icon size={20} className="text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-6" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
          <Reveal type="left" className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold w-fit">
              <Video size={12} />
              Session-first workflow
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Looks like a workspace, not a brochure.</h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              The landing page now uses a dashboard composition similar to the references: strong side panels,
              modular widgets, stacked surfaces, and a central workspace that feels interactive before the first click.
            </p>
            <img
              src={howItWorksImg}
              alt="How SkillBridge works, step by step"
              className="w-full max-w-md rounded-[1.5rem] object-contain select-none animate-float"
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-4">
            {steps.map(({ step, title, desc }, index) => (
              <Reveal key={step} delay={index * 100} type="left">
                <div className="p-5 rounded-[1.5rem] glass h-full">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black mb-4">
                    {step}
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl font-bold">What learners say</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map(({ name, role, text, avatar }, index) => (
              <Reveal key={name} delay={index * 90} type="left">
                <div className="p-6 rounded-[1.6rem] glass h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array(5).fill(0).map((_, idx) => (
                      <Star key={idx} size={12} className="text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-6">
        <Reveal type="left" className="max-w-4xl mx-auto">
          <div className="p-8 md:p-10 rounded-[2rem] glass text-center">
            <img
              src={dataExtractionImg}
              alt="Turn your sessions into measurable progress"
              className="w-full max-w-sm mx-auto mb-6 object-contain select-none animate-float"
            />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build your learning workspace?</h2>
            <p className="mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Start with skills, let the matching system do the heavy lifting, and move into sessions with a more tactile interface.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-semibold hover-lift">
              Create your account
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="py-10 px-4 md:px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={isDark ? iconWhite : iconDark}
              alt="SkillBridge"
              className="w-9 h-9 rounded-2xl object-cover"
            />
            <p className="text-sm font-semibold">SkillBridge</p>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Link to="/about" className="hover-lift">About Us</Link>
            <Link to="/login" className="hover-lift">Sign In</Link>
            <Link to="/register" className="hover-lift">Get Started</Link>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>© 2026 SkillBridge</p>
        </div>
      </footer>
    </div>
  )
}
