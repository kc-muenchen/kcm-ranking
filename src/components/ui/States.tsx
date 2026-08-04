import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Warning } from '@phosphor-icons/react'
import { riseIn, staggerChild, staggerParent } from '../../lib/motion'

/**
 * Loading, empty and error states.
 *
 * The loading state mirrors the real leaderboard geometry rather than showing a
 * spinner, so the page does not reflow when data lands.
 */

/** A single shimmering placeholder bar. */
export const SkeletonBar = ({
  className = '',
  style
}: {
  className?: string
  style?: React.CSSProperties
}) => <div className={`skeleton rounded-xs ${className}`} style={style} />

/** Standings-shaped loading placeholder. */
export const TableSkeleton = ({ rows = 12 }: { rows?: number }) => (
  <div className="w-full">
    <div className="flex items-center gap-4 border-b border-line-strong px-3 py-2.5">
      <SkeletonBar className="h-3 w-8" />
      <SkeletonBar className="h-3 w-40" />
      <div className="ml-auto flex gap-6">
        <SkeletonBar className="h-3 w-12" />
        <SkeletonBar className="hidden h-3 w-12 sm:block" />
        <SkeletonBar className="hidden h-3 w-12 md:block" />
      </div>
    </div>

    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-4 border-b border-line px-3 py-3"
        style={{ opacity: 1 - index / (rows * 1.6) }}
      >
        <SkeletonBar className="h-3.5 w-6" />
        <SkeletonBar className="h-3.5" style={{ width: `${120 + ((index * 37) % 90)}px` }} />
        <div className="ml-auto flex gap-6">
          <SkeletonBar className="h-3.5 w-12" />
          <SkeletonBar className="hidden h-3.5 w-12 sm:block" />
          <SkeletonBar className="hidden h-3.5 w-12 md:block" />
        </div>
      </div>
    ))}
  </div>
)

/** Full-page loading view used while tournaments are fetched. */
export const LoadingView = () => (
  <motion.div variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-6">
    <motion.div variants={staggerChild} className="flex items-center gap-2.5">
      <span className="breathe h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="eyebrow">Loading tournament data</span>
    </motion.div>
    <motion.div variants={staggerChild}>
      <TableSkeleton />
    </motion.div>
  </motion.div>
)

/**
 * Empty state. Says what is missing and how to populate it rather than just
 * reporting absence.
 */
export const EmptyState = ({
  icon,
  title,
  hint,
  action
}: {
  icon: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) => (
  <motion.div
    variants={riseIn}
    initial="hidden"
    animate="show"
    className="flex flex-col items-start gap-3 border-t border-line py-16"
  >
    <div className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-fg-faint">
      {icon}
    </div>
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint && <p className="max-w-[46ch] text-sm leading-relaxed text-fg-dim">{hint}</p>}
    </div>
    {action}
  </motion.div>
)

/** Inline error state. */
export const ErrorState = ({ title, detail }: { title: string; detail?: string }) => (
  <motion.div
    variants={riseIn}
    initial="hidden"
    animate="show"
    className="flex items-start gap-3 rounded-md border border-down/30 bg-down/5 px-4 py-3.5"
  >
    <Warning size={16} weight="bold" className="mt-0.5 shrink-0 text-down" />
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium text-fg">{title}</p>
      {detail && <p className="text-sm text-fg-dim">{detail}</p>}
    </div>
  </motion.div>
)
