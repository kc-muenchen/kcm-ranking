import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CaretRight, Info, Trophy } from '@phosphor-icons/react'
import { spring, springSnappy, staggerChild, staggerParent } from '../lib/motion'

/**
 * Collapsible explainer for the finale qualification rules.
 * Height animates via Framer's auto layout rather than a max-height hack.
 */
export const QualificationInfoBox = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setIsExpanded(open => !open)}
        aria-expanded={isExpanded}
        className="tactile group flex w-full items-center gap-2 py-3 text-left"
      >
        <Info size={14} weight="bold" className="shrink-0 text-fg-faint group-hover:text-accent" />
        <span className="text-[0.9375rem] font-medium text-fg-dim group-hover:text-fg">
          Season finale qualification rules
        </span>
        <motion.span
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={springSnappy}
          className="ml-auto flex text-fg-faint"
        >
          <CaretRight size={12} weight="bold" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pb-5 text-[0.9375rem] leading-relaxed text-fg-dim md:max-w-[70ch]">
              <ul className="flex flex-col gap-2">
                <li className="flex gap-2.5">
                  <span className="tnum shrink-0 text-fg-faint">01</span>
                  <span>
                    Minimum <span className="tnum text-fg">10</span> tournament attendances to qualify.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="tnum shrink-0 text-fg-faint">02</span>
                  <span>
                    Top <span className="tnum text-fg">20</span> players are{' '}
                    <span className="rounded-xs border border-up/40 px-1 py-px text-[0.9375rem] font-medium uppercase tracking-wide text-up">
                      qualified
                    </span>
                    .
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="tnum shrink-0 text-fg-faint">03</span>
                  <span>
                    Next <span className="tnum text-fg">5</span> are{' '}
                    <span className="rounded-xs border border-warn/40 px-1 py-px text-[0.9375rem] font-medium uppercase tracking-wide text-warn">
                      successors
                    </span>{' '}
                    if a spot opens.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="tnum shrink-0 text-fg-faint">04</span>
                  <span>
                    Points by final placement — 1st <span className="tnum text-fg">25</span>, 2nd{' '}
                    <span className="tnum text-fg">20</span>, 3rd <span className="tnum text-fg">16</span>, 4th{' '}
                    <span className="tnum text-fg">13</span>, 5th <span className="tnum text-fg">10</span> — plus{' '}
                    <span className="tnum text-fg">1</span> attendance point for everyone. Places 5&ndash;16 all
                    receive <span className="tnum text-fg">11</span>.
                  </span>
                </li>
              </ul>
              <p className="border-l-2 border-line pl-3 text-fg-faint">
                Standings sort by season points, then TrueSkill, then total points.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Season final result.
 *
 * The old version staged a gold/silver/bronze podium with gradient glows. This
 * lists the finishing teams as ranked rows - the rank does the work.
 */
export const SeasonFinalBanner = ({ seasonFinal, onViewFinal }: { seasonFinal: any; onViewFinal: any }) => {
  if (!seasonFinal) return null

  const topTeams: Array<{ place: number; players: string[] }> = []
  if (
    seasonFinal.data?.eliminations &&
    Array.isArray(seasonFinal.data.eliminations) &&
    seasonFinal.data.eliminations.length > 0
  ) {
    const eliminationStandings = seasonFinal.data.eliminations[0].standings || []

    const playersByPlace = new Map<number, string[]>()
    eliminationStandings
      .filter((player: any) => player && player.stats && !player.removed && player.stats.place <= 3)
      .forEach((player: any) => {
        const place = player.stats.place
        if (!playersByPlace.has(place)) playersByPlace.set(place, [])
        playersByPlace.get(place)!.push(player.name)
      })

    Array.from(playersByPlace.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([place, players]) => topTeams.push({ place, players }))
  }

  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Trophy size={14} weight="bold" className="text-accent" />
            <span className="eyebrow">Season final</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">{seasonFinal.name}</h2>
          <p className="tnum text-[0.875rem] text-fg-faint">
            {new Date(seasonFinal.date).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'short',
              day: '2-digit'
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={onViewFinal}
          className="tactile group inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-line-strong bg-surface px-3 py-2 text-[0.9375rem] font-medium text-fg-dim hover:border-accent hover:text-accent"
        >
          View tournament
          <ArrowRight
            size={13}
            weight="bold"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {topTeams.length > 0 && (
        <motion.ol variants={staggerParent} initial="hidden" animate="show" className="flex flex-col">
          {topTeams.map(team => (
            <motion.li
              key={team.place}
              variants={staggerChild}
              className={`flex items-baseline gap-4 border-b border-line py-2.5 ${
                team.place === 1 ? 'border-l-2 border-l-accent pl-2.5' : 'border-l-2 border-l-transparent pl-2.5'
              }`}
            >
              <span
                className={`tnum w-6 shrink-0 text-sm ${team.place === 1 ? 'font-semibold text-fg' : 'text-fg-dim'}`}
              >
                {String(team.place).padStart(2, '0')}
              </span>
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                {team.players.map((player: string, index: number) => (
                  <span key={player}>
                    <span className={`text-sm ${team.place === 1 ? 'font-medium text-fg' : 'text-fg-dim'}`}>
                      {player}
                    </span>
                    {index < team.players.length - 1 && <span className="ml-2 text-fg-faint">/</span>}
                  </span>
                ))}
              </span>
            </motion.li>
          ))}
        </motion.ol>
      )}

      <p className="max-w-[70ch] border-l-2 border-line pl-3 text-[0.9375rem] leading-relaxed text-fg-faint">
        This season has concluded. Tournaments after this date do not count toward season points, and the final itself
        is excluded from season ranking calculations.
      </p>
    </section>
  )
}

/** Season overview: rules explainer plus the final result when one exists. */
export const SeasonView = ({
  tournaments,
  selectedSeason,
  seasonFinal,
  onViewFinal
}: {
  tournaments: any
  selectedSeason: any
  seasonFinal: any
  onViewFinal: any
}) => {
  void tournaments
  return (
    <div className="flex flex-col gap-2">
      <QualificationInfoBox />
      {selectedSeason && <SeasonFinalBanner seasonFinal={seasonFinal} onViewFinal={onViewFinal} />}
    </div>
  )
}
