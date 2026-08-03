import { motion } from 'framer-motion'
import { ArrowsLeftRight, CalendarBlank, ChartLineUp, ChartBar, Medal } from '@phosphor-icons/react'
import { spring } from '../../lib/motion'

const TABS = [
  { id: 'overview', label: 'Overview', icon: ChartBar },
  { id: 'achievements', label: 'Achievements', icon: Medal },
  { id: 'performance', label: 'Performance', icon: ChartLineUp },
  { id: 'tournaments', label: 'Tournaments', icon: CalendarBlank },
  { id: 'comparison', label: 'Comparison', icon: ArrowsLeftRight }
] as const

/**
 * Player detail tab bar.
 *
 * An underline rather than a pill, so it reads as navigation rather than a
 * filter. The indicator is one shared element sliding between tabs.
 */
export const PlayerTabs = ({ activeTab, onTabChange }: { activeTab: any; onTabChange: any }) => {
  return (
    <div
      role="tablist"
      className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:gap-2 md:px-0"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(id)}
            className={`tactile relative flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[0.9375rem] font-medium transition-colors md:px-3 ${
              isActive ? 'text-fg' : 'text-fg-dim hover:text-fg'
            }`}
          >
            <Icon size={14} weight="bold" className="shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
            {isActive && (
              <motion.span
                layoutId="player-tab-active"
                transition={spring}
                className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
