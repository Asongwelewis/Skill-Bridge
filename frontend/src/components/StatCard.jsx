import React from 'react'

const PALETTE = {
  indigo:  { icon: 'rgba(79,70,229,0.15)',  text: '#818CF8', border: 'rgba(79,70,229,0.2)' },
  emerald: { icon: 'rgba(16,185,129,0.15)', text: '#34D399', border: 'rgba(16,185,129,0.2)' },
  amber:   { icon: 'rgba(245,158,11,0.15)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
  purple:  { icon: 'rgba(168,85,247,0.15)', text: '#C084FC', border: 'rgba(168,85,247,0.2)' },
}

export default function StatCard({ icon: Icon, label, value, color = 'indigo', trend }) {
  const c = PALETTE[color] || PALETTE.indigo

  return (
    <div className="rounded-2xl p-5 hover-lift theme-transition"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${c.border}`,
        boxShadow: 'var(--card-shadow)',
      }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: c.icon }}>
          <Icon size={19} style={{ color: c.text }} />
        </div>
        {trend !== undefined && (
          <span className="text-xs font-semibold px-2 py-1 rounded-lg"
            style={{
              background: trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: trend >= 0 ? '#34d399' : '#f87171',
            }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
        {label}
      </p>
    </div>
  )
}
