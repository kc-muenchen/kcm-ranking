import { useState } from 'react'
import { SearchableSelect } from '../SearchableSelect'

// Color palette for multiple players
const PLAYER_COLORS = [
  '#818cf8', // indigo
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#fb7185', // rose
  '#4ade80', // green
]

/**
 * TrueSkill evolution chart component with multi-player support
 */
export const TrueSkillChart = ({ playerHistories, allPlayers, mainPlayerName }) => {
  const [selectedPlayers, setSelectedPlayers] = useState(() => {
    // Start with the main player if provided, otherwise first player with history
    if (mainPlayerName && playerHistories.has(mainPlayerName)) {
      return [mainPlayerName]
    }
    return playerHistories.size > 0 ? [Array.from(playerHistories.keys())[0]] : []
  })

  if (playerHistories.size === 0) {
    return <div className="no-data">No rating history available</div>
  }

  // Get all histories to calculate global min/max
  const allHistories = Array.from(playerHistories.values())
  const allSkills = allHistories.flatMap(history => history.map(h => h.skill))
  
  if (allSkills.length === 0) {
    return <div className="no-data">No rating history available</div>
  }

  // Calculate chart dimensions
  const width = 900
  const height = 400
  const padding = 60
  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding

  // Get min and max skill values for scaling (with padding)
  const minSkill = Math.min(...allSkills) - 2
  const maxSkill = Math.max(...allSkills) + 2
  const skillRange = maxSkill - minSkill

  // Get all dates across all histories for x-axis normalization
  const allDates = new Set()
  allHistories.forEach(history => {
    history.forEach(entry => allDates.add(entry.date))
  })
  const sortedDates = Array.from(allDates).sort((a, b) => a - b)
  const dateRange = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] - sortedDates[0] : 1
  
  // Create points for each selected player
  const playerLines = selectedPlayers.map((playerName, playerIndex) => {
    const history = playerHistories.get(playerName) || []
    if (history.length === 0) return null

    const points = history.map((entry) => {
      const x = padding + ((entry.date - sortedDates[0]) / dateRange) * chartWidth
      const y = padding + chartHeight - ((entry.skill - minSkill) / skillRange) * chartHeight
      return { x, y, skill: entry.skill, index: entry.matchIndex, date: entry.date }
    }).sort((a, b) => a.date - b.date) // Ensure points are sorted by date

    const pathD = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ')

    return {
      playerName,
      color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
      points,
      pathD
    }
  }).filter(Boolean)

  // Create grid lines
  const numGridLines = 6
  const gridLines = Array.from({ length: numGridLines }, (_, i) => {
    const value = minSkill + (skillRange * i / (numGridLines - 1))
    const y = padding + chartHeight - ((value - minSkill) / skillRange) * chartHeight
    return { y, value }
  })

  // Create date labels for x-axis
  const numDateLabels = 6
  const dateLabels = Array.from({ length: numDateLabels }, (_, i) => {
    const dateValue = sortedDates[0] + (dateRange * i / (numDateLabels - 1))
    const x = padding + (i / (numDateLabels - 1)) * chartWidth
    const date = new Date(dateValue)
    
    // Format date based on range
    let dateFormat
    if (dateRange > 365 * 24 * 60 * 60 * 1000) {
      // More than a year: show month/year
      dateFormat = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } else {
      // Less than a year: show month/day
      dateFormat = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    return { x, date: dateValue, label: dateFormat }
  })

  const handleAddPlayer = (playerName) => {
    if (!selectedPlayers.includes(playerName)) {
      setSelectedPlayers([...selectedPlayers, playerName])
    }
  }

  const handleRemovePlayer = (playerName) => {
    if (selectedPlayers.length > 1) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== playerName))
    }
  }

  // Get available players (those with history)
  const availablePlayers = Array.from(playerHistories.keys())
    .filter(name => playerHistories.get(name)?.length > 0)
    .sort()

  return (
    <div className="trueskill-chart-container">
      {/* Player selector */}
      <div className="chart-player-selector">
        <div className="selected-players">
          {selectedPlayers.map((playerName, index) => (
            <div key={playerName} className="player-tag" style={{ borderColor: PLAYER_COLORS[index % PLAYER_COLORS.length] }}>
              <span style={{ color: PLAYER_COLORS[index % PLAYER_COLORS.length] }}>
                {playerName}
              </span>
              {selectedPlayers.length > 1 && (
                <button 
                  className="remove-player-btn"
                  onClick={() => handleRemovePlayer(playerName)}
                  title="Remove player"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {availablePlayers.length > selectedPlayers.length && (
          <SearchableSelect
            options={availablePlayers
              .filter(name => !selectedPlayers.includes(name))
              .map(name => ({ name }))}
            value=""
            onChange={(value) => {
              if (value) {
                handleAddPlayer(value)
              }
            }}
            placeholder="+ Add player to compare..."
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.name}
            className="add-player-select"
          />
        )}
      </div>

      {/* Chart */}
      <div className="trueskill-chart">
        <svg width={width} height={height} className="chart-svg">
          {/* Grid lines */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={padding}
                y1={line.y}
                x2={width - padding}
                y2={line.y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={line.y + 4}
                fill="rgba(255, 255, 255, 0.5)"
                fontSize="12"
                textAnchor="end"
              >
                {line.value.toFixed(0)}
              </text>
            </g>
          ))}

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
          />
          
          {/* Date labels on x-axis */}
          {dateLabels.map((label, i) => (
            <g key={i}>
              <line
                x1={label.x}
                y1={height - padding}
                x2={label.x}
                y2={height - padding + 5}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
              />
              <text
                x={label.x}
                y={height - padding + 20}
                fill="rgba(255, 255, 255, 0.6)"
                fontSize="11"
                textAnchor="middle"
              >
                {label.label}
              </text>
            </g>
          ))}

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
          />

          {/* Line charts for each player */}
          {playerLines.map(({ playerName, color, points, pathD }) => (
            <g key={playerName}>
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              {/* Data points */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={color}
                  stroke="#1e1b4b"
                  strokeWidth="2"
                  opacity="0.9"
                >
                  <title>{playerName} - Match {point.index}: {point.skill.toFixed(1)}</title>
                </circle>
              ))}
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 15}
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="14"
            textAnchor="middle"
          >
            Time
          </text>
          <text
            x={20}
            y={height / 2}
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="14"
            textAnchor="middle"
            transform={`rotate(-90, 20, ${height / 2})`}
          >
            TrueSkill Rating
          </text>
        </svg>
      </div>
    </div>
  )
}

