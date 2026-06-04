import React, { useState } from 'react'

/**
 * Shared avatar that renders a profile image when available and gracefully
 * falls back to initials. Keeps the angular glass shape consistent across the app.
 *
 * @param {string} [src]    - avatar image URL (e.g. Google profile picture)
 * @param {string} [name]   - display name / email used for initials + alt text
 * @param {number} [size]   - pixel size of the square avatar (default 40)
 * @param {string} [className] - extra classes (e.g. ring/border treatments)
 * @param {string} [shape]  - border-radius for the angular glass look
 */
export default function Avatar({
  src,
  name = '',
  size = 40,
  className = '',
  shape = '0.9rem 1.1rem 0.9rem 1.1rem',
}) {
  const [errored, setErrored] = useState(false)

  const initials = (name || 'U')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  const dims = { width: size, height: size, borderRadius: shape }

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name || 'Profile'}
        onError={() => setErrored(true)}
        className={`object-cover shrink-0 border border-white/10 ${className}`}
        style={dims}
      />
    )
  }

  return (
    <div
      className={`bg-white/10 border border-white/10 flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
      style={{ ...dims, fontSize: Math.max(11, size * 0.34) }}
      aria-label={name || 'Profile'}
    >
      {initials}
    </div>
  )
}
