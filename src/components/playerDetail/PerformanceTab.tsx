import { TrueSkillChart } from './TrueSkillChart'
import { EmptyState } from '../ui/States'
import { ChartLineUp } from '@phosphor-icons/react'

/** Rows past this index appear immediately - a match log can run to hundreds of entries. */
const ROW_STAGGER_LIMIT = 14

/**
 * Performance: rating trajectory plus the full match log.
 *
 * The log is a dense table rather than a stack of cards - one row per match,
 * with the rating delta as the column that matters.
 */
export const PerformanceTab = ({
  history: _history,
  playerName,
  matchHistory,
  initialSkill,
  playerHistory,
  allPlayers
}: {
  history: any
  playerName: any
  matchHistory: any
  initialSkill: any
  playerHistory: any
  allPlayers: any
}) => {
  void _history

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Rating history</span>
          <h2 className="text-base font-semibold tracking-tight text-fg">TrueSkill evolution</h2>
        </div>
        <TrueSkillChart playerHistories={playerHistory} allPlayers={allPlayers} mainPlayerName={playerName} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="eyebrow">Match log</span>
            <h2 className="text-base font-semibold tracking-tight text-fg">Every match played</h2>
          </div>
          <span className="tnum text-xs text-fg-faint">{matchHistory.length} matches</span>
        </div>

        {matchHistory.length === 0 ? (
          <EmptyState
            icon={<ChartLineUp size={18} weight="bold" />}
            title="No matches recorded"
            hint="Once this player appears in an imported tournament, every match shows up here with its rating delta."
          />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[40rem] border-collapse">
              <thead>
                <tr className="border-b border-line-strong">
                  {['Date', 'Result', 'Score', 'Partner', 'Opponents', 'Delta', 'TrueSkill'].map((label, index) => (
                    <th
                      key={label}
                      scope="col"
                      className={`whitespace-nowrap px-3 py-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-fg-faint ${
                        index >= 5 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((entry: any, index: number) => {
                  const { match } = entry
                  const playerTeam = match.team1Players.includes(playerName) ? 'team1' : 'team2'
                  const teammates = (playerTeam === 'team1' ? match.team1Players : match.team2Players).filter(
                    (name: string) => name !== playerName
                  )
                  const opponents = playerTeam === 'team1' ? match.team2Players : match.team1Players
                  const score =
                    playerTeam === 'team1'
                      ? `${match.team1Score}-${match.team2Score}`
                      : `${match.team2Score}-${match.team1Score}`

                  // The array is newest-first, so the delta compares against the next (older) entry.
                  const skillDelta =
                    index < matchHistory.length - 1
                      ? entry.skill - matchHistory[index + 1].skill
                      : entry.skill - initialSkill

                  return (
                    <tr
                      key={index}
                      className="row-in border-b border-line transition-colors hover:bg-surface"
                      style={
                        index < ROW_STAGGER_LIMIT
                          ? ({ '--row-index': index } as React.CSSProperties)
                          : { animation: 'none' }
                      }
                    >
                      <td className="tnum whitespace-nowrap px-3 py-2.5 text-xs text-fg-faint">
                        {new Date(entry.date).toLocaleDateString('de-DE', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </td>
                      <td
                        className={`border-l-2 px-3 py-2.5 text-[0.8125rem] font-medium ${
                          match.won ? 'border-l-up text-up' : 'border-l-down text-down'
                        }`}
                      >
                        {match.won ? 'Won' : 'Lost'}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[0.8125rem] text-fg">{score}</td>
                      <td className="max-w-[10rem] truncate px-3 py-2.5 text-[0.8125rem] text-fg-dim">
                        {teammates.join(', ') || <span className="text-fg-faint">--</span>}
                      </td>
                      <td className="max-w-[14rem] truncate px-3 py-2.5 text-[0.8125rem] text-fg-dim">
                        {opponents.join(', ')}
                      </td>
                      <td
                        className={`tnum px-3 py-2.5 text-right text-[0.8125rem] ${
                          skillDelta >= 0 ? 'text-up' : 'text-down'
                        }`}
                      >
                        {skillDelta >= 0 ? '+' : ''}
                        {skillDelta.toFixed(2)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-[0.8125rem] text-fg">
                        {entry.skill.toFixed(1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
