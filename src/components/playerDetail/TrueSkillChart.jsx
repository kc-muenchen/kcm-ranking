/**
 * TrueSkill evolution chart component
 */
export const TrueSkillChart = ({ history, playerName }) => {
  if (history.length === 0) {
    return <div className="no-data">No rating history available</div>
  }

  // Calculate chart dimensions
  const width = 800
  const height = 300
  const padding = 40
  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding

  // Get min and max skill values for scaling
  const skills = history.map(h => h.skill)
  const minSkill = Math.min(...skills) - 2
  const maxSkill = Math.max(...skills) + 2
  const skillRange = maxSkill - minSkill

  // Create points for the line
  const points = history.map((entry, index) => {
    const x = padding + (index / (history.length - 1)) * chartWidth
    const y = padding + chartHeight - ((entry.skill - minSkill) / skillRange) * chartHeight
    return { x, y, skill: entry.skill, index }
  })

  // Create SVG path
  const pathD = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')

  // Create grid lines
  const numGridLines = 5
  const gridLines = Array.from({ length: numGridLines }, (_, i) => {
    const value = minSkill + (skillRange * i / (numGridLines - 1))
    const y = padding + chartHeight - ((value - minSkill) / skillRange) * chartHeight
    return { y, value }
  })

  return (
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

        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Line chart */}
        <path
          d={pathD}
          fill="none"
          stroke="#818cf8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#818cf8"
            stroke="#1e1b4b"
            strokeWidth="2"
          >
            <title>Match {point.index}: {point.skill.toFixed(1)}</title>
          </circle>
        ))}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 5}
          fill="rgba(255, 255, 255, 0.7)"
          fontSize="14"
          textAnchor="middle"
        >
          Matches
        </text>
        <text
          x={15}
          y={height / 2}
          fill="rgba(255, 255, 255, 0.7)"
          fontSize="14"
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          TrueSkill Rating
        </text>
      </svg>
    </div>
  )
}

