import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Zap, Users, Video, Award, ArrowRight, CheckCircle, Star, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation'

const features = [
  { icon: Zap,   title: 'Smart Matching',    desc: 'AI pairs you with the perfect learning partner based on what you know and want to learn.' },
  { icon: Video, title: 'Live Video Sessions', desc: 'WebRTC-powered HD video calls directly in the browser — no downloads, no friction.' },
  { icon: Brain, title: 'AI-Generated Quizzes', desc: 'Reinforce learning with post-session quizzes automatically generated from your session topics.' },
  { icon: Award, title: 'Badges & XP',       desc: 'Earn badges and experience points as you learn and teach, showcasing your expertise.' },
]

const steps = [
  { step: '01', title: 'List Your Skills',   desc: 'Add what you can teach and want to learn' },
  { step: '02', title: 'Get Matched',        desc: 'AI finds your ideal peer learning partner' },
  { step: '03', title: 'Schedule & Learn',   desc: 'Book a session and connect via HD video' },
  { step: '04', title: 'Earn & Grow',        desc: 'Complete quizzes, earn badges, level up' },
]

const testimonials = [
  { name: 'Sarah Chen',   role: 'Software Engineer', text: 'SkillBridge helped me master React by teaching Python. The peer exchange model is genius.', avatar: 'SC' },
  { name: 'Marcus Kim',   role: 'Data Scientist',    text: 'The AI quiz system is incredible. Every session reinforces exactly what I need to know.',  avatar: 'MK' },
  { name: 'Aisha Patel',  role: 'UX Designer',       text: "Found my study partner within hours. We've had 20+ sessions and both leveled up massively.", avatar: 'AP' },
]

const stats = [
  { value: '10K+', label: 'Active Learners' },
  { value: '50K+', label: 'Sessions Completed' },
  { value: '200+', label: 'Skills Available' },
  { value: '4.9★', label: 'Average Rating' },
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

export default function Landing() {
  const { isDark, toggleTheme } = useTheme()
  const heroRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen theme-transition" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Navbar ─────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 theme-transition animate-slide-down"
        style={{
          background: isDark
            ? `rgba(9,9,26,${Math.min(scrollY / 60, 0.92)})`
            : `rgba(243,244,255,${Math.min(scrollY / 60, 0.95)})`,
          backdropFilter: scrollY > 20 ? 'blur(16px)' : 'none',
          borderBottom: scrollY > 20 ? '1px solid var(--border)' : '1px solid transparent',
          transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Brain size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>SkillBridge</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-500" />}
            </button>
            <Link to="/login"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}>
              Sign In
            </Link>
            <Link to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-150 h-150 rounded-full animate-spin-slow"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)',
              transform: `translate(${scrollY * 0.03}px, ${-scrollY * 0.02}px)`,
            }}
          />
          <div
            className="absolute bottom-0 -left-32 w-120 h-120 rounded-full"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
              transform: `translate(${-scrollY * 0.02}px, ${scrollY * 0.03}px)`,
            }}
          />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(79,70,229,0.2)' : 'rgba(79,70,229,0.12)'} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="animate-slide-down delay-0 inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
            style={{
              background: 'rgba(79,70,229,0.12)',
              border: '1px solid rgba(79,70,229,0.3)',
              color: '#818CF8',
            }}>
            <Star size={11} fill="currentColor" />
            Peer-to-peer learning reimagined
          </div>

          <h1 className="animate-slide-up delay-100 text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Learn by Teaching.{' '}
            <span className="gradient-text">Grow Together.</span>
          </h1>

          <p className="animate-slide-up delay-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}>
            SkillBridge connects you with peers who know what you want to learn —
            and want to learn what you know. Exchange skills, earn XP, and grow your network.
          </p>

          <div className="animate-slide-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-indigo-600/30
                hover:shadow-indigo-600/50 hover:-translate-y-1 text-base group">
              Start Learning Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl
                transition-all duration-200 text-base hover:-translate-y-0.5"
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border-2)',
                color: 'var(--text)',
              }}>
              Sign In
            </Link>
          </div>

          <div className="animate-fade-in delay-500 flex items-center justify-center gap-6 mt-10 flex-wrap">
            {['No credit card required', 'Free to start', 'Join 10,000+ learners'].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-subtle)' }}>
                <CheckCircle size={13} className="text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────── */}
      <section className="py-16 px-6 theme-transition" style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }, i) => (
            <Reveal key={label} delay={i * 80} type="scale">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: 'var(--text)' }}>
                  {value}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              Everything you need to learn smarter
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              A complete learning platform built on peer collaboration and AI-enhanced feedback.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 100} type={i % 2 === 0 ? 'left' : 'up'}>
                <div
                  className="p-6 rounded-2xl hover-lift cursor-default group"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--card-shadow)',
                    transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s, background 0.35s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/15 flex items-center justify-center mb-4
                    group-hover:bg-indigo-600/25 transition-colors duration-200">
                    <Icon size={22} className="text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────── */}
      <section className="py-24 px-6 theme-transition" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              How SkillBridge Works
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
              From sign up to skill mastery in four steps
            </p>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {steps.map(({ step, title, desc }, i) => (
              <Reveal key={step} delay={i * 120} type="up">
                <div className="flex flex-col items-center text-center relative">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5"
                      style={{ background: 'linear-gradient(90deg, rgba(79,70,229,0.5), transparent)' }} />
                  )}
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center
                    text-white font-bold text-sm mb-4 relative z-10 shadow-lg shadow-indigo-600/30
                    hover:scale-110 transition-transform duration-200">
                    {step}
                  </div>
                  <h3 className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>What our learners say</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, avatar }, i) => (
              <Reveal key={name} delay={i * 100} type="scale">
                <div
                  className="p-6 rounded-2xl hover-lift"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>"{text}"</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="py-24 px-6">
        <Reveal type="scale" className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-3xl"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(16,185,129,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(16,185,129,0.05) 100%)',
              border: '1px solid rgba(79,70,229,0.25)',
            }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              Ready to start your learning journey?
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
              Join thousands of peers exchanging skills every day.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white
                font-semibold px-8 py-4 rounded-2xl transition-all duration-200
                shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 text-base group">
              Create Your Free Account
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="py-8 px-6 text-center theme-transition"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-subtle)' }}>
        <p className="text-sm">© 2025 SkillBridge. Built with ❤️ for peer learning.</p>
      </footer>
    </div>
  )
}
