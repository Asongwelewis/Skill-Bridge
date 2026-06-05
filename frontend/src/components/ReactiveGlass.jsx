import { useRef, useEffect } from 'react'

/**
 * Drops a cursor-reactive radial highlight onto any glass-panel surface.
 * Accepts an `as` prop so the semantic tag can be preserved.
 * Respects prefers-reduced-motion — degrades to static glass when set.
 */
export default function ReactiveGlass({
  children,
  className = '',
  style,
  as: Tag = 'div',
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }

    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <Tag
      ref={ref}
      className={`glass-panel reactive-glass ${className}`}
      style={style}
    >
      {children}
    </Tag>
  )
}
