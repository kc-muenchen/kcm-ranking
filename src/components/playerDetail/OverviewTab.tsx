import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretRight } from '@phosphor-icons/react'
import { spring, springSnappy, staggerChild, staggerParent } from '../../lib/motion'

/** A ranked person row - shared by partners and opponents, which are structurally identical. */
const PersonRow = ({
  index,
  name,
  record,
  trailing,
  tone
}: {
  index: number
  name: string
  record: string
  trailing: string
  tone: 'up' | 'down'
}) => (
  <motion.li variants={staggerChild} className="flex items-baseline gap-3 border-b border-line py-2.5">
    <span className="tnum w-5 shrink-0 text-[0.875rem] text-fg-faint">{index + 1}</span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[0.9375rem] font-medium text-fg">{name}</span>
      <span className="tnum block text-[0.875rem] text-fg-faint">{record}</span>
    </span>
    <span className={`tnum shrink-0 text-sm font-semibold ${tone === 'up' ? 'text-up' : 'text-down'}`}>
      {trailing}
    </span>
  </motion.li>
)

/** Small heading + empty-state wrapper for each block on this tab. */
const Block = ({
  title,
  isEmpty,
  emptyText,
  children
}: {
  title: string
  isEmpty: boolean
  emptyText: string
  children: React.ReactNode
}) => (
  <section className="flex flex-col gap-2">
    <h3 className="eyebrow border-b border-line pb-2">{title}</h3>
    {isEmpty ? <p className="py-6 text-[0.9375rem] text-fg-faint">{emptyText}</p> : children}
  </section>
)

/**
 * Overview: podium record, regular partners, and the opponents this player
 * beats and loses to most.
 */
export const OverviewTab = ({
  bestRankingStats,
  topPartners,
  opponentStats,
  onTournamentClick
}: {
  bestRankingStats: any
  topPartners: any
  opponentStats: any
  onTournamentClick: any
}) => {
  const [expandedPlaces, setExpandedPlaces] = useState<Set<any>>(new Set())

  const togglePlace = (place: any) => {
    setExpandedPlaces(prev => {
      const next = new Set(prev)
      if (next.has(place)) next.delete(place)
      else next.add(place)
      return next
    })
  }

  const podiumFinishes = bestRankingStats.filter((ranking: any) => ranking.place <= 3)

  return (
    <div className="flex flex-col gap-8">
      {/* Asymmetric split - the partner list carries more weight than the podium tally. */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.35fr] md:gap-10">
        <Block title="Podium finishes" isEmpty={podiumFinishes.length === 0} emptyText="No podium finishes yet.">
          <ul className="flex flex-col">
            {podiumFinishes.map((ranking: any) => {
              const isOpen = expandedPlaces.has(ranking.place)
              return (
                <li key={ranking.place} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => togglePlace(ranking.place)}
                    aria-expanded={isOpen}
                    className={`tactile flex w-full items-baseline gap-3 border-l-2 py-2.5 pl-2.5 text-left ${
                      ranking.place === 1 ? 'border-l-accent' : 'border-l-transparent'
                    }`}
                  >
                    <span
                      className={`tnum w-5 shrink-0 text-sm ${
                        ranking.place === 1 ? 'font-semibold text-fg' : 'text-fg-dim'
                      }`}
                    >
                      {ranking.place}
                    </span>
                    <span className="tnum flex-1 text-[0.9375rem] text-fg-dim">
                      {ranking.count}
                      <span className="ml-1.5 text-fg-faint">
                        time{ranking.count !== 1 ? 's' : ''}
                      </span>
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={springSnappy}
                      className="flex shrink-0 text-fg-faint"
                    >
                      <CaretRight size={11} weight="bold" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={spring}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-1.5 pb-3 pl-7">
                          {ranking.tournaments.map((tournament: any, index: number) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => onTournamentClick && onTournamentClick(tournament)}
                              title={`View ${tournament.tournament}`}
                              className="tactile rounded-xs border border-line px-2 py-1 text-[0.9375rem] text-fg-dim hover:border-accent hover:text-accent"
                            >
                              {tournament.tournament}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Block>

        <Block title="Top partners" isEmpty={topPartners.length === 0} emptyText="No partner data yet.">
          <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col">
            {topPartners.map((partner: any, index: number) => (
              <PersonRow
                key={partner.name}
                index={index}
                name={partner.name}
                record={`${partner.wins}W ${partner.losses}L · ${partner.winRate}%`}
                trailing={`${partner.wins}W`}
                tone="up"
              />
            ))}
          </motion.ul>
        </Block>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        <Block
          title="Beats most often"
          isEmpty={opponentStats.wonMostAgainst.length === 0}
          emptyText="No opponent data yet."
        >
          <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col">
            {opponentStats.wonMostAgainst.map((opponent: any, index: number) => (
              <PersonRow
                key={opponent.name}
                index={index}
                name={opponent.name}
                record={`${opponent.wins}W ${opponent.losses}L · ${opponent.winRate}%`}
                trailing={`${opponent.wins}W`}
                tone="up"
              />
            ))}
          </motion.ul>
        </Block>

        <Block
          title="Loses to most often"
          isEmpty={opponentStats.lostMostAgainst.length === 0}
          emptyText="No opponent data yet."
        >
          <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col">
            {opponentStats.lostMostAgainst.map((opponent: any, index: number) => (
              <PersonRow
                key={opponent.name}
                index={index}
                name={opponent.name}
                record={`${opponent.wins}W ${opponent.losses}L · ${opponent.winRate}%`}
                trailing={`${opponent.losses}L`}
                tone="down"
              />
            ))}
          </motion.ul>
        </Block>
      </div>
    </div>
  )
}
