import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, User, Eye, EyeOff, Sun, Moon, Sparkles, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

export default function Register() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

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
    else {
      toast.success('Account created! Check your email to confirm.')
      navigate('/skills')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/skills` },
    })
    if (error) toast.error(error.message)
    setGoogleLoading(false)
  }

  const inputClass = 'w-full pl-10 pr-4 py-3 rounded-[1.1rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all duration-200'

  return (
    <div className="h-screen theme-transition overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-8rem] left-[-4rem] h-[22rem] w-[22rem] rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-[24rem] w-[24rem] rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.14) 0%, transparent 70%)', animationDelay: '1.2s' }} />
      </div>

      <div className="relative z-10 grid h-screen grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:flex flex-col justify-between p-10 xl:p-12 order-2">
          {/* Brand panel: dark glass gradient in BOTH themes so the white text reads. */}
          <div className="glass-panel card-3d h-full p-8 xl:p-10 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0a0918 0%, #141228 60%, #1a1938 100%)', borderColor: 'rgba(129,140,248,0.18)' }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-14 left-10 h-52 w-52 rounded-full blur-3xl animate-slow-float"
                style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)' }} />
              <div className="absolute bottom-12 right-10 h-44 w-44 rounded-full blur-3xl animate-slow-float"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)', animationDelay: '1.4s' }} />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="glass-chip inline-flex mb-6">
                  <Sparkles size={13} />
                  Create your workspace
                </div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-[1rem_1.25rem_1rem_1.25rem] bg-indigo-500/20 border border-white/10 flex items-center justify-center">
                    <Brain size={20} className="text-indigo-200" />
                  </div>
                  <span className="text-white/90 font-semibold text-lg">SkillBridge</span>
                </div>

                <h2 className="max-w-md text-4xl xl:text-5xl font-semibold leading-tight text-white mb-4">
                  Start your
                  <br />
                  learning journey.
                </h2>
                <p className="max-w-md text-white/65 leading-relaxed mb-8">
                  Join a peer-learning space designed to feel calm, spatial, and actually fun to use.
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {[
                    { value: '10K+', label: 'Learners' },
                    { value: 'Free', label: 'To Start' },
                    { value: '200+', label: 'Skills' },
                    { value: 'AI', label: 'Quizzes' },
                  ].map(item => (
                    <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-white/8 backdrop-blur-lg p-4">
                      <p className="text-white text-xl font-semibold">{item.value}</p>
                      <p className="text-white/50 text-xs mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-chip max-w-md justify-start">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Build skills, meet peers, and keep momentum.
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-8 md:px-8 order-1 overflow-y-auto">
          <button
            onClick={toggleTheme}
            className="absolute top-6 right-6 workspace-button z-10"
            style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            {isDark ? <Sun size={15} className="text-amber-300" /> : <Moon size={15} className="text-indigo-300" />}
          </button>

          <div className="w-full max-w-md">
            <div className="glass-panel card-3d p-6 md:p-7">
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-[1rem_1.25rem_1rem_1.25rem] bg-indigo-500/20 border border-white/10 flex items-center justify-center">
                  <Brain size={16} className="text-indigo-300" />
                </div>
                <span className="font-semibold text-lg">SkillBridge</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold mb-2">Create your account</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-300 hover:text-indigo-200 font-medium transition-colors">
                  Sign in
                </Link>
              </p>

              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="workspace-button w-full justify-center mb-6 py-3 text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <GoogleIcon />
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs rounded-full" style={{ background: 'var(--bg)', color: 'var(--text-subtle)' }}>
                    or register with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {[
                  { label: 'Full Name', key: 'name', type: 'text', Icon: User, placeholder: 'Alex Johnson' },
                  { label: 'Email', key: 'email', type: 'email', Icon: Mail, placeholder: 'you@example.com' },
                ].map(({ label, key, type, Icon, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
                    <div className="relative">
                      <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
                      <input
                        type={type}
                        value={form[key]}
                        onChange={set(key)}
                        required
                        placeholder={placeholder}
                        className={inputClass}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--input-text)' }}
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
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form[key]}
                        onChange={set(key)}
                        required
                        placeholder={placeholder}
                        className={inputClass + (key === 'password' ? ' pr-11' : '')}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--input-text)' }}
                      />
                      {key === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                          style={{ color: 'var(--text-subtle)' }}
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={loading}
                  className="workspace-button w-full justify-center py-3 mt-2 text-sm"
                  style={{ background: 'rgba(79,70,229,0.22)', borderColor: 'rgba(129,140,248,0.25)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <p className="text-xs text-center pt-1" style={{ color: 'var(--text-subtle)' }}>
                  By registering you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
