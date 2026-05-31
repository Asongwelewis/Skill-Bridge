import React from 'react'
import { Award } from 'lucide-react'

const TIER = {
  gold:    { icon: 'rgba(245,158,11,0.18)',  text: '#fbbf24', border: 'rgba(245,158,11,0.35)',  ring: '#fbbf24' },
  silver:  { icon: 'rgba(148,163,184,0.18)', text: '#cbd5e1', border: 'rgba(148,163,184,0.35)', ring: '#94a3b8' },
  bronze:  { icon: 'rgba(180,83,9,0.18)',    text: '#fb923c', border: 'rgba(180,83,9,0.35)',    ring: '#f97316' },
  emerald: { icon: 'rgba(16,185,129,0.18)',  text: '#34d399', border: 'rgba(16,185,129,0.35)',  ring: '#10b981' },
}

export default function BadgeCard({ badge }) {
  const c = TIER[badge?.tier] || TIER.emerald

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-250 hover-lift"
      style={{ background: c.icon, border: `1px solid ${c.border}` }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: c.icon, boxShadow: `0 0 16px ${c.ring}40` }}>
        <Award size={22} style={{ color: c.text }} />
      </div>
      <p className="text-xs font-semibold text-center leading-tight" style={{ color: c.text }}>
        {badge?.name || 'Achievement'}
      </p>
      {badge?.earnedAt && (
        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
          {new Date(badge.earnedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
