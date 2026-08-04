import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from '@phosphor-icons/react'
import { spring } from '../lib/motion'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'kcm-theme'

/** What the page is actually showing right now, however it got there. */
const currentTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Light/dark switch.
 *
 * Writes `data-theme` on the root element, which the token layer keys off. Until
 * someone picks explicitly, the page follows the system preference and keeps
 * following it as that changes.
 */
export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(currentTheme())

    // Keep tracking the system setting while no explicit choice is stored.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (!localStorage.getItem(STORAGE_KEY)) setTheme(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="tactile relative flex h-7 w-[3.25rem] shrink-0 items-center rounded-full border border-line bg-surface px-0.5"
    >
      <motion.span
        layout
        transition={spring}
        className="grid h-5 w-5 place-items-center rounded-full bg-surface-3 text-fg-dim shadow-[inset_0_1px_0_var(--hairline)]"
        style={{ marginLeft: isDark ? 'auto' : 0 }}
      >
        {isDark ? <Moon size={12} weight="bold" /> : <Sun size={12} weight="bold" />}
      </motion.span>
    </button>
  )
}
