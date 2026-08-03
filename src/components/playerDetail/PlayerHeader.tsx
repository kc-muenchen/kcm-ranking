import { TrendDown, TrendUp } from '@phosphor-icons/react'

/**
 * Player summary.
 *
 * An asymmetric split: the name and headline rating claim the left, secondary
 * metrics sit in a divided row rather than a grid of boxes.
 */
export const PlayerHeader = ({
  playerName,
  currentSkill,
  skillChange,
  totalMatches,
  winRate,
  wins,
  losses
}: {
  playerName: any
  currentSkill: any
  skillChange: any
  totalMatches: any
  winRate: any
  wins: any
  losses: any
}) => {
  const isUp = skillChange >= 0
  const TrendIcon = isUp ? TrendUp : TrendDown

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow">Player</span>
          <h1 className="truncate text-3xl font-semibold leading-none tracking-tighter text-fg md:text-4xl">
            {playerName}
          </h1>
        </div>

        <div className="flex items-end gap-5 md:shrink-0">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">TrueSkill</span>
            <span className="tnum text-3xl font-semibold leading-none tracking-tight text-accent md:text-4xl">
              {currentSkill.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col gap-1 pb-0.5">
            <span className="eyebrow">Since last event</span>
            <span
              className={`tnum flex items-center gap-1 text-base font-medium leading-none ${
                isUp ? 'text-up' : 'text-down'
              }`}
            >
              <TrendIcon size={14} weight="bold" />
              {isUp ? '+' : ''}
              {skillChange.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-x-6 border-y border-line py-4 md:divide-x md:divide-line">
        <div className="flex flex-col gap-1 md:px-6 md:first:pl-0">
          <dt className="eyebrow">Matches</dt>
          <dd className="tnum text-lg font-semibold leading-tight text-fg">{totalMatches}</dd>
        </div>
        <div className="flex flex-col gap-1 md:px-6">
          <dt className="eyebrow">Win rate</dt>
          <dd className="tnum text-lg font-semibold leading-tight text-fg">{winRate}%</dd>
        </div>
        <div className="flex flex-col gap-1 md:px-6 md:last:pr-0">
          <dt className="eyebrow">W / L</dt>
          <dd className="tnum text-lg font-semibold leading-tight">
            <span className="text-up">{wins}</span>
            <span className="mx-1 text-fg-faint">/</span>
            <span className="text-down">{losses}</span>
          </dd>
        </div>
      </dl>
    </header>
  )
}
