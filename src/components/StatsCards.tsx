import { motion } from 'framer-motion'
import { PlayerRecord, ViewMode } from '../types/components'
import { Tournament } from '../types/tournament'
import { staggerChild, staggerParent } from '../lib/motion'

interface StatItem {
  label: string
  value: string | number | undefined
  detail?: string
  /** Render the headline as tabular figures. Names stay in the sans face. */
  numeric?: boolean
}

/**
 * Summary metrics.
 *
 * Deliberately not cards: at this density a boxed grid adds four borders and a
 * shadow to communicate what vertical rules already do. Metrics sit in a divided
 * row and breathe.
 */
function StatsCards({
  players,
  viewMode,
  tournaments
}: {
  players: PlayerRecord[]
  viewMode: ViewMode
  tournaments: Tournament[]
}) {
  const totalPlayers = players.length

  // Matches are nested: qualifying[0].rounds[].matches and eliminations[].levels[].matches
  const totalMatches =
    tournaments?.reduce((sum: number, tournament: Tournament) => {
      let matchCount = 0
      const tournamentData = tournament.data as any

      if (tournamentData?.qualifying?.[0]?.rounds) {
        const qualifying = tournamentData.qualifying as any[]
        ;(qualifying[0]?.rounds as any[]).forEach(round => {
          matchCount += round.matches?.length || 0
        })
      }

      if (tournamentData?.eliminations) {
        ;(tournamentData.eliminations as any[]).forEach(elim => {
          if (elim.levels) {
            ;(elim.levels as any[]).forEach(level => {
              matchCount += level.matches?.length || 0
            })
          }
          if (elim.thirdPlace) {
            ++matchCount
          }
        })
      }

      return sum + matchCount
    }, 0) || 0

  const topScorer = players.reduce(
    (max: PlayerRecord, p: PlayerRecord) => (p.goalsFor > max.goalsFor ? p : max),
    players[0]
  )
  const bestWinRate = players
    .filter(p => p.matches >= 3)
    .reduce(
      (max: PlayerRecord, p: PlayerRecord) =>
        parseFloat(String(p.winRate)) > parseFloat(String(max.winRate)) ? p : max,
      players[0]
    )

  const stats: StatItem[] =
    viewMode === 'overall'
      ? [
          { label: 'Players', value: totalPlayers, numeric: true },
          { label: 'Tournaments', value: tournaments?.length || 0, numeric: true },
          {
            label: 'Season leader',
            value: players[0]?.name,
            detail: `${players[0]?.seasonPoints || 0} pts`
          },
          { label: 'Top scorer', value: topScorer?.name, detail: `${topScorer?.goalsFor} goals` }
        ]
      : [
          { label: 'Players', value: totalPlayers, numeric: true },
          { label: 'Matches', value: totalMatches, numeric: true },
          { label: 'Top scorer', value: topScorer?.name, detail: `${topScorer?.goalsFor} goals` },
          {
            label: 'Best win rate',
            value: bestWinRate?.name,
            detail: `${bestWinRate?.winRate}%`
          }
        ]

  return (
    <motion.dl
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5 md:grid-cols-4 md:divide-x md:divide-line"
    >
      {stats.map(stat => (
        <motion.div
          key={stat.label}
          variants={staggerChild}
          className="flex min-w-0 flex-col gap-1 md:px-6 md:first:pl-0 md:last:pr-0"
        >
          <dt className="eyebrow">{stat.label}</dt>
          <dd
            className={`truncate text-xl font-semibold leading-tight tracking-tight text-fg ${
              stat.numeric ? 'tnum' : ''
            }`}
            title={typeof stat.value === 'string' ? stat.value : undefined}
          >
            {stat.value ?? '--'}
          </dd>
          {stat.detail && <dd className="tnum text-[0.875rem] text-fg-dim">{stat.detail}</dd>}
        </motion.div>
      ))}
    </motion.dl>
  )
}

export default StatsCards
