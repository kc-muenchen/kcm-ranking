import { motion } from 'framer-motion'
import { Check } from '@phosphor-icons/react'
import { springSnappy } from '../lib/motion'

/**
 * Season picker plus the finale-qualifier filter.
 *
 * Seasons are shown as a row of chips rather than a native select - there are
 * only a handful and direct selection beats a dropdown at this count.
 */
function SeasonSelector({
  seasons,
  selectedSeason,
  onSelectSeason,
  showFinaleQualifiers,
  onToggleFinaleQualifiers
}: {
  seasons: any
  selectedSeason: any
  onSelectSeason: any
  showFinaleQualifiers: any
  onToggleFinaleQualifiers: any
}) {
  const isOn = Boolean(showFinaleQualifiers)

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-4 md:flex-row md:items-start md:justify-between md:gap-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Season</span>
        <div className="flex flex-wrap gap-1.5">
          {seasons.map((season: any) => {
            const isActive = String(selectedSeason) === String(season)
            return (
              <button
                key={season}
                type="button"
                onClick={() => onSelectSeason(String(season))}
                aria-pressed={isActive}
                className={`tactile tnum relative rounded-sm px-3 py-1.5 text-[0.9375rem] ${
                  isActive ? 'text-fg' : 'text-fg-dim hover:text-fg'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="season-active"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-sm border border-accent-dim bg-accent/10"
                  />
                )}
                <span className="relative">{season}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:items-end">
        <span className="eyebrow">Filter</span>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={() => onToggleFinaleQualifiers && onToggleFinaleQualifiers(!isOn)}
          className="tactile group flex items-start gap-2.5 text-left md:items-center"
        >
          <span
            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-xs border transition-colors md:mt-0 ${
              isOn ? 'border-accent bg-accent text-bg' : 'border-line-strong bg-surface group-hover:border-fg-faint'
            }`}
          >
            {isOn && <Check size={11} weight="bold" />}
          </span>
          <span className={`text-[0.9375rem] leading-snug ${isOn ? 'text-fg' : 'text-fg-dim'}`}>
            Finale qualifiers only
            <span className="ml-1.5 text-fg-faint">Top 20 + 5 successors, min. 10 games</span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default SeasonSelector
