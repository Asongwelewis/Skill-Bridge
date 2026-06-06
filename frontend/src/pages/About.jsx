import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Zap, Video, Award, ArrowRight, Sun, Moon, Search, Heart
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useScrollAnimation, useStaggerAnimation } from '../hooks/useScrollAnimation'
import iconDark from '../assets/Icon(dark).jpg'
import iconWhite from '../assets/Icon(white).jpg'
import meImg from '../assets/me.jpg'
import lewisImg from '../assets/Lewis.jpeg'

const pillars = [
  { icon: Zap, title: 'Smart Matching', desc: 'AI pairs you with the right learning partner based on your goals and the skills you offer.' },
  { icon: Video, title: 'Live Video Sessions', desc: 'Run peer-to-peer sessions right in the browser — no extra downloads required.' },
  { icon: Brain, title: 'AI-Generated Quizzes', desc: 'Turn each completed session into a quick, AI-generated knowledge check.' },
  { icon: Award, title: 'Badges & Progress', desc: 'Track your growth with visible achievements, XP, and progress loops.' },
]

const team = [
  {
    name: 'Nah Nah Sylvestre',
    role: 'Product Owner & Application Lead',
    desc: 'Leads product direction and builds the application layer — microservices, frontend, and database schema.',
    photo: meImg,
  },
  {
    name: 'Asongwe Lewis',
    role: 'Scrum Master & DevOps Lead',
    desc: 'Drives delivery and owns the platform — infrastructure, CI/CD, Kubernetes, and monitoring.',
    photo: lewisImg,
  },
]

const builtWith = ['React', 'Node.js microservices', 'Kubernetes', 'WebRTC', 'Kafka', 'AI']

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

export default function About() {
  const { isDark, toggleTheme } = useTheme()
  const [scrollY, setScrollY] = useState(0)
  const [pillarsRef, pillarsVisible, pillarDelay] = useStaggerAnimation(pillars.length, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  })

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen theme-transition overflow-x-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* ─── TOP NAV (mirrors Landing) ─────────────────────── */}
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
          <Link to="/" className="flex items-center gap-3">
            <img
              src={isDark ? iconWhite : iconDark}
              alt="SkillBridge"
              className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-indigo-600/30"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">SkillBridge</p>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Peer learning workspace</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover-lift" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <Link to="/about" className="hover-lift" style={{ color: 'var(--text)' }}>About</Link>
          </div>

          <div className="flex items-center gap-2">
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

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 overflow-hidden">
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

        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Reveal type="scale">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold glass w-fit mx-auto mb-6">
              <Heart size={11} fill="currentColor" className="text-rose-400" />
              Built for peer learning
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] tracking-tight mb-5">
              About <span className="gradient-text">SkillBridge</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              A learning workspace where people teach what they know and learn what they want —
              matched by AI, connected live, and reinforced with quizzes.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── OUR MISSION ───────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal type="left">
            <div className="p-8 md:p-10 rounded-[2rem] glass">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold w-fit mb-5">
                <Zap size={12} className="text-indigo-400" />
                Our Mission
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Make structured peer learning accessible to everyone.</h2>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                SkillBridge connects people who want to teach and learn skills from each other through
                AI-powered matching, live peer-to-peer video sessions, and AI-generated quizzes —
                making structured peer learning accessible to everyone.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── WHAT WE DO ────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 md:px-6" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Do</h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Four pillars carry every learning loop on SkillBridge.
            </p>
          </Reveal>

          <div ref={pillarsRef} className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {pillars.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className={`reveal-left ${pillarDelay(index)} ${pillarsVisible ? 'visible' : ''}`}
              >
                <div className="p-5 rounded-[1.6rem] glass hover-lift h-full">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE TEAM ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Team</h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              A small team building SkillBridge end to end.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6">
            {team.map(({ name, role, desc, photo }, index) => (
              <Reveal key={name} delay={index * 120} type="scale">
                <div className="p-8 rounded-[2rem] glass hover-lift h-full flex flex-col items-center text-center">
                  <div
                    className="mb-5 overflow-hidden"
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 9999,
                      border: '3px solid var(--border-2)',
                      boxShadow: '0 14px 36px rgba(79,70,229,0.22)',
                    }}
                  >
                    <img
                      src={photo}
                      alt={name}
                      className="w-full h-full"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                  </div>
                  <h3 className="text-xl font-bold">{name}</h3>
                  <p className="text-sm font-semibold mt-1 mb-3 gradient-text">{role}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BUILT WITH ────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 md:px-6" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built With</h2>
            <p className="max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-muted)' }}>
              A modern, cloud-native stack powers the platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {builtWith.map((tech) => (
                <span key={tech} className="glass-chip text-sm font-semibold">
                  {tech}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CLOSING CTA ───────────────────────────────────── */}
      <section className="py-20 px-4 md:px-6">
        <Reveal type="left" className="max-w-4xl mx-auto">
          <div className="p-8 md:p-10 rounded-[2rem] glass text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to start learning together?</h2>
            <p className="mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Join SkillBridge, list what you can teach and what you want to learn, and let the matching do the rest.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-semibold hover-lift">
              Create your account
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────── */}
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
            <Link to="/" className="hover-lift">Home</Link>
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
