import { motion } from 'framer-motion'
import { User, Users } from '@phosphor-icons/react'
import { spring } from '../lib/motion'

const TYPES = [
  { id: 'doubles', label: 'Doubles', icon: Users },
  { id: 'singles', label: 'Singles', icon: User }
] as const

/** Segmented control for tournament format. */
function TournamentTypeToggle({
  tournamentType,
  onTournamentTypeChange
}: {
  tournamentType: any
  onTournamentTypeChange: any
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-md border border-line bg-surface p-0.5">
      {TYPES.map(({ id, label, icon: Icon }) => {
        const isActive = tournamentType === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTournamentTypeChange(id)}
            aria-pressed={isActive}
            className={`tactile relative flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[0.9375rem] font-medium ${
              isActive ? 'text-fg' : 'text-fg-dim hover:text-fg'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="tournament-type-active"
                transition={spring}
                className="absolute inset-0 rounded-sm border border-line-strong bg-surface-3 shadow-[inset_0_1px_0_var(--hairline)]"
              />
            )}
            <Icon size={14} weight="bold" className="relative shrink-0" />
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default TournamentTypeToggle
