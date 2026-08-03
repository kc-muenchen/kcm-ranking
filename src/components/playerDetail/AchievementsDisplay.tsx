import { motion } from 'framer-motion'
import {
  ChartLineUp,
  Fire,
  Flag,
  Medal,
  Sparkle,
  Trophy,
  Users,
  type Icon
} from '@phosphor-icons/react'
import { spring, staggerChild, staggerParent } from '../../lib/motion'

/**
 * One icon per achievement category rather than per achievement.
 *
 * The source data carries a distinct emoji for each of the 43 achievements,
 * which renders as a sticker sheet. Keying the mark to the seven categories
 * makes the grid read as a system, and tier carries the weight instead.
 */
const CATEGORY_ICONS: Record<string, Icon> = {
  tournament: Trophy,
  milestone: Flag,
  performance: ChartLineUp,
  trueskill: Sparkle,
  streak: Fire,
  partnership: Users,
  season: Medal
}

const iconFor = (category: string): Icon => CATEGORY_ICONS[category] ?? Sparkle

/** Higher tiers read brighter. Keeps one accent rather than a rainbow of rarities. */
const toneForTier = (tier: number) => {
  if (tier >= 4) return { border: 'border-accent/50', text: 'text-accent', bg: 'bg-accent/10' }
  if (tier >= 2) return { border: 'border-line-strong', text: 'text-fg', bg: 'bg-surface-2' }
  return { border: 'border-line', text: 'text-fg-dim', bg: 'bg-surface' }
}

export const AchievementsDisplay = ({ achievements }: { achievements: any }) => {
  const { unlocked, progress } = achievements

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
          <h3 className="eyebrow">Unlocked</h3>
          <span className="tnum text-[0.875rem] text-fg-faint">{unlocked.length}</span>
        </div>

        {unlocked.length > 0 ? (
          <motion.ul
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-x-8 gap-y-px sm:grid-cols-2"
          >
            {unlocked.map((achievement: any) => {
              const AchievementIcon = iconFor(achievement.category)
              const tone = toneForTier(achievement.tier)

              return (
                <motion.li
                  key={achievement.id}
                  variants={staggerChild}
                  className="flex items-start gap-3 border-b border-line py-3"
                >
                  <span
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-sm border ${tone.border} ${tone.bg} ${tone.text}`}
                  >
                    <AchievementIcon size={14} weight="bold" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate text-[0.9375rem] font-medium text-fg">{achievement.name}</span>
                      <span className="eyebrow shrink-0">T{achievement.tier}</span>
                    </span>
                    <span className="text-[0.875rem] leading-relaxed text-fg-dim">{achievement.description}</span>
                    {achievement.unlockedDate && (
                      <span className="tnum text-[0.9375rem] text-fg-faint">
                        {new Date(achievement.unlockedDate).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit'
                        })}
                      </span>
                    )}
                  </span>
                </motion.li>
              )
            })}
          </motion.ul>
        ) : (
          <p className="py-6 text-[0.9375rem] text-fg-faint">
            Nothing unlocked yet. Play a few tournaments and the first milestones arrive quickly.
          </p>
        )}
      </section>

      {progress.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
            <h3 className="eyebrow">In progress</h3>
            <span className="tnum text-[0.875rem] text-fg-faint">{progress.length}</span>
          </div>

          <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col">
            {progress.map((achievement: any) => {
              const percent = Math.min((achievement.current / achievement.next) * 100, 100)
              const isRate = achievement.id.includes('winRate')
              const displayCurrent = isRate ? `${achievement.current.toFixed(1)}%` : achievement.current
              const displayNext = isRate ? `${achievement.next}%` : achievement.next
              const AchievementIcon = iconFor(achievement.category)

              return (
                <motion.li
                  key={achievement.id}
                  variants={staggerChild}
                  className="flex flex-col gap-2 border-b border-line py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-line bg-surface text-fg-faint">
                      <AchievementIcon size={14} weight="bold" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[0.9375rem] font-medium text-fg">{achievement.name}</span>
                      <span className="text-[0.875rem] leading-relaxed text-fg-dim">{achievement.description}</span>
                    </span>
                    <span className="tnum shrink-0 text-[0.875rem] text-fg-dim">
                      {displayCurrent}
                      <span className="mx-1 text-fg-faint">/</span>
                      {displayNext}
                    </span>
                  </div>

                  {/* scaleX rather than width - transforms stay on the compositor. */}
                  <div className="ml-10 h-1 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: percent / 100 }}
                      transition={spring}
                      style={{ transformOrigin: 'left' }}
                      className="h-full w-full rounded-full bg-accent"
                    />
                  </div>
                </motion.li>
              )
            })}
          </motion.ul>
        </section>
      )}
    </div>
  )
}
