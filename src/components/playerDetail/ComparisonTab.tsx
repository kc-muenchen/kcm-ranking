import { motion } from 'framer-motion'
import { ArrowsLeftRight, Users } from '@phosphor-icons/react'
import { SearchableSelect } from '../SearchableSelect'
import { calculateWinProbability } from '../../utils/trueskill'
import { EmptyState } from '../ui/States'
import { spring } from '../../lib/motion'

/** A labelled figure in a divided row. */
const Metric = ({
  label,
  value,
  detail,
  tone = 'neutral'
}: {
  label: string
  value: any
  detail?: string
  tone?: 'neutral' | 'up' | 'down'
}) => (
  <div className="flex flex-col gap-1 md:px-6 md:first:pl-0 md:last:pr-0">
    <dt className="eyebrow truncate">{label}</dt>
    <dd
      className={`tnum text-xl font-semibold leading-tight ${
        tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-fg'
      }`}
    >
      {value}
    </dd>
    {detail && <dd className="tnum text-[0.875rem] text-fg-faint">{detail}</dd>}
  </div>
)

/**
 * Head-to-head comparison: win prediction, direct record, and record as partners.
 */
export const ComparisonTab = ({
  playerName,
  currentPlayer,
  allPlayers,
  selectedComparePlayer,
  onPlayerSelect,
  headToHeadStats,
  teammateStats
}: {
  playerName: any
  currentPlayer: any
  allPlayers: any
  selectedComparePlayer: any
  onPlayerSelect: any
  headToHeadStats: any
  teammateStats: any
}) => {
  const player1 = currentPlayer
  const player2 = allPlayers.find((p: any) => p.name === selectedComparePlayer)

  const prediction = player1 && player2 ? calculateWinProbability([player1], [player2]) : null

  const pct = (part: number, whole: number) => (whole > 0 ? ((part / whole) * 100).toFixed(1) : '0.0')

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Compare</span>
          <h2 className="text-base font-semibold tracking-tight text-fg">Head to head</h2>
        </div>
        <div className="max-w-md">
          <SearchableSelect
            options={allPlayers}
            value={selectedComparePlayer}
            onChange={onPlayerSelect}
            placeholder="Search for a player..."
            emptyMessage="No player by that name"
            getOptionLabel={(player: any) => player.name}
            getOptionValue={(player: any) => player.name}
          />
        </div>
      </section>

      {!selectedComparePlayer && (
        <EmptyState
          icon={<ArrowsLeftRight size={18} weight="bold" />}
          title="Pick someone to compare against"
          hint="Choose a player above to see the predicted result, the direct record between them, and how the two do as partners."
        />
      )}

      {prediction && selectedComparePlayer && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="eyebrow">Prediction</span>
            <h3 className="text-base font-semibold tracking-tight text-fg">If they played next</h3>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[0.9375rem] text-fg-dim">{playerName}</span>
              <span
                className={`tnum text-3xl font-semibold leading-none tracking-tight ${
                  prediction.team1WinProb > 0.5 ? 'text-accent' : 'text-fg-dim'
                }`}
              >
                {(prediction.team1WinProb * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-end gap-1">
              <span className="truncate text-[0.9375rem] text-fg-dim">{selectedComparePlayer}</span>
              <span
                className={`tnum text-3xl font-semibold leading-none tracking-tight ${
                  prediction.team2WinProb > 0.5 ? 'text-accent' : 'text-fg-dim'
                }`}
              >
                {(prediction.team2WinProb * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* One track, split by a single transform. */}
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: prediction.team1WinProb }}
              transition={spring}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full rounded-full bg-accent"
            />
          </div>

          <p className="text-[0.875rem] text-fg-faint">
            Modelled as a 1v1 from current TrueSkill ratings, accounting for each player&rsquo;s uncertainty.
          </p>
        </section>
      )}

      {headToHeadStats && selectedComparePlayer && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="eyebrow">Against each other</span>
            <h3 className="text-base font-semibold tracking-tight text-fg">
              {playerName} vs {selectedComparePlayer}
            </h3>
          </div>

          {headToHeadStats.totalMatches === 0 ? (
            <p className="border-l-2 border-line py-3 pl-3 text-[0.9375rem] text-fg-faint">
              These two have never faced each other.
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-x-6 border-y border-line py-4 md:divide-x md:divide-line">
                <Metric label="Matches" value={headToHeadStats.totalMatches} />
                <Metric
                  label={playerName}
                  value={headToHeadStats.player1Wins}
                  detail={`${pct(headToHeadStats.player1Wins, headToHeadStats.totalMatches)}%`}
                  tone="up"
                />
                <Metric
                  label={selectedComparePlayer}
                  value={headToHeadStats.player2Wins}
                  detail={`${pct(headToHeadStats.player2Wins, headToHeadStats.totalMatches)}%`}
                  tone="down"
                />
              </dl>

              <p className="text-[0.9375rem] text-fg-dim">
                {headToHeadStats.player1Wins > headToHeadStats.player2Wins ? (
                  <>
                    <span className="font-medium text-fg">{playerName}</span> leads the series.
                  </>
                ) : headToHeadStats.player2Wins > headToHeadStats.player1Wins ? (
                  <>
                    <span className="font-medium text-fg">{selectedComparePlayer}</span> leads the series.
                  </>
                ) : (
                  <>The series is level.</>
                )}
              </p>
            </>
          )}
        </section>
      )}

      {teammateStats && teammateStats.totalMatches > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Users size={14} weight="bold" className="text-fg-faint" />
            <span className="eyebrow">As partners</span>
          </div>

          <dl className="grid grid-cols-3 gap-x-6 border-y border-line py-4 md:divide-x md:divide-line">
            <Metric label="Together" value={teammateStats.totalMatches} />
            <Metric
              label="Won"
              value={teammateStats.wins}
              detail={`${pct(teammateStats.wins, teammateStats.totalMatches)}%`}
              tone="up"
            />
            <Metric
              label="Lost"
              value={teammateStats.losses}
              detail={`${pct(teammateStats.losses, teammateStats.totalMatches)}%`}
              tone="down"
            />
          </dl>
        </section>
      )}
    </div>
  )
}
