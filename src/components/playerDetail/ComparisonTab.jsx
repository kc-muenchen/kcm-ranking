/**
 * Comparison tab component for head-to-head and teammate statistics
 */
export const ComparisonTab = ({ 
  playerName, 
  allPlayers, 
  selectedComparePlayer, 
  onPlayerSelect, 
  headToHeadStats, 
  teammateStats 
}) => {
  return (
    <div className="tab-panel">
      {/* Player Comparison Section */}
      <div className="player-comparison-section">
        <h2>🔀 Compare with Another Player</h2>
        <div className="comparison-selector">
          <select 
            value={selectedComparePlayer} 
            onChange={(e) => onPlayerSelect(e.target.value)}
            className="player-select"
          >
            <option value="">Select a player to compare...</option>
            {allPlayers.map(player => (
              <option key={player.name} value={player.name}>
                {player.name}
              </option>
            ))}
          </select>
        </div>

        {headToHeadStats && (
          <div className="comparison-results">
            <div className="comparison-header">
              <h3>{playerName} vs {selectedComparePlayer}</h3>
            </div>
            
            <div className="comparison-stats-grid">
              <div className="comparison-stat-card">
                <div className="comparison-stat-label">Matches Played</div>
                <div className="comparison-stat-value">{headToHeadStats.totalMatches}</div>
              </div>
              
              <div className="comparison-stat-card player1-wins">
                <div className="comparison-stat-label">{playerName} Wins</div>
                <div className="comparison-stat-value">{headToHeadStats.player1Wins}</div>
                <div className="comparison-stat-percentage">
                  {headToHeadStats.totalMatches > 0 
                    ? ((headToHeadStats.player1Wins / headToHeadStats.totalMatches) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              
              <div className="comparison-stat-card player2-wins">
                <div className="comparison-stat-label">{selectedComparePlayer} Wins</div>
                <div className="comparison-stat-value">{headToHeadStats.player2Wins}</div>
                <div className="comparison-stat-percentage">
                  {headToHeadStats.totalMatches > 0 
                    ? ((headToHeadStats.player2Wins / headToHeadStats.totalMatches) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>

            {headToHeadStats.totalMatches > 0 && (
              <div className="comparison-details">
                <div className="comparison-winner">
                  {headToHeadStats.player1Wins > headToHeadStats.player2Wins ? (
                    <span className="winner-badge">🏆 {playerName} leads</span>
                  ) : headToHeadStats.player2Wins > headToHeadStats.player1Wins ? (
                    <span className="winner-badge">🏆 {selectedComparePlayer} leads</span>
                  ) : (
                    <span className="winner-badge">🤝 Tied</span>
                  )}
                </div>
              </div>
            )}

            {headToHeadStats.totalMatches === 0 && (
              <div className="no-comparison-data">
                No matches found between {playerName} and {selectedComparePlayer}
              </div>
            )}
          </div>
        )}

        {/* Teammate Statistics */}
        {teammateStats && teammateStats.totalMatches > 0 && (
          <div className="teammate-stats-results">
            <div className="teammate-stats-header">
              <h3>🤝 Playing Together</h3>
            </div>
            
            <div className="teammate-stats-grid">
              <div className="teammate-stat-card">
                <div className="teammate-stat-label">Matches Played</div>
                <div className="teammate-stat-value">{teammateStats.totalMatches}</div>
              </div>
              
              <div className="teammate-stat-card wins">
                <div className="teammate-stat-label">Wins</div>
                <div className="teammate-stat-value">{teammateStats.wins}</div>
                <div className="teammate-stat-percentage">
                  {teammateStats.totalMatches > 0 
                    ? ((teammateStats.wins / teammateStats.totalMatches) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              
              <div className="teammate-stat-card losses">
                <div className="teammate-stat-label">Losses</div>
                <div className="teammate-stat-value">{teammateStats.losses}</div>
                <div className="teammate-stat-percentage">
                  {teammateStats.totalMatches > 0 
                    ? ((teammateStats.losses / teammateStats.totalMatches) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

