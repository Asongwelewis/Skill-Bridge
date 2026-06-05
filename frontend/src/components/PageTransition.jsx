import { motion } from 'framer-motion'

// Full-page standalone routes — wipe-mask reveal from left edge
const pageVariants = {
  initial: { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
  animate: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
}

// Inner sidebar pages — slide-up reveal, exit faster than enter
const innerVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
}

export default function PageTransition({ children, variant = 'page' }) {
  const variants = variant === 'inner' ? innerVariants : pageVariants
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%', minHeight: '100%', willChange: 'opacity, transform, clip-path' }}
    >
      {children}
    </motion.div>
  )
}
