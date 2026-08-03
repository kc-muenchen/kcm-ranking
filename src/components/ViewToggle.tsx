import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarBlank, CaretDown, ChartBar, Target, Trophy, Wrench } from '@phosphor-icons/react'
import { spring, springSnappy } from '../lib/motion'

const VIEWS = [
  { id: 'overall', label: 'Overall', icon: Trophy },
  { id: 'season', label: 'Season', icon: ChartBar },
  { id: 'tournament', label: 'Tournament', icon: CalendarBlank }
] as const

const TOOLS = [{ id: 'probability', label: 'Match Probability', icon: Target }] as const

/**
 * Primary view switcher.
 *
 * A segmented control where the active pill is a single shared element moving
 * between slots via layoutId, rather than three independently fading backgrounds.
 */
function ViewToggle({ viewMode, onViewModeChange }: { viewMode: any; onViewModeChange: any }) {
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isToolsOpen) return undefined

    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsToolsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isToolsOpen])

  const isToolActive = TOOLS.some(tool => tool.id === viewMode)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full gap-0.5 rounded-md border border-line bg-surface p-0.5 sm:w-auto">
        {VIEWS.map(({ id, label, icon: Icon }) => {
          const isActive = viewMode === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onViewModeChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`tactile relative flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-[0.9375rem] font-medium sm:flex-none ${
                isActive ? 'text-fg' : 'text-fg-dim hover:text-fg'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="view-toggle-active"
                  transition={spring}
                  className="absolute inset-0 rounded-sm border border-line-strong bg-surface-3 shadow-[inset_0_1px_0_var(--hairline)]"
                />
              )}
              <Icon size={14} weight="bold" className="relative shrink-0" />
              <span className="relative whitespace-nowrap">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="relative" ref={toolsRef}>
        <button
          type="button"
          onClick={() => setIsToolsOpen(open => !open)}
          aria-expanded={isToolsOpen}
          aria-haspopup="menu"
          className={`tactile flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-[0.9375rem] font-medium sm:w-auto sm:py-1.5 ${
            isToolActive
              ? 'border-accent-dim bg-accent/10 text-accent'
              : 'border-line bg-surface text-fg-dim hover:border-line-strong hover:text-fg'
          }`}
        >
          <Wrench size={14} weight="bold" />
          Tools
          <motion.span animate={{ rotate: isToolsOpen ? 180 : 0 }} transition={springSnappy} className="flex">
            <CaretDown size={12} weight="bold" />
          </motion.span>
        </button>

        <AnimatePresence>
          {isToolsOpen && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={springSnappy}
              className="absolute right-0 z-20 mt-1.5 w-full min-w-[13rem] origin-top overflow-hidden rounded-md border border-line-strong bg-surface-2 shadow-[var(--shadow-overlay)] sm:w-auto"
            >
              {TOOLS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onViewModeChange(id)
                    setIsToolsOpen(false)
                  }}
                  className={`tactile flex w-full items-center gap-2 px-3 py-2 text-left text-[0.9375rem] ${
                    viewMode === id ? 'bg-accent/10 text-accent' : 'text-fg-dim hover:bg-surface-3 hover:text-fg'
                  }`}
                >
                  <Icon size={14} weight="bold" />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ViewToggle
