import { useEffect, useRef, useState } from 'react'

/**
 * Returns [ref, isVisible] — attach ref to any element; isVisible flips
 * true once the element enters the viewport, then stays true (fire-once).
 */
export function useScrollAnimation(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}

/**
 * Attach to a container; returns a stagger className for child index i.
 * Usage: className={`reveal ${stagger(i)} ${isVisible ? 'visible' : ''}`}
 */
export function useStaggerAnimation(count = 6, options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el) } },
      { threshold: 0.1, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const getDelay = (i) => {
    const delays = [0, 75, 150, 200, 300, 400, 500, 600, 700, 800]
    return `delay-${delays[Math.min(i, delays.length - 1)]}`
  }

  return [ref, isVisible, getDelay]
}
