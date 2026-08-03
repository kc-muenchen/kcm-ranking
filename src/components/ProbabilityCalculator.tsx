import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowCounterClockwise, Target } from '@phosphor-icons/react'
import SearchableSelect from './SearchableSelect'
import { calculateWinProbability } from '../utils/trueskill'
import { EmptyState } from './ui/States'
import { riseIn, spring } from '../lib/motion'

/** One of the four player slots. */
const PlayerSlot = ({
  label,
  value,
  onChange,
  options
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: any[]
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="eyebrow">{label}</label>
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select player"
      emptyMessage="No player by that name"
      getOptionLabel={(option: any) => option.label || option}
      getOptionValue={(option: any) => option.value || option}
    />
  </div>
)

/**
 * Doubles match probability calculator.
 *
 * Pick four players, get a modelled result. The two teams are laid out as a
 * split rather than stacked cards, and the outcome reads as a single bar.
 */
export const ProbabilityCalculator = ({ players }: { players: any }) => {
  const [team1Player1, setTeam1Player1] = useState('')
  const [team1Player2, setTeam1Player2] = useState('')
  const [team2Player1, setTeam2Player1] = useState('')
  const [team2Player2, setTeam2Player2] = useState('')

  const playerOptions = useMemo(() => {
    return [...players]
      .sort((a: any, b: any) => b.trueSkill - a.trueSkill)
      .map((player: any) => ({
        value: player.name,
        label: `${player.name}  ${player.trueSkill.toFixed(1)}`,
        trueSkill: player.trueSkill
      }))
  }, [players])

  const getPlayer = (playerName: string) => players.find((p: any) => p.name === playerName)

  const probabilities = useMemo(() => {
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) return null

    return calculateWinProbability(
      [getPlayer(team1Player1), getPlayer(team1Player2)],
      [getPlayer(team2Player1), getPlayer(team2Player2)]
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team1Player1, team1Player2, team2Player1, team2Player2, players])

  const filteredOptions = (exclude: string[]) =>
    playerOptions.filter((option: any) => !exclude.includes(option.value))

  const handleReset = () => {
    setTeam1Player1('')
    setTeam1Player2('')
    setTeam2Player1('')
    setTeam2Player2('')
  }

  const team1Favoured = probabilities ? probabilities.team1WinProb > 0.5 : false

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Target size={14} weight="bold" className="text-accent" />
            <span className="eyebrow">Tool</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">Match probability</h2>
          <p className="max-w-[60ch] text-[0.8125rem] text-fg-dim">
            Pick four players to model a doubles result from current TrueSkill ratings.
          </p>
        </div>

        {probabilities && (
          <button
            type="button"
            onClick={handleReset}
            className="tactile flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[0.8125rem] text-fg-dim hover:border-accent hover:text-accent"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-8">
        <div className="flex flex-col gap-3 border-t-2 border-line pt-4 md:border-t-0 md:border-l-2 md:pl-5 md:pt-0">
          <span className="text-[0.8125rem] font-medium text-fg">Team 1</span>
          <PlayerSlot
            label="Player 1"
            value={team1Player1}
            onChange={setTeam1Player1}
            options={filteredOptions([team1Player2, team2Player1, team2Player2])}
          />
          <PlayerSlot
            label="Player 2"
            value={team1Player2}
            onChange={setTeam1Player2}
            options={filteredOptions([team1Player1, team2Player1, team2Player2])}
          />
        </div>

        <div className="hidden self-center md:block">
          <span className="eyebrow">vs</span>
        </div>

        <div className="flex flex-col gap-3 border-t-2 border-line pt-4 md:border-t-0 md:border-l-2 md:pl-5 md:pt-0">
          <span className="text-[0.8125rem] font-medium text-fg">Team 2</span>
          <PlayerSlot
            label="Player 1"
            value={team2Player1}
            onChange={setTeam2Player1}
            options={filteredOptions([team2Player2, team1Player1, team1Player2])}
          />
          <PlayerSlot
            label="Player 2"
            value={team2Player2}
            onChange={setTeam2Player2}
            options={filteredOptions([team2Player1, team1Player1, team1Player2])}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {probabilities ? (
          <motion.div key="result" variants={riseIn} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-5">
            <div className="flex items-end justify-between gap-6 border-t border-line pt-5">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="eyebrow">Team 1</span>
                <span
                  className={`tnum text-4xl font-semibold leading-none tracking-tight ${
                    team1Favoured ? 'text-accent' : 'text-fg-dim'
                  }`}
                >
                  {(probabilities.team1WinProb * 100).toFixed(1)}%
                </span>
                <span className="tnum text-xs text-fg-faint">
                  combined skill {probabilities.team1Skill.toFixed(1)}
                </span>
              </div>

              <div className="flex min-w-0 flex-col items-end gap-1">
                <span className="eyebrow">Team 2</span>
                <span
                  className={`tnum text-4xl font-semibold leading-none tracking-tight ${
                    !team1Favoured ? 'text-accent' : 'text-fg-dim'
                  }`}
                >
                  {(probabilities.team2WinProb * 100).toFixed(1)}%
                </span>
                <span className="tnum text-xs text-fg-faint">
                  combined skill {probabilities.team2Skill.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: probabilities.team1WinProb }}
                transition={spring}
                style={{ transformOrigin: 'left' }}
                className="h-full w-full rounded-full bg-accent"
              />
            </div>

            <p className="max-w-[70ch] border-l-2 border-line pl-3 text-xs leading-relaxed text-fg-faint">
              Derived from TrueSkill ratings, accounting for each player&rsquo;s uncertainty. Real results still turn
              on form, the table, and who is buying the next round.
            </p>
          </motion.div>
        ) : (
          <motion.div key="empty" variants={riseIn} initial="hidden" animate="show" exit="exit">
            <EmptyState
              icon={<Target size={18} weight="bold" />}
              title="Four players needed"
              hint="Fill both teams above and the modelled win probability appears here."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default ProbabilityCalculator
