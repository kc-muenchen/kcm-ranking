import { motion } from 'framer-motion'
import { staggerChild, staggerParent } from '../lib/motion'

/** Convert technical group names from the export into readable round names. */
const getReadableLevelName = (name: any, levelIndex: any) => {
  if (!name) {
    return levelIndex === 0
      ? 'Quarterfinal'
      : levelIndex === 1
        ? 'Semifinal'
        : levelIndex === 2
          ? 'Final'
          : levelIndex === 3
            ? 'Third Place'
            : `Round ${levelIndex + 1}`
  }

  const upperName = name.toUpperCase()

  if (upperName.includes('THIRD_PLACE') || upperName.includes('THIRD PLACE')) return 'Third Place'
  if (upperName.includes('FINALS-1-1') || (upperName.includes('FINAL') && upperName.includes('1-1'))) return 'Final'
  if (upperName.includes('FINALS-1-2') || (upperName.includes('FINAL') && upperName.includes('1-2')))
    return 'Semifinal'
  if (upperName.includes('FINALS-1-4') || (upperName.includes('FINAL') && upperName.includes('1-4')))
    return 'Quarterfinal'
  if (upperName.includes('QUARTERFINAL') || upperName.includes('QUARTER')) return 'Quarterfinal'
  if (upperName.includes('SEMIFINAL') || upperName.includes('SEMI')) return 'Semifinal'
  if (upperName.includes('FINAL') && !upperName.includes('SEMI') && !upperName.includes('QUARTER')) return 'Final'

  return name
}

/** A single tie: two teams, their scores, the winner carrying an accent rule. */
const Match = ({ match }: { match: any }) => {
  if (!match || !match.team1 || !match.team2) return null

  const team1Won = match.result && match.result[0] > match.result[1]
  const team2Won = match.result && match.result[1] > match.result[0]

  const row = (team: any, score: any, won: boolean) => (
    <div
      className={`flex items-baseline justify-between gap-3 border-l-2 py-1.5 pl-2.5 pr-2.5 ${
        won ? 'border-l-accent' : 'border-l-transparent'
      }`}
    >
      <span className={`truncate text-[0.9375rem] ${won ? 'font-medium text-fg' : 'text-fg-dim'}`}>{team.name}</span>
      {match.result && (
        <span className={`tnum shrink-0 text-[0.9375rem] ${won ? 'font-semibold text-fg' : 'text-fg-faint'}`}>
          {score}
        </span>
      )}
    </div>
  )

  return (
    <motion.div
      variants={staggerChild}
      className="divide-y divide-line rounded-sm border border-line bg-surface transition-colors hover:border-line-strong"
    >
      {row(match.team1, match.result?.[0], Boolean(team1Won))}
      {row(match.team2, match.result?.[1], Boolean(team2Won))}
    </motion.div>
  )
}

/**
 * Knockout stage.
 *
 * Rounds run as columns on wide screens and collapse to a single stack on
 * mobile. The bracket scrolls inside its own container so the page never does.
 */
function EliminationBracket({ eliminationData }: { eliminationData: any }) {
  if (!eliminationData || eliminationData.length === 0) return null

  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5">
      <div className="flex flex-col gap-0.5">
        <span className="eyebrow">Knockout stage</span>
        <h2 className="text-lg font-semibold tracking-tight text-fg">Finals and playoffs</h2>
      </div>

      {eliminationData.map((elimination: any, index: any) => (
        <div key={`elimination-${index}`} className="flex flex-col gap-6">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <motion.div
              variants={staggerParent}
              initial="hidden"
              animate="show"
              className="flex min-w-max gap-4 md:gap-6"
            >
              {elimination.levels &&
                elimination.levels.map((level: any, levelIndex: any) => {
                  const rawName = level.name || level.groupName || level.group?.name || null
                  return (
                    <div key={`level-${levelIndex}`} className="flex w-56 shrink-0 flex-col gap-2">
                      <div className="eyebrow border-b border-line pb-1.5">
                        {getReadableLevelName(rawName, levelIndex)}
                      </div>
                      <div className="flex flex-col justify-around gap-2">
                        {level.matches && level.matches.map((match: any) => <Match key={match._id} match={match} />)}
                      </div>
                    </div>
                  )
                })}

              {elimination.third && elimination.third.matches && (
                <div className="flex w-56 shrink-0 flex-col gap-2">
                  <div className="eyebrow border-b border-line pb-1.5">{elimination.third.name}</div>
                  <div className="flex flex-col gap-2">
                    {elimination.third.matches.map((match: any) => (
                      <Match key={match._id} match={match} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {elimination.standings && elimination.standings.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Final results</span>
              <motion.ol variants={staggerParent} initial="hidden" animate="show" className="flex flex-col">
                {elimination.standings
                  .filter((player: any) => player.stats.finalResult && player.stats.place <= 4)
                  .sort((a: any, b: any) => a.stats.place - b.stats.place)
                  .map((player: any) => (
                    <motion.li
                      key={player._id}
                      variants={staggerChild}
                      className={`flex items-baseline gap-4 border-b border-line border-l-2 py-2.5 pl-2.5 ${
                        player.stats.place === 1 ? 'border-l-accent' : 'border-l-transparent'
                      }`}
                    >
                      <span
                        className={`tnum w-6 shrink-0 text-sm ${
                          player.stats.place === 1 ? 'font-semibold text-fg' : 'text-fg-dim'
                        }`}
                      >
                        {String(player.stats.place).padStart(2, '0')}
                      </span>
                      <span
                        className={`flex-1 truncate text-sm ${
                          player.stats.place === 1 ? 'font-medium text-fg' : 'text-fg-dim'
                        }`}
                      >
                        {player.name}
                      </span>
                      <span className="tnum shrink-0 text-[0.9375rem] text-fg-faint">
                        <span className="text-up">{player.stats.won}</span>
                        <span className="mx-1">-</span>
                        <span className="text-down">{player.stats.lost}</span>
                      </span>
                    </motion.li>
                  ))}
              </motion.ol>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

export default EliminationBracket
