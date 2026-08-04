import type { Transition, Variants } from 'framer-motion'

/**
 * Shared motion vocabulary.
 *
 * Everything interactive uses spring physics rather than linear easing, so the
 * UI has consistent weight. Keep these in one place - a dashboard where each
 * surface animates on its own curve reads as unfinished.
 */

/** Default spring for interactive elements: settles quickly, no overshoot wobble. */
export const spring: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20
}

/** Snappier spring for small controls (toggles, chips, icon buttons). */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30
}

/** Overshoot spring for elements that should pop on entry (badges, callouts). */
export const springPop: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 18
}

/** Parent of a staggered list. Children must live in the same client tree. */
export const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.04
    }
  }
}

/** Row/child of a staggered list. Transform and opacity only. */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: spring
  }
}

/** Standard fade-and-rise for a whole section. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
}

/** Tab panel crossfade - horizontal drift signals lateral navigation. */
export const panelIn: Variants = {
  hidden: { opacity: 0, x: 8 },
  show: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: -8, transition: { duration: 0.12 } }
}
