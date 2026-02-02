import { useState } from 'react'

/**
 * Overview tab component showing best rankings, top partners, and opponent stats
 */
export const OverviewTab = ({ bestRankingStats, topPartners, opponentStats, onTournamentClick }) => {
  const [expandedPlaces, setExpandedPlaces] = useState(new Set())

  const togglePlace = (place) => {
    setExpandedPlaces(prev => {
      const newSet = new Set(prev)
      if (newSet.has(place)) {
        newSet.delete(place)
      } else {
        newSet.add(place)
      }
      return newSet
    })
  }

  const getMedalEmoji = (place) => {
    if (place === 1) return '🥇'
    if (place === 2) return '🥈'
    if (place === 3) return '🥉'
    return `#${place}`
  }

  // Get podium finishes (1st, 2nd, 3rd) with full tournament lists
  const podiumFinishes = bestRankingStats.filter(ranking => ranking.place <= 3)

  return (
    <div className="tab-panel">
      {/* Best Ranking and Top Partners Section */}
      <div className="player-insights">
        {/* Podium Finishes */}
        <div className="insight-box best-ranking">
          <h3 className="insight-title">🏅 Podium Finishes</h3>
          {podiumFinishes.length > 0 ? (
            <div className="rankings-list">
              {podiumFinishes.map((ranking) => (
                <div key={ranking.place} className={`ranking-item rank-level-${ranking.place}`}>
                  <div 
                    className="ranking-header clickable" 
                    onClick={() => togglePlace(ranking.place)}
                    title={expandedPlaces.has(ranking.place) ? "Click to collapse" : "Click to expand"}
                  >
                    <div className="ranking-badge">
                      {getMedalEmoji(ranking.place)}
                    </div>
                    <div className="ranking-count">
                      {ranking.count} time{ranking.count !== 1 ? 's' : ''}
                    </div>
                    <div className="expand-indicator">
                      {expandedPlaces.has(ranking.place) ? '▼' : '▶'}
                    </div>
                  </div>
                  {expandedPlaces.has(ranking.place) && (
                    <div className="ranking-tournaments expanded">
                      {ranking.tournaments.map((t, i) => (
                        <div 
                          key={i} 
                          className="tournament-badge-clickable"
                          onClick={() => onTournamentClick && onTournamentClick(t)}
                          title={`Click to view ${t.tournament}`}
                        >
                          {t.tournament}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No podium finishes yet</div>
          )}
        </div>

        {/* Top Partners */}
        <div className="insight-box top-partners">
          <h3 className="insight-title">🤝 Top Partners</h3>
          {topPartners.length > 0 ? (
            <div className="partners-list">
              {topPartners.map((partner, index) => (
                <div key={partner.name} className={`partner-item rank-${index + 1}`}>
                  <div className="partner-rank">#{index + 1}</div>
                  <div className="partner-info">
                    <div className="partner-name">{partner.name}</div>
                    <div className="partner-stats">
                      {partner.wins}W - {partner.losses}L ({partner.winRate}%)
                    </div>
                  </div>
                  <div className="partner-wins">{partner.wins} wins</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No partner data available</div>
          )}
        </div>
      </div>

      {/* Opponent Statistics */}
      <div className="opponent-stats-section">
        {/* Won Most Against */}
        <div className="insight-box opponent-box">
          <h3 className="insight-title">💪 Won Most Against</h3>
          {opponentStats.wonMostAgainst.length > 0 ? (
            <div className="opponent-list">
              {opponentStats.wonMostAgainst.map((opponent, index) => (
                <div key={opponent.name} className="opponent-item win-opponent">
                  <div className="opponent-rank">#{index + 1}</div>
                  <div className="opponent-info">
                    <div className="opponent-name">{opponent.name}</div>
                    <div className="opponent-record">
                      {opponent.wins}W - {opponent.losses}L ({opponent.winRate}%)
                    </div>
                  </div>
                  <div className="opponent-wins">{opponent.wins}W</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No opponent data available</div>
          )}
        </div>

        {/* Lost Most Against */}
        <div className="insight-box opponent-box">
          <h3 className="insight-title">😓 Lost Most Against</h3>
          {opponentStats.lostMostAgainst.length > 0 ? (
            <div className="opponent-list">
              {opponentStats.lostMostAgainst.map((opponent, index) => (
                <div key={opponent.name} className="opponent-item loss-opponent">
                  <div className="opponent-rank">#{index + 1}</div>
                  <div className="opponent-info">
                    <div className="opponent-name">{opponent.name}</div>
                    <div className="opponent-record">
                      {opponent.wins}W - {opponent.losses}L ({opponent.winRate}%)
                    </div>
                  </div>
                  <div className="opponent-losses">{opponent.losses}L</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No opponent data available</div>
          )}
        </div>
      </div>
    </div>
  )
}

