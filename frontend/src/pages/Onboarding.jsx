import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Brain, Sparkles, ArrowRight, ArrowLeft, Check, Plus, Zap, BookOpen, Repeat,
  Video, Award, Users, Star, Globe,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userApi, matchingApi } from '../lib/api'
import toast from 'react-hot-toast'

import howItWorksImg from '../assets/How it works.png'
import welcomeImg from '../assets/Welcome-rafiki.png'
import dataExtractionImg from '../assets/Data extraction-amico.png'

const PROFICIENCY = [
  { level: 1, label: 'Beginner',     color: '#f87171' },
  { level: 2, label: 'Elementary',   color: '#fb923c' },
  { level: 3, label: 'Intermediate', color: '#fbbf24' },
  { level: 4, label: 'Advanced',     color: '#34d399' },
  { level: 5, label: 'Expert',       color: '#818cf8' },
]

const MODE_COLORS = {
  teach: { border: 'rgba(79,70,229,0.4)',   bg: 'rgba(79,70,229,0.1)',   text: '#818CF8' },
  learn: { border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.1)',  text: '#34D399' },
  both:  { border: 'rgba(168,85,247,0.4)',  bg: 'rgba(168,85,247,0.1)',  text: '#C084FC' },
}

const HOW_IT_WORKS = [
  { icon: Zap, title: 'Post your skills', desc: 'Add what you can teach and what you want to learn.' },
  { icon: Users, title: 'Get matched', desc: 'We pair you with peers who complement your goals.' },
  { icon: Video, title: 'Live video session', desc: 'Meet your match in the browser — no downloads.' },
  { icon: Brain, title: 'AI quiz', desc: 'Each session ends with a quick knowledge check.' },
  { icon: Award, title: 'Earn badges', desc: 'Pass quizzes to collect XP and achievements.' },
]

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Africa/Cairo', 'Africa/Lagos', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland',
]

const STEPS = [
  { n: 1, label: 'Welcome' },
  { n: 2, label: 'Profile' },
  { n: 3, label: 'First skill' },
]

const inputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--input-text)',
}

const profColor = (level) => PROFICIENCY.find(p => p.level === level)?.color || '#fbbf24'
const profLabel = (level) => PROFICIENCY.find(p => p.level === level)?.label || 'Intermediate'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, profileLoaded, refreshProfile } = useAuth()

  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
  }, [])
  const tzOptions = useMemo(() => Array.from(new Set([detectedTz, ...TIMEZONES])), [detectedTz])

  const [step, setStep] = useState(1)
  const [profileForm, setProfileForm] = useState({ full_name: '', bio: '', timezone: detectedTz })
  const [savingProfile, setSavingProfile] = useState(false)
  const [skillForm, setSkillForm] = useState({ name: '', category: '', mode: 'both', proficiency: 3 })
  const [addedSkills, setAddedSkills] = useState([])
  const [savingSkill, setSavingSkill] = useState(false)
  const [finishing, setFinishing] = useState(false)

  // Prefill the profile fields once, after the profile has loaded.
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !profileLoaded) return
    prefilled.current = true
    setProfileForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      bio: profile?.bio || '',
      timezone: profile?.timezone || detectedTz,
    })
  }, [profileLoaded, profile, user, detectedTz])

  // Already onboarded users should never see the wizard.
  if (profileLoaded && profile?.onboarded) return <Navigate to="/dashboard" replace />

  const handleProfileContinue = async () => {
    if (!profileForm.full_name.trim()) return toast.error('Please enter your name')
    setSavingProfile(true)
    try {
      await userApi.updateProfile(user.id, {
        full_name: profileForm.full_name.trim(),
        bio: profileForm.bio.trim(),
        timezone: profileForm.timezone,
      })
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save your profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!skillForm.name.trim()) return toast.error('Skill name required')
    setSavingSkill(true)
    try {
      await userApi.addMySkill({
        skill_name: skillForm.name,
        category: skillForm.category,
        role: skillForm.mode,
        proficiency_level: skillForm.proficiency,
      })
      if (user?.id) {
        try { await matchingApi.runMatching(user.id) } catch { /* matching is best-effort */ }
      }
      setAddedSkills(s => [...s, {
        name: skillForm.name.trim(),
        category: skillForm.category.trim(),
        mode: skillForm.mode,
        proficiency: skillForm.proficiency,
      }])
      setSkillForm({ name: '', category: '', mode: 'both', proficiency: 3 })
      toast.success('Skill added!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add skill')
    } finally {
      setSavingSkill(false)
    }
  }

  const handleFinish = async () => {
    if (addedSkills.length === 0) return toast.error('Add at least one skill to finish')
    setFinishing(true)
    try {
      await userApi.updateProfile(user.id, {
        onboarded: true,
        full_name: profileForm.full_name.trim(),
        bio: profileForm.bio.trim(),
        timezone: profileForm.timezone,
      })
      await refreshProfile()
      toast.success("You're all set! 🎉")
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not complete onboarding')
      setFinishing(false)
    }
  }

  return (
    <div className="min-h-screen theme-transition overflow-hidden relative" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Ambient glows — same language as Login/Register */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.14) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-8rem] left-[-5rem] h-[20rem] w-[20rem] rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)', animationDelay: '1.2s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 md:py-10">
        <div className="w-full max-w-3xl">
          {/* Brand + progress indicator */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[1rem_1.25rem_1rem_1.25rem] bg-indigo-500/20 border border-white/10 flex items-center justify-center">
              <Brain size={18} className="text-indigo-300" />
            </div>
            <span className="font-semibold text-lg">SkillBridge</span>
            <span className="ml-auto text-xs" style={{ color: 'var(--text-subtle)' }}>Step {step} of 3</span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {STEPS.map(({ n, label }, i) => {
              const active = step === n
              const done = step > n
              return (
                <React.Fragment key={n}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                      style={{
                        background: done ? 'rgba(16,185,129,0.18)' : active ? 'rgba(79,70,229,0.22)' : 'var(--surface-3)',
                        border: `1px solid ${done ? 'rgba(16,185,129,0.4)' : active ? 'rgba(129,140,248,0.4)' : 'var(--border)'}`,
                        color: done ? '#34d399' : active ? '#fff' : 'var(--text-muted)',
                      }}>
                      {done ? <Check size={14} /> : n}
                    </div>
                    <span className="hidden sm:block text-xs font-medium"
                      style={{ color: active ? 'var(--text)' : 'var(--text-subtle)' }}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px rounded-full" style={{ background: step > n ? 'rgba(16,185,129,0.4)' : 'var(--border-2)' }} />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          <div className="glass-panel card-3d p-6 md:p-8 animate-scale-in">
            {/* ─── STEP 1 — Welcome / How it works ─── */}
            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div className="order-2 md:order-1">
                  <div className="glass-chip inline-flex mb-4">
                    <Sparkles size={12} />
                    Welcome aboard
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold mb-3 leading-tight">
                    Learn and teach,<br />the SkillBridge way.
                  </h1>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                    A quick tour of how peer learning flows here — then we'll set up your profile and first skill.
                  </p>
                  <div className="space-y-3 mb-6">
                    {HOW_IT_WORKS.map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-[0.8rem] flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(129,140,248,0.2)' }}>
                          <Icon size={15} className="text-indigo-300" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)} className="workspace-button w-full justify-center py-3 text-sm"
                    style={{ background: 'rgba(79,70,229,0.22)', borderColor: 'rgba(129,140,248,0.25)' }}>
                    Get started
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="order-1 md:order-2 flex items-center justify-center">
                  <img src={howItWorksImg} alt="How SkillBridge works"
                    className="w-full max-w-xs md:max-w-sm max-h-56 md:max-h-none object-contain animate-float" />
                </div>
              </div>
            )}

            {/* ─── STEP 2 — Personalize profile ─── */}
            {step === 2 && (
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div className="hidden md:flex items-center justify-center">
                  <img src={welcomeImg} alt="Personalize your profile"
                    className="w-full max-w-sm max-h-none object-contain animate-float" />
                </div>
                <div>
                  <div className="glass-chip inline-flex mb-4">
                    <Sparkles size={12} />
                    Step 2 of 3
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold mb-2 leading-tight">Personalize your profile</h1>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                    Tell peers who you are and when you're usually available.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Full name *</label>
                      <input type="text" value={profileForm.full_name}
                        onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="e.g. Alex Chen"
                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                        style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Bio</label>
                      <textarea rows={3} value={profileForm.bio}
                        onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                        placeholder="A sentence or two about what you're into…"
                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none"
                        style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Timezone</label>
                      <div className="relative">
                        <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                        <select value={profileForm.timezone}
                          onChange={e => setProfileForm(f => ({ ...f, timezone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none"
                          style={inputStyle}>
                          {tzOptions.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button onClick={() => setStep(1)} className="workspace-button text-sm"
                      style={{ background: 'var(--surface-3)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      <ArrowLeft size={15} />
                      Back
                    </button>
                    <button onClick={handleProfileContinue} disabled={savingProfile}
                      className="workspace-button flex-1 justify-center text-sm disabled:opacity-60"
                      style={{ background: 'rgba(79,70,229,0.22)', borderColor: 'rgba(129,140,248,0.25)' }}>
                      {savingProfile ? 'Saving…' : 'Continue'}
                      {!savingProfile && <ArrowRight size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 3 — Add your first skill (gate) ─── */}
            {step === 3 && (
              <div>
                <div className="grid md:grid-cols-[1fr_0.8fr] gap-6 md:gap-8 items-start">
                  <div>
                    <div className="glass-chip inline-flex mb-4">
                      <Sparkles size={12} />
                      Final step
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold mb-2 leading-tight">Add your first skill</h1>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                      Add at least one skill to teach or learn so we can start finding your matches. You can add more.
                    </p>

                    <form onSubmit={handleAddSkill} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Skill name *</label>
                        <input type="text" value={skillForm.name}
                          onChange={e => setSkillForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Python, Guitar, UI Design"
                          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                          style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Category</label>
                        <input type="text" value={skillForm.category}
                          onChange={e => setSkillForm(f => ({ ...f, category: e.target.value }))}
                          placeholder="e.g. Programming, Music, Design"
                          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                          style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Role</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { mode: 'teach', Icon: Zap }, { mode: 'learn', Icon: BookOpen }, { mode: 'both', Icon: Repeat },
                          ].map(({ mode, Icon }) => {
                            const mc = MODE_COLORS[mode]
                            const active = skillForm.mode === mode
                            return (
                              <button key={mode} type="button" onClick={() => setSkillForm(f => ({ ...f, mode }))}
                                className="py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                                style={{
                                  background: active ? mc.bg : 'var(--surface-3)',
                                  border: `1px solid ${active ? mc.border : 'var(--border)'}`,
                                  color: active ? mc.text : 'var(--text-muted)',
                                }}>
                                <Icon size={13} />
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Proficiency: <span style={{ color: profColor(skillForm.proficiency) }}>{profLabel(skillForm.proficiency)}</span>
                        </label>
                        <div className="flex gap-2">
                          {PROFICIENCY.map(({ level, color }) => (
                            <button key={level} type="button" onClick={() => setSkillForm(f => ({ ...f, proficiency: level }))}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                              style={{
                                background: skillForm.proficiency === level ? color + '20' : 'var(--surface-3)',
                                border: `1px solid ${skillForm.proficiency === level ? color : 'var(--border)'}`,
                                color: skillForm.proficiency === level ? color : 'var(--text-muted)',
                              }}>
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button type="submit" disabled={savingSkill}
                        className="workspace-button w-full justify-center text-sm disabled:opacity-60"
                        style={{ background: 'rgba(16,185,129,0.16)', borderColor: 'rgba(16,185,129,0.28)', color: '#34d399' }}>
                        <Plus size={15} />
                        {savingSkill ? 'Adding…' : 'Add skill'}
                      </button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <div className="hidden md:flex items-center justify-center">
                      <img src={dataExtractionImg} alt="Add your first skill"
                        className="w-full max-w-xs max-h-48 object-contain animate-float" />
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-subtle)' }}>
                        Added skills ({addedSkills.length})
                      </p>
                      {addedSkills.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No skills yet — add one to continue.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {addedSkills.map((s, i) => {
                            const mc = MODE_COLORS[s.mode] || MODE_COLORS.both
                            return (
                              <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
                                style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}>
                                <Star size={11} />
                                {s.name}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => setStep(2)} className="workspace-button text-sm"
                    style={{ background: 'var(--surface-3)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={15} />
                    Back
                  </button>
                  <button onClick={handleFinish} disabled={finishing || addedSkills.length === 0}
                    className="workspace-button flex-1 justify-center text-sm"
                    style={{
                      background: addedSkills.length === 0 ? 'var(--surface-3)' : 'rgba(16,185,129,0.85)',
                      borderColor: addedSkills.length === 0 ? 'var(--border)' : 'rgba(16,185,129,0.30)',
                      color: addedSkills.length === 0 ? 'var(--text-muted)' : '#fff',
                      opacity: finishing ? 0.6 : 1,
                    }}>
                    <Check size={15} />
                    {finishing ? 'Finishing…' : 'Finish & go to dashboard'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
