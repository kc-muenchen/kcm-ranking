import { SearchableSelect } from '../SearchableSelect'
import { calculateWinProbability } from '../../utils/trueskill'

/**
 * Comparison tab component for head-to-head and teammate statistics
 */
export const ComparisonTab = ({ 
  playerName,
  currentPlayer,
  allPlayers, 
  selectedComparePlayer, 
  onPlayerSelect, 
  headToHeadStats, 
  teammateStats 
}) => {
  // Get TrueSkill ratings for both players
  const player1 = currentPlayer
  const player2 = allPlayers.find(p => p.name === selectedComparePlayer)
  
  // Calculate win probability if both players have TrueSkill ratings
  const prediction = (player1?.trueSkill && player2?.trueSkill) 
    ? calculateWinProbability(player1.trueSkill, player2.trueSkill)
    : null

  return (
    <div className="tab-panel">
      {/* Player Comparison Section */}
      <div className="player-comparison-section">
        <h2>🔀 Compare with Another Player</h2>
        <div className="comparison-selector">
          <SearchableSelect
            options={allPlayers}
            value={selectedComparePlayer}
            onChange={onPlayerSelect}
            placeholder="Search for a player to compare..."
            getOptionLabel={(player) => player.name}
            getOptionValue={(player) => player.name}
            className="player-select"
          />
        </div>

        {/* Match Prediction */}
        {prediction && selectedComparePlayer && (
          <div className="match-prediction">
            <h3>🔮 Next Match Prediction</h3>
            <div className="prediction-container">
              <div className="prediction-players">
                <div className="prediction-player player1">
                  <div className="player-name">{playerName}</div>
                  <div className="player-skill">TrueSkill: {player1.trueSkill.toFixed(1)}</div>
                  <div className={`win-probability ${prediction.player1WinProb > 0.5 ? 'favorite' : ''}`}>
                    {(prediction.player1WinProb * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="vs-divider">VS</div>
                
                <div className="prediction-player player2">
                  <div className="player-name">{selectedComparePlayer}</div>
                  <div className="player-skill">TrueSkill: {player2.trueSkill.toFixed(1)}</div>
                  <div className={`win-probability ${prediction.player2WinProb > 0.5 ? 'favorite' : ''}`}>
                    {(prediction.player2WinProb * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="prediction-bar-container">
                <div 
                  className="prediction-bar player1-bar" 
                  style={{ width: `${prediction.player1WinProb * 100}%` }}
                ></div>
                <div 
                  className="prediction-bar player2-bar" 
                  style={{ width: `${prediction.player2WinProb * 100}%` }}
                ></div>
              </div>
              
              <div className="prediction-note">
                Based on current TrueSkill ratings (1v1 scenario)
              </div>
            </div>
          </div>
        )}

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

