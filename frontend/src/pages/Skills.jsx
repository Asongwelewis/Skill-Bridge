import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Zap, BookOpen, Repeat, Star, X, Search, Sparkles, Library } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userApi, matchingApi } from '../lib/api'
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
  const [form, setForm] = useState({ name: '', category: '', mode: 'both', proficiency: 3, skill_id: null })
  const [saving, setSaving] = useState(false)
  const [gridRef, , stagger] = useStaggerAnimation(9)

  // Skills catalog (for search/select + browse section)
  const [catalog, setCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const loadCatalog = async () => {
    if (catalog.length) return // already fetched
    setCatalogLoading(true)
    try {
      const res = await userApi.listSkills()
      const raw = res.data?.skills || res.data || []
      // Catalog rows: { id, name, category }
      setCatalog(raw.filter(s => s?.name).map(s => ({ id: s.id, name: s.name, category: s.category || 'Other' })))
    } catch {
      setCatalog([])
    } finally {
      setCatalogLoading(false)
    }
  }

  // Fetch the catalog when the add-skill modal opens.
  useEffect(() => {
    if (showModal) loadCatalog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal])

  // Catalog grouped by category (used by the browse section).
  const catalogByCategory = useMemo(() => {
    return catalog.reduce((acc, s) => {
      (acc[s.category] ||= []).push(s)
      return acc
    }, {})
  }, [catalog])

  // Live-filtered catalog for the searchable select.
  const trimmedQuery = query.trim().toLowerCase()
  const filteredCatalog = useMemo(() => {
    const list = !trimmedQuery
      ? catalog
      : catalog.filter(s =>
          s.name.toLowerCase().includes(trimmedQuery) ||
          s.category.toLowerCase().includes(trimmedQuery))
    return list.reduce((acc, s) => {
      (acc[s.category] ||= []).push(s)
      return acc
    }, {})
  }, [catalog, trimmedQuery])

  const hasExactMatch = trimmedQuery && catalog.some(s => s.name.toLowerCase() === trimmedQuery)

  const selectCatalogSkill = (s) => {
    setForm(f => ({ ...f, name: s.name, category: s.category === 'Other' ? f.category : s.category, skill_id: s.id }))
    setQuery(s.name)
    setShowDropdown(false)
  }

  const useFreeCreate = () => {
    setForm(f => ({ ...f, name: query.trim(), skill_id: null }))
    setShowDropdown(false)
  }

  const load = async () => {
    if (!user) {
      setLoading(false)
      return
    }
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

  // Fetch the catalog once on mount so the browse section can render.
  useEffect(() => { loadCatalog() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Skill name required')
    setSaving(true)
    try {
      // Prefer a catalog id when the user picked an existing skill; otherwise
      // fall back to create-by-name (backend accepts skill_name).
      await userApi.addMySkill({
        skill_id:          form.skill_id || null,
        skill_name:        form.name,
        category:          form.category,
        role:              form.mode,
        proficiency_level: form.proficiency,
      })
      toast.success('Skill added!')
      if (user?.id) {
        try {
          await matchingApi.runMatching(user.id)
        } catch {
          // Matching is best-effort; the skill is still saved.
        }
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add skill')
    } finally { setSaving(false) }
  }

  const openModal = () => {
    setForm({ name: '', category: '', mode: 'both', proficiency: 3, skill_id: null })
    setQuery('')
    setShowDropdown(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm({ name: '', category: '', mode: 'both', proficiency: 3, skill_id: null })
    setQuery('')
    setShowDropdown(false)
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
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto page-enter theme-transition" style={{ color: 'var(--text)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Skills</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Add skills you can teach or want to learn to get matched with peers
          </p>
        </div>
        <button onClick={openModal}
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
          <button onClick={openModal}
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
              <div key={skill.id || i} className={`reveal visible ${stagger(i)}`}>
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

      {/* Browse available skills — read-only catalog grouped by category */}
      {Object.keys(catalogByCategory).length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Library size={16} className="text-indigo-400" />
            <h2 className="font-semibold">Browse available skills</h2>
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{catalog.length} in catalog</span>
          </div>
          <div className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            {Object.keys(catalogByCategory).sort().map(cat => (
              <div key={cat}>
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-2" style={{ color: 'var(--text-subtle)' }}>{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {catalogByCategory[cat].map(s => (
                    <span key={s.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
              <button onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-5">
              {/* Searchable catalog select with free-create fallback */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Skill Name *</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                  <input
                    type="text"
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      setForm(f => ({ ...f, name: e.target.value, skill_id: null }))
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                    required
                    placeholder="Search skills or type a new one…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    style={inputStyle}
                  />
                  {form.skill_id && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.14)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                      In catalog
                    </span>
                  )}

                  {showDropdown && (
                    <div className="absolute z-20 left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-2xl p-2"
                      style={{ background: 'var(--modal-blur)', border: '1px solid var(--border-2)', boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}>
                      {catalogLoading ? (
                        <p className="px-3 py-3 text-xs" style={{ color: 'var(--text-subtle)' }}>Loading catalog…</p>
                      ) : (
                        <>
                          {Object.keys(filteredCatalog).sort().map(cat => (
                            <div key={cat} className="mb-1.5 last:mb-0">
                              <p className="px-2.5 pt-1.5 pb-1 text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--text-subtle)' }}>{cat}</p>
                              {filteredCatalog[cat].map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onMouseDown={e => { e.preventDefault(); selectCatalogSkill(s) }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all hover:bg-indigo-500/10"
                                  style={{ color: 'var(--text)' }}>
                                  <Sparkles size={12} className="shrink-0" style={{ color: '#818cf8' }} />
                                  <span className="truncate">{s.name}</span>
                                </button>
                              ))}
                            </div>
                          ))}

                          {trimmedQuery && !hasExactMatch && (
                            <button
                              type="button"
                              onMouseDown={e => { e.preventDefault(); useFreeCreate() }}
                              className="w-full text-left px-3 py-2 mt-1 rounded-lg text-sm flex items-center gap-2 transition-all hover:bg-indigo-500/10 border-t"
                              style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                              <Plus size={13} className="shrink-0" style={{ color: '#34d399' }} />
                              Create new skill: <span className="font-semibold truncate">“{query.trim()}”</span>
                            </button>
                          )}

                          {!catalogLoading && Object.keys(filteredCatalog).length === 0 && !trimmedQuery && (
                            <p className="px-3 py-3 text-xs" style={{ color: 'var(--text-subtle)' }}>No catalog skills yet — type to create one.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
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
                <button type="button" onClick={closeModal}
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
