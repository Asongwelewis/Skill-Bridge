import React, { useEffect, useRef } from 'react'

/**
 * Site-wide custom cursor: a sharp dot plus a softer trailing glow that follows
 * the mouse. Mounted once at the app root so it renders on every page.
 *
 * - Only activates on fine pointers (mouse/trackpad); touch devices are left
 *   completely untouched (no listeners, no layers — see the CSS media queries).
 * - Movement is transform-based and driven by requestAnimationFrame, so it never
 *   triggers React re-renders.
 * - Respects prefers-reduced-motion by snapping (no eased trail).
 * - Layers are position:fixed + pointer-events:none + high z-index, so they
 *   never introduce scrollbars or intercept clicks (carets keep working).
 */
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], .workspace-button'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dot = dotRef.current
    const glow = glowRef.current

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let gx = mx
    let gy = my
    let raf = 0
    let shown = false

    const reveal = () => {
      if (shown) return
      shown = true
      if (dot) dot.style.opacity = '1'
      if (glow) glow.style.opacity = '1'
    }

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      reveal()
      if (reduce) {
        if (dot) dot.style.transform = `translate3d(${mx - 5}px, ${my - 5}px, 0)`
        if (glow) glow.style.transform = `translate3d(${mx - 52}px, ${my - 52}px, 0)`
      }
    }

    const tick = () => {
      if (dot) dot.style.transform = `translate3d(${mx - 5}px, ${my - 5}px, 0)`
      gx += (mx - gx) * 0.18
      gy += (my - gy) * 0.18
      if (glow) glow.style.transform = `translate3d(${gx - 52}px, ${gy - 52}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    const onLeave = () => {
      shown = false
      if (dot) dot.style.opacity = '0'
      if (glow) glow.style.opacity = '0'
    }
    const onDown = () => dot?.classList.add('cursor-active')
    const onUp = () => dot?.classList.remove('cursor-active')
    const onOver = (e) => {
      const hit = e.target?.closest?.(INTERACTIVE)
      dot?.classList.toggle('cursor-hover', !!hit)
      glow?.classList.toggle('cursor-hover', !!hit)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)

    if (!reduce) raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={glowRef} className="landing-cursor-glow" aria-hidden="true" />
      <div ref={dotRef} className="landing-cursor-dot" aria-hidden="true" />
    </>
  )
}
