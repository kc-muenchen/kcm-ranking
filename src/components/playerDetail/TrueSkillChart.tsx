import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { SearchableSelect } from '../SearchableSelect'
import { EmptyState } from '../ui/States'
import { ChartLineUp } from '@phosphor-icons/react'

/**
 * Series palette.
 *
 * Warm and cool alternate so adjacent lines stay separable, saturation is held
 * down so no single series screams, and the first entry is the app accent so a
 * solo chart matches the rest of the UI.
 */
const SERIES_COLORS = [
  '#5289d4',
  '#3fbf8f',
  '#d9a441',
  '#e2647a',
  '#4fb3c4',
  '#c98a4b',
  '#7fa650',
  '#cf7d5c'
]

const VIEW_WIDTH = 900
const VIEW_HEIGHT = 400
const PADDING = { top: 24, right: 24, bottom: 44, left: 48 }

const CHART_WIDTH = VIEW_WIDTH - PADDING.left - PADDING.right
const CHART_HEIGHT = VIEW_HEIGHT - PADDING.top - PADDING.bottom

/**
 * TrueSkill trajectory over time, one line per selected player.
 *
 * The SVG scales via viewBox rather than a fixed pixel canvas, so it stays
 * readable on a phone. Lines draw themselves in on mount.
 */
export const TrueSkillChart = ({
  playerHistories,
  allPlayers: _allPlayers,
  mainPlayerName
}: {
  playerHistories: any
  allPlayers: any
  mainPlayerName: any
}) => {
  void _allPlayers

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(() => {
    if (mainPlayerName && playerHistories.has(mainPlayerName)) return [mainPlayerName]
    return playerHistories.size > 0 ? [Array.from(playerHistories.keys())[0] as string] : []
  })

  if (playerHistories.size === 0) {
    return (
      <EmptyState
        icon={<ChartLineUp size={18} weight="bold" />}
        title="No rating history"
        hint="A trajectory appears once this player has played rated matches."
      />
    )
  }

  const allHistories: any[][] = Array.from(playerHistories.values())
  const allSkills = allHistories.flatMap(history => history.map((entry: any) => entry.skill))

  if (allSkills.length === 0) {
    return (
      <EmptyState
        icon={<ChartLineUp size={18} weight="bold" />}
        title="No rating history"
        hint="A trajectory appears once this player has played rated matches."
      />
    )
  }

  const minSkill = Math.min(...allSkills) - 2
  const maxSkill = Math.max(...allSkills) + 2
  const skillRange = maxSkill - minSkill || 1

  const allDates = new Set<number>()
  allHistories.forEach(history => history.forEach((entry: any) => allDates.add(entry.date)))
  const sortedDates = Array.from(allDates).sort((a, b) => a - b)
  const dateRange = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] - sortedDates[0] : 1

  const toX = (date: number) => PADDING.left + ((date - sortedDates[0]) / dateRange) * CHART_WIDTH
  const toY = (skill: number) => PADDING.top + CHART_HEIGHT - ((skill - minSkill) / skillRange) * CHART_HEIGHT

  const playerLines = selectedPlayers
    .map((playerName, playerIndex) => {
      const history = playerHistories.get(playerName) || []
      if (history.length === 0) return null

      const points = [...history]
        .sort((a: any, b: any) => a.date - b.date)
        .map((entry: any) => ({
          x: toX(entry.date),
          y: toY(entry.skill),
          skill: entry.skill,
          index: entry.matchIndex,
          date: entry.date
        }))

      return {
        playerName,
        color: SERIES_COLORS[playerIndex % SERIES_COLORS.length],
        points,
        pathD: points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
      }
    })
    .filter((line): line is NonNullable<typeof line> => line !== null)

  const gridLines = Array.from({ length: 6 }, (_, i) => {
    const value = minSkill + (skillRange * i) / 5
    return { y: toY(value), value }
  })

  const dateLabels = Array.from({ length: 6 }, (_, i) => {
    const dateValue = sortedDates[0] + (dateRange * i) / 5
    const date = new Date(dateValue)
    return {
      x: PADDING.left + (i / 5) * CHART_WIDTH,
      label:
        dateRange > 365 * 24 * 60 * 60 * 1000
          ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  })

  const availablePlayers = Array.from(playerHistories.keys())
    .filter((name: unknown): name is string => typeof name === 'string')
    .filter(name => (playerHistories.get(name)?.length ?? 0) > 0)
    .sort()

  return (
    <div className="flex flex-col gap-3">
      {/* Legend doubles as the series picker. */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedPlayers.map((playerName, index) => (
          <span
            key={playerName}
            className="flex items-center gap-1.5 rounded-sm border border-line bg-surface py-1 pl-2 pr-1.5 text-xs"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
            />
            <span className="text-fg">{playerName}</span>
            {selectedPlayers.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedPlayers(prev => prev.filter(name => name !== playerName))}
                aria-label={`Remove ${playerName}`}
                className="tactile rounded-xs p-0.5 text-fg-faint hover:text-down"
              >
                <X size={10} weight="bold" />
              </button>
            )}
          </span>
        ))}

        {availablePlayers.length > selectedPlayers.length && (
          <div className="w-56">
            <SearchableSelect
              options={availablePlayers.filter(name => !selectedPlayers.includes(name)).map(name => ({ name }))}
              value=""
              onChange={(value: string) => {
                if (value && !selectedPlayers.includes(value)) {
                  setSelectedPlayers(prev => [...prev, value])
                }
              }}
              placeholder="Add player"
              emptyMessage="No player by that name"
              getOptionLabel={(option: any) => option.name}
              getOptionValue={(option: any) => option.name}
            />
          </div>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="TrueSkill rating over time"
          className="h-auto w-full min-w-[34rem]"
        >
          {gridLines.map((line, index) => (
            <g key={index}>
              <line
                x1={PADDING.left}
                y1={line.y}
                x2={VIEW_WIDTH - PADDING.right}
                y2={line.y}
                stroke="var(--color-line)"
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 10}
                y={line.y + 4}
                fill="var(--color-fg-faint)"
                fontSize="11"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {line.value.toFixed(0)}
              </text>
            </g>
          ))}

          {dateLabels.map((label, index) => (
            <text
              key={index}
              x={label.x}
              y={VIEW_HEIGHT - PADDING.bottom + 20}
              fill="var(--color-fg-faint)"
              fontSize="11"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              {label.label}
            </text>
          ))}

          <line
            x1={PADDING.left}
            y1={VIEW_HEIGHT - PADDING.bottom}
            x2={VIEW_WIDTH - PADDING.right}
            y2={VIEW_HEIGHT - PADDING.bottom}
            stroke="var(--color-line-strong)"
            strokeWidth="1"
          />

          {playerLines.map(({ playerName, color, points, pathD }) => (
            <g key={playerName}>
              <motion.path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
              {points.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r="2.5" fill={color} opacity="0.9">
                  <title>
                    {playerName} — match {point.index}: {point.skill.toFixed(1)}
                  </title>
                </circle>
              ))}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
