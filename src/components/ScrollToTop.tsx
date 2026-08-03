import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUp } from '@phosphor-icons/react'
import { springPop } from '../lib/motion'

/**
 * Scroll-to-top control with a magnetic pull toward the cursor.
 *
 * The magnetic offset runs on motion values rather than React state, so cursor
 * movement never triggers a re-render.
 */
function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(useTransform(pointerX, value => value * 0.25), { stiffness: 260, damping: 22 })
  const y = useSpring(useTransform(pointerY, value => value * 0.25), { stiffness: 260, damping: 22 })

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 300)

    toggleVisibility()
    window.addEventListener('scroll', toggleVisibility, { passive: true })

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set(event.clientX - (bounds.left + bounds.width / 2))
    pointerY.set(event.clientY - (bounds.top + bounds.height / 2))
  }

  const handlePointerLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ x, y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={springPop}
          whileTap={{ scale: 0.92 }}
          aria-label="Scroll to top"
          className="fixed bottom-5 right-5 z-40 grid h-10 w-10 place-items-center rounded-md border border-line-strong bg-surface-2/90 text-fg-dim shadow-[var(--shadow-overlay),inset_0_1px_0_var(--hairline)] backdrop-blur-md hover:border-accent hover:text-accent md:bottom-8 md:right-8"
        >
          <ArrowUp size={16} weight="bold" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default ScrollToTop
