import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, User, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function Register() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    })
    if (error) toast.error(error.message)
    else { toast.success('Account created! Check your email to confirm.'); navigate('/skills') }
    setLoading(false)
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/skills` },
    })
    if (error) toast.error(error.message)
  }

  const inputClass = `w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none
    focus:ring-2 focus:ring-indigo-500/40 transition-all duration-200`

  return (
    <div className="min-h-screen flex theme-transition" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Left panel ─── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-40 left-16 w-72 h-72 rounded-full animate-float"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', animationDelay: '1s' }} />
          <div className="absolute bottom-32 right-12 w-60 h-60 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="flex items-center gap-3 relative animate-slide-down">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Brain size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">SkillBridge</span>
        </div>

        <div className="relative">
          <h2 className="animate-slide-up delay-100 text-4xl font-bold text-white mb-4 leading-tight">
            Start your<br />
            <span className="gradient-text">learning journey.</span>
          </h2>
          <p className="animate-slide-up delay-200 text-gray-400 leading-relaxed mb-8">
            Join a community of thousands who teach what they know and learn what they love.
          </p>
          <div className="grid grid-cols-2 gap-3 animate-slide-up delay-300">
            {[{ v: '10K+', l: 'Learners' }, { v: 'Free', l: 'To Start' }, { v: '200+', l: 'Skills' }, { v: 'AI', l: 'Quizzes' }].map(({ v, l }) => (
              <div key={l} className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xl font-bold text-white">{v}</p>
                <p className="text-gray-400 text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-sm relative">© 2025 SkillBridge</p>
      </div>

      {/* ── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <button onClick={toggleTheme}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-500" />}
        </button>

        <div className="w-full max-w-md animate-scale-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">SkillBridge</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
          </p>

          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium
              transition-all duration-200 hover:-translate-y-0.5 mb-6"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-2)',
              color: 'var(--text)',
              boxShadow: 'var(--card-shadow)',
            }}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs" style={{ background: 'var(--bg)', color: 'var(--text-subtle)' }}>
                or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', Icon: User, placeholder: 'Alex Johnson' },
              { label: 'Email',     key: 'email', type: 'email', Icon: Mail, placeholder: 'you@example.com' },
            ].map(({ label, key, type, Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                  <input type={type} value={form[key]} onChange={set(key)} required placeholder={placeholder}
                    className={inputClass}
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                  />
                </div>
              </div>
            ))}

            {[
              { label: 'Password', key: 'password', placeholder: 'Min. 6 characters' },
              { label: 'Confirm Password', key: 'confirm', placeholder: '••••••••' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                  <input type={showPass ? 'text' : 'password'} value={form[key]} onChange={set(key)} required
                    placeholder={placeholder}
                    className={inputClass + (key === 'password' ? ' pr-11' : '')}
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                  />
                  {key === 'password' && (
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                      style={{ color: 'var(--text-subtle)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm
                transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40
                hover:-translate-y-0.5 disabled:opacity-60 mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </span>
                : 'Create Account'}
            </button>

            <p className="text-xs text-center pt-1" style={{ color: 'var(--text-subtle)' }}>
              By registering you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
