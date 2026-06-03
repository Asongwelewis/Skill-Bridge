import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Zap, BookOpen, Repeat, Star, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../lib/api'
import { useStaggerAnimation } from '../hooks/useScrollAnimation'
import toast from 'react-hot-toast'

const PROFICIENCY = [
  { level: 1, label: 'Beginner',     color: '#f87171' },
  { level: 2, label: 'Elementary',   color: '#fb923c' },
  { level: 3, label: 'Intermediate', color: '#fbbf24' },
  { level: 4, label: 'Advanced',     color: '#34d399' },
  { level: 5, label: 'Expert',       color: '#818cf8' },
]

const MODE_ICONS  = { teach: Zap, learn: BookOpen, both: Repeat }
const MODE_COLORS = {
  teach: { border: 'rgba(79,70,229,0.4)',   bg: 'rgba(79,70,229,0.1)',   text: '#818CF8' },
  learn: { border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.1)',  text: '#34D399' },
  both:  { border: 'rgba(168,85,247,0.4)',  bg: 'rgba(168,85,247,0.1)',  text: '#C084FC' },
}

const inputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--input-text)',
}

export default function Skills() {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', mode: 'both', proficiency: 3 })
  const [saving, setSaving] = useState(false)
  const [gridRef, gridVisible, stagger] = useStaggerAnimation(9)

  const load = async () => {
    if (!user) return
    try {
      const res = await userApi.getMySkills()
      // Backend returns array of user_skills with nested skills object
      const raw = res.data?.skills || res.data || []
      const normalized = raw.map(s => ({
        id:          s.id,
        name:        s.skills?.name || s.skill_name || s.name || 'Unknown',
        category:    s.skills?.category || s.category || '',
        mode:        s.role || s.mode || 'both',
        proficiency: s.proficiency_level || s.proficiency || 3,
      }))
      setSkills(normalized)
    } catch { setSkills([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Skill name required')
    setSaving(true)
    try {
      await userApi.addMySkill({
        skill_name:        form.name,
        category:          form.category,
        role:              form.mode,
        proficiency_level: form.proficiency,
      })
      toast.success('Skill added!')
      setShowModal(false)
      setForm({ name: '', category: '', mode: 'both', proficiency: 3 })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add skill')
    } finally { setSaving(false) }
  }

  const handleDelete = async (skillId) => {
    try {
      await userApi.removeMySkill(skillId)
      toast.success('Skill removed')
      setSkills(s => s.filter(sk => sk.id !== skillId))
    } catch { toast.error('Failed to remove skill') }
  }

  const profColor = (level) => PROFICIENCY.find(p => p.level === level)?.color || '#fbbf24'
  const profLabel = (level) => PROFICIENCY.find(p => p.level === level)?.label || 'Intermediate'

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Skills</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Add skills you can teach or want to learn to get matched with peers
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
            px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25
            hover:shadow-indigo-600/40 hover:-translate-y-0.5">
          <Plus size={16} />
          Add Skill
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-36 rounded-2xl skeleton" />)}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/12 flex items-center justify-center mx-auto mb-4 animate-float">
            <Zap size={28} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No skills added yet</h3>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
            Add your first skill to start getting matched with the perfect learning partners
          </p>
          <button onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl
              text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-600/25">
            Add Your First Skill
          </button>
        </div>
      ) : (
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill, i) => {
            const ModeIcon = MODE_ICONS[skill.mode] || Repeat
            const mc = MODE_COLORS[skill.mode] || MODE_COLORS.both
            const pc = profColor(skill.proficiency)
            return (
              <div key={skill.id || i} className={`reveal ${gridVisible ? 'visible' : ''} ${stagger(i)}`}>
                <div className="p-5 rounded-2xl group relative h-full hover-lift"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                  <button onClick={() => handleDelete(skill.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200
                      hover:scale-110 p-1 rounded-lg hover:bg-red-500/15"
                    style={{ color: 'var(--text-subtle)' }}>
                    <Trash2 size={14} className="hover:text-red-400" />
                  </button>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: mc.bg }}>
                      <ModeIcon size={18} style={{ color: mc.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{skill.name}</p>
                      {skill.category && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{skill.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg border"
                      style={{ background: mc.bg, borderColor: mc.border, color: mc.text }}>
                      {skill.mode || 'both'}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array(5).fill(0).map((_, j) => (
                        <Star key={j} size={11}
                          style={{ color: j < (skill.proficiency || 3) ? '#fbbf24' : 'var(--border-2)' }}
                          fill={j < (skill.proficiency || 3) ? 'currentColor' : 'none'} />
                      ))}
                      <span className="text-xs ml-1 font-medium" style={{ color: pc }}>{profLabel(skill.proficiency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-md rounded-3xl p-6 animate-scale-in"
            style={{ background: 'var(--modal-blur)', border: '1px solid var(--border-2)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Add New Skill</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Skill Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required placeholder="e.g. Python, Guitar, UI Design"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Category</label>
                <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Programming, Music, Design"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['teach', 'learn', 'both'].map(mode => {
                    const mc = MODE_COLORS[mode]
                    const active = form.mode === mode
                    return (
                      <button key={mode} type="button" onClick={() => setForm(f => ({ ...f, mode }))}
                        className="py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          background: active ? mc.bg : 'var(--surface-3)',
                          border: `1px solid ${active ? mc.border : 'var(--border)'}`,
                          color: active ? mc.text : 'var(--text-muted)',
                        }}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Proficiency:{' '}
                  <span style={{ color: profColor(form.proficiency) }}>{profLabel(form.proficiency)}</span>
                </label>
                <div className="flex gap-2">
                  {PROFICIENCY.map(({ level, color }) => (
                    <button key={level} type="button" onClick={() => setForm(f => ({ ...f, proficiency: level }))}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: form.proficiency === level ? color + '20' : 'var(--surface-3)',
                        border: `1px solid ${form.proficiency === level ? color : 'var(--border)'}`,
                        color: form.proficiency === level ? color : 'var(--text-muted)',
                      }}>
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs mt-1 px-1" style={{ color: 'var(--text-subtle)' }}>
                  <span>Beginner</span><span>Expert</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold
                    transition-all hover:-translate-y-0.5 disabled:opacity-60">
                  {saving ? 'Adding…' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}