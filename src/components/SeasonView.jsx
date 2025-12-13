import { useState } from 'react'
import { getSeasonFinal } from '../utils/seasonUtils'

/**
 * Qualification info box component
 */
export const QualificationInfoBox = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="qualification-info-box">
      <div 
        className="qualification-info-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>🏆 Season Finale Qualification Requirements</h3>
        <button 
          className="qualification-info-toggle"
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      {isExpanded && (
        <div className="qualification-info-content">
          <ul>
            <li>Minimum <strong>10 tournament attendances</strong> required to qualify</li>
            <li>Top <strong>20 players</strong> are <span className="qualified-badge">qualified</span> for the season finale</li>
            <li>Next <strong>5 players</strong> are <span className="successor-badge">potential successors</span> if a spot becomes available</li>
            <li><strong>Season Points:</strong> Points based on final placement (1st: 25, 2nd: 20, 3rd: 16, 4th: 13, 5th: 10) plus <strong>1 attendance point</strong> for everyone. Places 5-16 all receive 11 points (e.g., 1st place = 26 total points, 5th-16th place = 12 total points, 17th+ place = 1 total point)</li>
          </ul>
          <p className="qualification-info-note">
            Rankings are sorted by Season Points, then TrueSkill, then total Points.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Season final banner component
 */
export const SeasonFinalBanner = ({ seasonFinal, onViewFinal }) => {
  if (!seasonFinal) return null

  // Get top 3 from elimination standings
  const topPlayers = []
  if (seasonFinal.data?.eliminations && Array.isArray(seasonFinal.data.eliminations) && seasonFinal.data.eliminations.length > 0) {
    const eliminationStandings = seasonFinal.data.eliminations[0].standings || []
    eliminationStandings
      .filter(player => player && player.stats && !player.removed && player.stats.place <= 3)
      .sort((a, b) => a.stats.place - b.stats.place)
      .forEach(player => {
        topPlayers.push({
          name: player.name,
          place: player.stats.place
        })
      })
  }
  
  const getMedalEmoji = (place) => {
    if (place === 1) return '🥇'
    if (place === 2) return '🥈'
    if (place === 3) return '🥉'
    return place
  }
  
  return (
    <div className="season-final-section">
      <h2>🏆 Season Final</h2>
      <div className="season-final-card">
        <div className="season-final-header">
          <h3>{seasonFinal.name}</h3>
          <span className="season-final-date">
            {new Date(seasonFinal.date).toLocaleDateString()}
          </span>
        </div>
        {topPlayers.length > 0 && (
          <div className="season-final-podium">
            {topPlayers.map(player => (
              <div key={player.name} className={`podium-item place-${player.place}`}>
                <span className="podium-medal">{getMedalEmoji(player.place)}</span>
                <span className="podium-name">{player.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="season-final-info">
          <p className="season-final-note">
            <strong>Season Closed:</strong> This season has concluded with the season final. 
            All tournaments after this date until the next year will not count toward season points.
          </p>
          <p className="season-final-note">
            This tournament is excluded from season ranking calculations.
          </p>
        </div>
        <button 
          className="view-final-button"
          onClick={onViewFinal}
        >
          View Season Final Tournament →
        </button>
      </div>
    </div>
  )
}

/**
 * Main season view component
 */
export const SeasonView = ({ 
  tournaments, 
  selectedSeason, 
  seasonFinal, 
  onViewFinal
}) => {
  return (
    <>
      <QualificationInfoBox />
      {selectedSeason && (
        <SeasonFinalBanner 
          seasonFinal={seasonFinal} 
          onViewFinal={onViewFinal}
        />
      )}
    </>
  )
}

