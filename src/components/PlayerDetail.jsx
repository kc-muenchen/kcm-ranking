import { useState } from 'react'
import { normalizePlayerNameSync } from '../config/playerAliases'
import './PlayerDetail.css'

function PlayerDetail({ playerName, playerHistory, tournaments, aggregatedPlayers, onBack }) {
  const [selectedComparePlayer, setSelectedComparePlayer] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  const history = playerHistory.get(playerName) || []
  
  // Filter out the initial rating entry and reverse to show most recent first
  const matchHistory = history.filter(entry => entry.matchIndex >= 0).reverse()
  
  // Calculate summary stats
  const totalMatches = matchHistory.length
  const wins = matchHistory.filter(entry => entry.match.won).length
  const losses = totalMatches - wins
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0
  const currentSkill = history.length > 0 ? history[history.length - 1].skill : 0
  const initialSkill = history.length > 0 ? history[0].skill : 0
  const skillChange = currentSkill - initialSkill

  // Find player's aggregated stats for best ranking info
  const playerAggregated = aggregatedPlayers.find(p => p.name === playerName)
  
  // Calculate best ranking statistics
  const bestRankingStats = calculateBestRanking(playerName, tournaments)
  
  // Calculate top partners
  const topPartners = calculateTopPartners(matchHistory, playerName)
  
  // Calculate opponent statistics (won most against / lost most against)
  const opponentStats = calculateOpponentStats(matchHistory, playerName)
  
  // Calculate tournament participation list
  const tournamentList = calculateTournamentList(playerName, tournaments)
  
  // Calculate achievements
  const achievements = calculateAchievements(
    playerName,
    matchHistory,
    tournaments,
    tournamentList,
    bestRankingStats,
    topPartners,
    currentSkill,
    totalMatches,
    wins,
    winRate,
    playerAggregated
  )
  
  // Calculate head-to-head comparison if a player is selected
  const headToHeadStats = selectedComparePlayer 
    ? calculateHeadToHead(matchHistory, playerName, selectedComparePlayer)
    : null
  
  // Calculate teammate statistics if a player is selected
  const teammateStats = selectedComparePlayer
    ? calculateTeammateStats(matchHistory, playerName, selectedComparePlayer)
    : null
  
  // Get list of all players for comparison dropdown
  const allPlayers = aggregatedPlayers
    .filter(p => p.name !== playerName)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="player-detail">
      <button className="back-button" onClick={onBack}>
        ← Back to Rankings
      </button>

      <div className="player-header">
        <h1 className="player-title">{playerName}</h1>
        <div className="player-stats-summary">
          <div className="stat-box">
            <div className="stat-label">Current TrueSkill</div>
            <div className="stat-value trueskill">{currentSkill.toFixed(1)}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Skill Change</div>
            <div className={`stat-value ${skillChange >= 0 ? 'positive' : 'negative'}`}>
              {skillChange >= 0 ? '+' : ''}{skillChange.toFixed(1)}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Total Matches</div>
            <div className="stat-value">{totalMatches}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">{winRate}%</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Wins / Losses</div>
            <div className="stat-value">{wins} / {losses}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="player-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <span className="tab-icon">🏆</span>
          Achievements
        </button>
        <button
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <span className="tab-icon">📈</span>
          Performance
        </button>
        <button
          className={`tab-button ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <span className="tab-icon">📅</span>
          Tournaments
        </button>
        <button
          className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          <span className="tab-icon">🔀</span>
          Comparison
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            {/* Best Ranking and Top Partners Section */}
            <div className="player-insights">
        {/* Best Rankings (Top 3) */}
        <div className="insight-box best-ranking">
          <h3 className="insight-title">🏅 Best Rankings</h3>
          {bestRankingStats.length > 0 ? (
            <div className="rankings-list">
              {bestRankingStats.map((ranking, index) => (
                <div key={ranking.place} className={`ranking-item rank-level-${index + 1}`}>
                  <div className="ranking-header">
                    <div className="ranking-badge">
                      #{ranking.place}
                    </div>
                    <div className="ranking-count">
                      {ranking.count} time{ranking.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {ranking.count <= 3 && (
                    <div className="ranking-tournaments">
                      {ranking.tournaments.map((t, i) => (
                        <div key={i} className="tournament-badge-small">
                          {t.tournament}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-small">No tournament data available</div>
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
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="tab-panel">
            <div className="achievements-section">
              <h2>🏆 Achievements</h2>
              <AchievementsDisplay achievements={achievements} />
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="tab-panel">
            {/* TrueSkill Evolution Chart */}
            <div className="trueskill-chart-section">
              <h2>TrueSkill Evolution</h2>
              <TrueSkillChart history={history} playerName={playerName} />
            </div>

            {/* Match History */}
            <div className="match-history-section">
              <h2>Match History</h2>
              <p className="section-subtitle">Showing {matchHistory.length} matches</p>
              
              <div className="match-list">
                {matchHistory.map((entry, index) => {
                  const { match } = entry
                  const playerTeam = match.team1Players.includes(playerName) ? 'team1' : 'team2'
                  const teammates = playerTeam === 'team1' ? match.team1Players : match.team2Players
                  const opponents = playerTeam === 'team1' ? match.team2Players : match.team1Players
                  const score = playerTeam === 'team1' 
                    ? `${match.team1Score} - ${match.team2Score}`
                    : `${match.team2Score} - ${match.team1Score}`
                  
                  // Since array is reversed (newest first), calculate delta from next match (older)
                  const skillDelta = index < matchHistory.length - 1 
                    ? entry.skill - matchHistory[index + 1].skill 
                    : entry.skill - initialSkill
                  
                  return (
                    <div 
                      key={index} 
                      className={`match-card ${match.won ? 'won' : 'lost'}`}
                    >
                      <div className="match-header">
                        <span className={`match-result ${match.won ? 'won' : 'lost'}`}>
                          {match.won ? '✓ Won' : '✗ Lost'}
                        </span>
                        <span className="match-score">{score}</span>
                        <span className={`skill-change ${skillDelta >= 0 ? 'positive' : 'negative'}`}>
                          {skillDelta >= 0 ? '+' : ''}{skillDelta.toFixed(2)}
                        </span>
                      </div>
                      <div className="match-details">
                        <div className="team-info">
                          <span className="team-label">Your Team:</span>
                          <span className="team-players">{teammates.join(', ')}</span>
                        </div>
                        <div className="team-info">
                          <span className="team-label">Opponents:</span>
                          <span className="team-players">{opponents.join(', ')}</span>
                        </div>
                      </div>
                      <div className="match-footer">
                        <span className="match-date">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        <span className="trueskill-after">
                          TrueSkill: {entry.skill.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="tab-panel">
            {/* Tournament Participation List */}
            <div className="tournament-list-section">
              <h2>Tournament Participation</h2>
              <p className="section-subtitle">Participated in {tournamentList.length} tournament{tournamentList.length !== 1 ? 's' : ''}</p>
              
              <div className="tournament-grid">
                {tournamentList.map((tournament, index) => (
                  <div key={index} className="tournament-card">
                    <div className="tournament-card-header">
                      <span className="tournament-name">{tournament.name}</span>
                      <span className="tournament-date">
                        {new Date(tournament.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="tournament-card-body">
                      {tournament.finalPlace && (
                        <div className="tournament-placement">
                          <span className="placement-label">Final Place:</span>
                          <span className={`placement-value ${tournament.finalPlace <= 3 ? 'podium' : ''}`}>
                            #{tournament.finalPlace}
                          </span>
                        </div>
                      )}
                      {tournament.qualifyingPlace && tournament.eliminationPlace && (
                        <div className="tournament-details">
                          <span className="detail-item">
                            <span className="detail-label">Qualifying:</span>
                            <span className="detail-value">#{tournament.qualifyingPlace}</span>
                          </span>
                          <span className="detail-item">
                            <span className="detail-label">Knockout:</span>
                            <span className="detail-value">#{tournament.eliminationPlace}</span>
                          </span>
                        </div>
                      )}
                      {tournament.seasonPoints !== undefined && (
                        <div className="tournament-season-points">
                          <span className="season-points-label">Season Points:</span>
                          <span className="season-points-earned">+{tournament.seasonPoints}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="tab-panel">
            {/* Player Comparison Section */}
            <div className="player-comparison-section">
        <h2>🔀 Compare with Another Player</h2>
        <div className="comparison-selector">
          <select 
            value={selectedComparePlayer} 
            onChange={(e) => setSelectedComparePlayer(e.target.value)}
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
        )}
      </div>
    </div>
  )
}

// Simple line chart component for TrueSkill evolution
function TrueSkillChart({ history, playerName }) {
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

// Helper function to calculate best ranking statistics (top 3)
// Only counts final tournament placements from elimination rounds
function calculateBestRanking(playerName, tournaments) {
  const rankings = []
  const normalizedPlayerName = normalizePlayerNameSync(playerName)
  
  if (!tournaments || tournaments.length === 0) {
    return []
  }
  
  tournaments.forEach(tournament => {
    // Skip if tournament data is missing
    if (!tournament || !tournament.data) {
      return
    }
    
    // Only check elimination standings (actual tournament placement)
    // Qualifying standings are NOT counted as tournament wins
    if (tournament.data.eliminations && Array.isArray(tournament.data.eliminations) && tournament.data.eliminations.length > 0) {
      const eliminationStandings = tournament.data.eliminations[0].standings || []
      const eliminationStanding = eliminationStandings.find(p => {
        if (!p || !p.name || p.removed) return false
        return normalizePlayerNameSync(p.name) === normalizedPlayerName
      })
      
      if (eliminationStanding && eliminationStanding.stats && eliminationStanding.stats.place) {
        rankings.push({
          place: eliminationStanding.stats.place,
          tournament: tournament.name || 'Unknown Tournament',
          date: tournament.date || tournament.data.createdAt
        })
      }
    }
  })
  
  if (rankings.length === 0) {
    return []
  }
  
  // Group rankings by place
  const placeMap = new Map()
  rankings.forEach(ranking => {
    if (!placeMap.has(ranking.place)) {
      placeMap.set(ranking.place, [])
    }
    placeMap.get(ranking.place).push(ranking)
  })
  
  // Get unique places sorted ascending
  const uniquePlaces = Array.from(placeMap.keys()).sort((a, b) => a - b)
  
  // Return top 3 unique places with their tournaments
  return uniquePlaces.slice(0, 3).map(place => ({
    place,
    count: placeMap.get(place).length,
    tournaments: placeMap.get(place)
  }))
}

// Helper function to calculate top partners
function calculateTopPartners(matchHistory, playerName) {
  const partnerStats = new Map()
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const playerTeam = match.team1Players.includes(playerName) ? 'team1' : 'team2'
    const teammates = playerTeam === 'team1' ? match.team1Players : match.team2Players
    
    // Find partners (teammates who are not the player)
    const partners = teammates.filter(p => p !== playerName)
    
    partners.forEach(partner => {
      if (!partnerStats.has(partner)) {
        partnerStats.set(partner, {
          name: partner,
          matches: 0,
          wins: 0,
          losses: 0
        })
      }
      
      const stats = partnerStats.get(partner)
      stats.matches += 1
      if (match.won) {
        stats.wins += 1
      } else {
        stats.losses += 1
      }
    })
  })
  
  // Convert to array and sort by wins, then by win rate
  const partnersArray = Array.from(partnerStats.values())
    .map(partner => ({
      ...partner,
      winRate: partner.matches > 0 ? ((partner.wins / partner.matches) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => {
      // Sort by wins first, then by win rate
      if (b.wins !== a.wins) return b.wins - a.wins
      return parseFloat(b.winRate) - parseFloat(a.winRate)
    })
  
  return partnersArray.slice(0, 3) // Return top 3
}

// Helper function to calculate opponent statistics
function calculateOpponentStats(matchHistory, playerName) {
  const opponentStats = new Map()
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const playerTeam = match.team1Players.includes(playerName) ? 'team1' : 'team2'
    const opponents = playerTeam === 'team1' ? match.team2Players : match.team1Players
    
    opponents.forEach(opponent => {
      if (!opponentStats.has(opponent)) {
        opponentStats.set(opponent, {
          name: opponent,
          matches: 0,
          wins: 0,
          losses: 0
        })
      }
      
      const stats = opponentStats.get(opponent)
      stats.matches += 1
      if (match.won) {
        stats.wins += 1
      } else {
        stats.losses += 1
      }
    })
  })
  
  // Convert to array and add win rates
  const opponentsArray = Array.from(opponentStats.values())
    .map(opponent => ({
      ...opponent,
      winRate: opponent.matches > 0 ? ((opponent.wins / opponent.matches) * 100).toFixed(1) : 0
    }))
    .filter(opponent => opponent.matches >= 2) // Only include opponents faced at least twice
  
  // Get top 3 opponents player won most against
  const wonMostAgainst = [...opponentsArray]
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      return parseFloat(b.winRate) - parseFloat(a.winRate)
    })
    .slice(0, 3)
  
  // Get top 3 opponents player lost most against
  const lostMostAgainst = [...opponentsArray]
    .sort((a, b) => {
      if (b.losses !== a.losses) return b.losses - a.losses
      return parseFloat(a.winRate) - parseFloat(b.winRate) // Lower win rate is worse
    })
    .slice(0, 3)
  
  return {
    wonMostAgainst,
    lostMostAgainst
  }
}

// Helper function to calculate tournament participation list
function calculateTournamentList(playerName, tournaments) {
  const normalizedPlayerName = normalizePlayerNameSync(playerName)
  const tournamentList = []
  
  // Season points distribution (same as in App.jsx)
  const seasonPointsMap = {
    1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8,
    9: 7, 10: 6, 11: 5, 12: 4, 13: 3, 14: 2, 15: 1, 16: 1
  }
  
  tournaments.forEach(tournament => {
    // Skip if tournament data is missing
    if (!tournament || !tournament.data) {
      return
    }
    
    let qualifyingPlace = null
    let eliminationPlace = null
    let finalPlace = null
    let foundInQualifying = false
    let foundInElimination = false
    
    // Check qualifying standings
    if (tournament.data.qualifying && Array.isArray(tournament.data.qualifying) && tournament.data.qualifying.length > 0) {
      const qualifyingStandings = tournament.data.qualifying[0].standings || []
      const qualifyingStanding = qualifyingStandings.find(
        p => p && p.name && !p.removed && normalizePlayerNameSync(p.name) === normalizedPlayerName
      )
      
      if (qualifyingStanding && qualifyingStanding.stats && qualifyingStanding.stats.matches > 0) {
        qualifyingPlace = qualifyingStanding.stats.place
        finalPlace = qualifyingPlace
        foundInQualifying = true
      }
    }
    
    // Check elimination standings (overrides qualifying place)
    if (tournament.data.eliminations && Array.isArray(tournament.data.eliminations) && tournament.data.eliminations.length > 0) {
      const eliminationStandings = tournament.data.eliminations[0].standings || []
      const eliminationStanding = eliminationStandings.find(
        p => p && p.name && !p.removed && normalizePlayerNameSync(p.name) === normalizedPlayerName
      )
      
      if (eliminationStanding) {
        eliminationPlace = eliminationStanding.stats.place
        finalPlace = eliminationPlace // Elimination place is the final tournament result
        foundInElimination = true
      }
    }
    
    // Only add if player participated
    if (foundInQualifying || foundInElimination) {
      const placePoints = seasonPointsMap[finalPlace] || 0
      const attendancePoint = 1 // +1 for attending (everyone gets this)
      
      tournamentList.push({
        name: tournament.name,
        date: tournament.date,
        qualifyingPlace,
        eliminationPlace,
        finalPlace,
        seasonPoints: placePoints + attendancePoint
      })
    }
  })
  
  // Sort by date (most recent first)
  tournamentList.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  return tournamentList
}

// Helper function to calculate head-to-head statistics between two players
// Only counts matches where they played AGAINST each other (as opponents)
function calculateHeadToHead(matchHistory, player1Name, player2Name) {
  const normalizedPlayer1 = normalizePlayerNameSync(player1Name)
  const normalizedPlayer2 = normalizePlayerNameSync(player2Name)
  
  let totalMatches = 0
  let player1Wins = 0
  let player2Wins = 0
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const allPlayers = [...match.team1Players, ...match.team2Players]
    
    // Check if both players were in this match
    const player1InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
    const player2InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
    
    if (player1InMatch && player2InMatch) {
      // Determine which team each player was on
      const player1InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
      const player2InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
      
      // Only count matches where they were OPPONENTS (not teammates)
      if (player1InTeam1 !== player2InTeam1) {
        totalMatches++
        
        // Determine which team won based on scores
        const team1Won = match.team1Score > match.team2Score
        const team2Won = match.team2Score > match.team1Score
        
        if (player1InTeam1) {
          // Player1 on team1, Player2 on team2
          if (team1Won) {
            player1Wins++
          } else if (team2Won) {
            player2Wins++
          }
          // If draw, neither wins
        } else {
          // Player1 on team2, Player2 on team1
          if (team2Won) {
            player1Wins++
          } else if (team1Won) {
            player2Wins++
          }
          // If draw, neither wins
        }
      }
      // Skip matches where they were teammates
    }
  })
  
  return {
    totalMatches,
    player1Wins,
    player2Wins
  }
}

// Helper function to calculate teammate statistics between two players
// Only counts matches where they played TOGETHER (as teammates)
function calculateTeammateStats(matchHistory, player1Name, player2Name) {
  const normalizedPlayer1 = normalizePlayerNameSync(player1Name)
  const normalizedPlayer2 = normalizePlayerNameSync(player2Name)
  
  let totalMatches = 0
  let wins = 0
  let losses = 0
  
  matchHistory.forEach(entry => {
    const { match } = entry
    const allPlayers = [...match.team1Players, ...match.team2Players]
    
    // Check if both players were in this match
    const player1InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
    const player2InMatch = allPlayers.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
    
    if (player1InMatch && player2InMatch) {
      // Determine which team each player was on
      const player1InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer1)
      const player2InTeam1 = match.team1Players.some(p => normalizePlayerNameSync(p) === normalizedPlayer2)
      
      // Only count matches where they were TEAMMATES (on the same team)
      if (player1InTeam1 === player2InTeam1) {
        totalMatches++
        
        // Determine if their team won
        const theirTeam = player1InTeam1 ? 'team1' : 'team2'
        const theirScore = theirTeam === 'team1' ? match.team1Score : match.team2Score
        const opponentScore = theirTeam === 'team1' ? match.team2Score : match.team1Score
        
        if (theirScore > opponentScore) {
          wins++
        } else if (opponentScore > theirScore) {
          losses++
        }
        // If draw, neither wins nor loses (not counted in wins/losses)
      }
      // Skip matches where they were opponents
    }
  })
  
  return {
    totalMatches,
    wins,
    losses
  }
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = {
  // Tournament Performance
  firstPlace: { id: 'firstPlace', emoji: '🥇', name: 'First Place', description: 'Win your first tournament', category: 'tournament', tier: 1, threshold: 1 },
  champion3: { id: 'champion3', emoji: '🏆', name: 'Champion', description: 'Win 3 tournaments', category: 'tournament', tier: 2, threshold: 3 },
  champion5: { id: 'champion5', emoji: '👑', name: 'Elite Champion', description: 'Win 5 tournaments', category: 'tournament', tier: 3, threshold: 5 },
  champion10: { id: 'champion10', emoji: '💎', name: 'Legendary Champion', description: 'Win 10 tournaments', category: 'tournament', tier: 4, threshold: 10 },
  podium3: { id: 'podium3', emoji: '🥉', name: 'Podium Finisher', description: 'Finish in top 3 (3 times)', category: 'tournament', tier: 1, threshold: 3 },
  podium5: { id: 'podium5', emoji: '🎖️', name: 'Consistent Podium', description: 'Finish in top 3 (5 times)', category: 'tournament', tier: 2, threshold: 5 },
  top5_5: { id: 'top5_5', emoji: '⭐', name: 'Consistent Performer', description: 'Finish in top 5 (5 times)', category: 'tournament', tier: 1, threshold: 5 },
  top5_10: { id: 'top5_10', emoji: '🌟', name: 'Elite Performer', description: 'Finish in top 5 (10 times)', category: 'tournament', tier: 2, threshold: 10 },
  
  // Milestones
  matches50: { id: 'matches50', emoji: '🎯', name: 'Veteran', description: 'Play 50 matches', category: 'milestone', tier: 1, threshold: 50 },
  matches100: { id: 'matches100', emoji: '🎖️', name: 'Centurion', description: 'Play 100 matches', category: 'milestone', tier: 2, threshold: 100 },
  matches250: { id: 'matches250', emoji: '🏅', name: 'Master', description: 'Play 250 matches', category: 'milestone', tier: 3, threshold: 250 },
  matches500: { id: 'matches500', emoji: '💫', name: 'Legend', description: 'Play 500 matches', category: 'milestone', tier: 4, threshold: 500 },
  wins25: { id: 'wins25', emoji: '🔥', name: 'Winner', description: 'Win 25 matches', category: 'milestone', tier: 1, threshold: 25 },
  wins50: { id: 'wins50', emoji: '⚡', name: 'Dominator', description: 'Win 50 matches', category: 'milestone', tier: 2, threshold: 50 },
  wins100: { id: 'wins100', emoji: '💥', name: 'Champion', description: 'Win 100 matches', category: 'milestone', tier: 3, threshold: 100 },
  wins250: { id: 'wins250', emoji: '🚀', name: 'Unstoppable', description: 'Win 250 matches', category: 'milestone', tier: 4, threshold: 250 },
  tournaments10: { id: 'tournaments10', emoji: '📅', name: 'Regular', description: 'Play in 10 tournaments', category: 'milestone', tier: 1, threshold: 10 },
  tournaments25: { id: 'tournaments25', emoji: '📆', name: 'Dedicated', description: 'Play in 25 tournaments', category: 'milestone', tier: 2, threshold: 25 },
  tournaments50: { id: 'tournaments50', emoji: '🗓️', name: 'Veteran Competitor', description: 'Play in 50 tournaments', category: 'milestone', tier: 3, threshold: 50 },
  seasons5: { id: 'seasons5', emoji: '📊', name: 'Season Veteran', description: 'Play in 5+ seasons', category: 'milestone', tier: 2, threshold: 5 },
  
  // Performance
  winRate60: { id: 'winRate60', emoji: '🎯', name: 'Sharp Shooter', description: 'Achieve 60%+ win rate (min 20 matches)', category: 'performance', tier: 1, threshold: 60, minMatches: 20 },
  winRate70: { id: 'winRate70', emoji: '🎪', name: 'Elite Player', description: 'Achieve 70%+ win rate (min 20 matches)', category: 'performance', tier: 2, threshold: 70, minMatches: 20 },
  winRate80: { id: 'winRate80', emoji: '🏆', name: 'Master', description: 'Achieve 80%+ win rate (min 20 matches)', category: 'performance', tier: 3, threshold: 80, minMatches: 20 },
  goalDiff50: { id: 'goalDiff50', emoji: '⚽', name: 'Goal Machine', description: 'Achieve +50 goal difference', category: 'performance', tier: 1, threshold: 50 },
  goalDiff100: { id: 'goalDiff100', emoji: '🔥', name: 'Goal Master', description: 'Achieve +100 goal difference', category: 'performance', tier: 2, threshold: 100 },
  goalDiff200: { id: 'goalDiff200', emoji: '💥', name: 'Goal Legend', description: 'Achieve +200 goal difference', category: 'performance', tier: 3, threshold: 200 },
  
  // TrueSkill
  trueskill20: { id: 'trueskill20', emoji: '⭐', name: 'Rising Star', description: 'Reach TrueSkill 20', category: 'trueskill', tier: 1, threshold: 20 },
  trueskill25: { id: 'trueskill25', emoji: '🌟', name: 'Star Player', description: 'Reach TrueSkill 25', category: 'trueskill', tier: 2, threshold: 25 },
  trueskill30: { id: 'trueskill30', emoji: '💫', name: 'Elite', description: 'Reach TrueSkill 30', category: 'trueskill', tier: 3, threshold: 30 },
  trueskill35: { id: 'trueskill35', emoji: '🏆', name: 'Master', description: 'Reach TrueSkill 35', category: 'trueskill', tier: 4, threshold: 35 },
  trueskill40: { id: 'trueskill40', emoji: '👑', name: 'Grandmaster', description: 'Reach TrueSkill 40', category: 'trueskill', tier: 5, threshold: 40 },
  trueskill45: { id: 'trueskill45', emoji: '💎', name: 'Legend', description: 'Reach TrueSkill 45', category: 'trueskill', tier: 6, threshold: 45 },
  trueskill50: { id: 'trueskill50', emoji: '🚀', name: 'Mythic', description: 'Reach TrueSkill 50', category: 'trueskill', tier: 7, threshold: 50 },
  
  // Streaks
  winStreak5: { id: 'winStreak5', emoji: '🔥', name: 'Hot Streak', description: 'Win 5 matches in a row', category: 'streak', tier: 1, threshold: 5 },
  winStreak10: { id: 'winStreak10', emoji: '⚡', name: 'On Fire', description: 'Win 10 matches in a row', category: 'streak', tier: 2, threshold: 10 },
  winStreak15: { id: 'winStreak15', emoji: '💥', name: 'Unstoppable', description: 'Win 15 matches in a row', category: 'streak', tier: 3, threshold: 15 },
  
  // Partnerships
  partner10: { id: 'partner10', emoji: '🤝', name: 'Dynamic Duo', description: 'Win 10+ matches with the same partner', category: 'partnership', tier: 1, threshold: 10 },
  partner5: { id: 'partner5', emoji: '👥', name: 'Team Player', description: 'Win with 5+ different partners', category: 'partnership', tier: 1, threshold: 5 },
  
  // Season Achievements
  seasonChampion: { id: 'seasonChampion', emoji: '🏆', name: 'Season Champion', description: 'Win a season', category: 'season', tier: 3, threshold: 1 },
  seasonPodium: { id: 'seasonPodium', emoji: '🥉', name: 'Season Podium', description: 'Finish top 3 in a season', category: 'season', tier: 2, threshold: 1 },
  seasonPoints50: { id: 'seasonPoints50', emoji: '⭐', name: 'Season Star', description: 'Earn 50+ season points in one season', category: 'season', tier: 1, threshold: 50 },
  seasonPoints100: { id: 'seasonPoints100', emoji: '🌟', name: 'Season Elite', description: 'Earn 100+ season points in one season', category: 'season', tier: 2, threshold: 100 },
  seasonPoints200: { id: 'seasonPoints200', emoji: '💎', name: 'Season Legend', description: 'Earn 200+ season points in one season', category: 'season', tier: 3, threshold: 200 },
}

// Calculate all achievements for a player
function calculateAchievements(playerName, matchHistory, tournaments, tournamentList, bestRankingStats, topPartners, currentSkill, totalMatches, wins, winRate, playerAggregated) {
  const normalizedPlayerName = normalizePlayerNameSync(playerName)
  const achievements = []
  const progress = []
  
  // Tournament wins count
  const tournamentWins = bestRankingStats.filter(r => r.place === 1).reduce((sum, r) => sum + r.count, 0)
  const top3Count = bestRankingStats.filter(r => r.place <= 3).reduce((sum, r) => sum + r.count, 0)
  const top5Count = bestRankingStats.filter(r => r.place <= 5).reduce((sum, r) => sum + r.count, 0)
  
  // Find achievement unlock dates from tournament dates
  const getUnlockDate = (count, targetCount, rankingStats) => {
    if (count < targetCount) return null
    // Find the tournament date when the target count was reached
    const sortedWins = []
    rankingStats.forEach(r => {
      if (r.place === 1) {
        r.tournaments.forEach(t => {
          sortedWins.push(new Date(t.date))
        })
      }
    })
    sortedWins.sort((a, b) => a - b) // Sort chronologically
    return sortedWins.length >= targetCount ? sortedWins[targetCount - 1] : null
  }
  
  // Tournament Performance Achievements
  if (tournamentWins >= 1) {
    const unlockDate = getUnlockDate(tournamentWins, 1, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.firstPlace, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.firstPlace, current: tournamentWins, next: 1 })
  }
  
  if (tournamentWins >= 3) {
    const unlockDate = getUnlockDate(tournamentWins, 3, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.champion3, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.champion3, current: tournamentWins, next: 3 })
  }
  
  if (tournamentWins >= 5) {
    const unlockDate = getUnlockDate(tournamentWins, 5, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.champion5, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.champion5, current: tournamentWins, next: 5 })
  }
  
  if (tournamentWins >= 10) {
    const unlockDate = getUnlockDate(tournamentWins, 10, bestRankingStats)
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.champion10, unlocked: true, unlockedDate: unlockDate })
  } else {
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.champion10, current: tournamentWins, next: 10 })
  }
  
  if (top3Count >= 3) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.podium3, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.podium3, current: top3Count, next: 3 })
  
  if (top3Count >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.podium5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.podium5, current: top3Count, next: 5 })
  
  if (top5Count >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.top5_5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.top5_5, current: top5Count, next: 5 })
  
  if (top5Count >= 10) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.top5_10, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.top5_10, current: top5Count, next: 10 })
  
  // Milestone Achievements
  if (totalMatches >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches50, current: totalMatches, next: 50 })
  
  if (totalMatches >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches100, current: totalMatches, next: 100 })
  
  if (totalMatches >= 250) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches250, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches250, current: totalMatches, next: 250 })
  
  if (totalMatches >= 500) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.matches500, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.matches500, current: totalMatches, next: 500 })
  
  if (wins >= 25) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins25, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins25, current: wins, next: 25 })
  
  if (wins >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins50, current: wins, next: 50 })
  
  if (wins >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins100, current: wins, next: 100 })
  
  if (wins >= 250) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.wins250, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.wins250, current: wins, next: 250 })
  
  const tournamentCount = tournamentList.length
  if (tournamentCount >= 10) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments10, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments10, current: tournamentCount, next: 10 })
  
  if (tournamentCount >= 25) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments25, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments25, current: tournamentCount, next: 25 })
  
  if (tournamentCount >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.tournaments50, current: tournamentCount, next: 50 })
  
  // Count unique seasons
  const seasons = new Set()
  tournamentList.forEach(t => {
    const year = new Date(t.date).getFullYear()
    seasons.add(year)
  })
  const seasonCount = seasons.size
  if (seasonCount >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasons5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasons5, current: seasonCount, next: 5 })
  
  // Performance Achievements
  const winRateNum = parseFloat(winRate)
  if (winRateNum >= 60 && totalMatches >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winRate60, unlocked: true, unlockedDate: null })
  else if (totalMatches >= 20) progress.push({ ...ACHIEVEMENT_DEFINITIONS.winRate60, current: winRateNum, next: 60 })
  
  if (winRateNum >= 70 && totalMatches >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winRate70, unlocked: true, unlockedDate: null })
  else if (totalMatches >= 20) progress.push({ ...ACHIEVEMENT_DEFINITIONS.winRate70, current: winRateNum, next: 70 })
  
  if (winRateNum >= 80 && totalMatches >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winRate80, unlocked: true, unlockedDate: null })
  else if (totalMatches >= 20) progress.push({ ...ACHIEVEMENT_DEFINITIONS.winRate80, current: winRateNum, next: 80 })
  
  const goalDiff = playerAggregated ? playerAggregated.goalDiff : 0
  if (goalDiff >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff50, current: goalDiff, next: 50 })
  
  if (goalDiff >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff100, current: goalDiff, next: 100 })
  
  if (goalDiff >= 200) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff200, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.goalDiff200, current: goalDiff, next: 200 })
  
  // TrueSkill Achievements
  if (currentSkill >= 20) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill20, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill20, current: currentSkill, next: 20 })
  
  if (currentSkill >= 25) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill25, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill25, current: currentSkill, next: 25 })
  
  if (currentSkill >= 30) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill30, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill30, current: currentSkill, next: 30 })
  
  if (currentSkill >= 35) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill35, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill35, current: currentSkill, next: 35 })
  
  if (currentSkill >= 40) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill40, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill40, current: currentSkill, next: 40 })
  
  if (currentSkill >= 45) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill45, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill45, current: currentSkill, next: 45 })
  
  if (currentSkill >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.trueskill50, current: currentSkill, next: 50 })
  
  // Win Streak Achievements (calculate from oldest to newest)
  let currentStreak = 0
  let maxStreak = 0
  // Reverse matchHistory to get chronological order (oldest first) for streak calculation
  const chronologicalMatches = [...matchHistory].reverse()
  chronologicalMatches.forEach(entry => {
    if (entry.match.won) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })
  
  if (maxStreak >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak5, current: maxStreak, next: 5 })
  
  if (maxStreak >= 10) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak10, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak10, current: maxStreak, next: 10 })
  
  if (maxStreak >= 15) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak15, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.winStreak15, current: maxStreak, next: 15 })
  
  // Partnership Achievements
  if (topPartners.length > 0 && topPartners[0].wins >= 10) {
    achievements.push({ ...ACHIEVEMENT_DEFINITIONS.partner10, unlocked: true, unlockedDate: null })
  } else {
    const maxPartnerWins = topPartners.length > 0 ? topPartners[0].wins : 0
    progress.push({ ...ACHIEVEMENT_DEFINITIONS.partner10, current: maxPartnerWins, next: 10 })
  }
  
  const uniquePartners = topPartners.length
  if (uniquePartners >= 5) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.partner5, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.partner5, current: uniquePartners, next: 5 })
  
  // Season Achievements (check actual season ranking position, not tournament placement)
  // Calculate season rankings for each season to find the player's actual position
  const seasonStats = new Map()
  
  // Group tournaments by season (year), excluding season finals and tournaments after season final
  const tournamentsBySeason = new Map()
  const seasonFinalsByYear = new Map()
  
  // First pass: find all season finals by year
  tournaments.forEach(tournament => {
    if (!tournament || !tournament.data) return
    if (tournament.isSeasonFinal === true) {
      const year = new Date(tournament.date).getFullYear().toString()
      seasonFinalsByYear.set(year, tournament)
    }
  })
  
  // Second pass: group tournaments by season, excluding season finals and tournaments after season final date
  tournaments.forEach(tournament => {
    if (!tournament || !tournament.data) return
    if (tournament.isSeasonFinal === true) return // Exclude season finals from achievement calculations
    
    const year = new Date(tournament.date).getFullYear().toString()
    const seasonFinal = seasonFinalsByYear.get(year)
    
    // If season final exists, exclude tournaments after the season final date
    if (seasonFinal) {
      const tournamentDate = new Date(tournament.date)
      const finalDate = new Date(seasonFinal.date)
      if (tournamentDate > finalDate) return // Exclude tournaments after season final
    }
    
    if (!tournamentsBySeason.has(year)) {
      tournamentsBySeason.set(year, [])
    }
    tournamentsBySeason.get(year).push(tournament)
  })
  
  // Calculate season ranking for each season
  const seasonPointsMap = {
    1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8,
    9: 7, 10: 6, 11: 5, 12: 4, 13: 3, 14: 2, 15: 1, 16: 1
  }
  
  let bestSeasonPoints = 0
  let bestSeasonRankingPlace = Infinity
  
  tournamentsBySeason.forEach((seasonTournaments, year) => {
    // Calculate season points for all players in this season
    const playerSeasonStats = new Map()
    
    seasonTournaments.forEach(tournament => {
      // Get all players from qualifying
      const qualifyingStandings = tournament.data.qualifying?.[0]?.standings || []
      const eliminationStandings = tournament.data.eliminations?.[0]?.standings || []
      
      // Create a map to track final placements
      const playerFinalPlacement = new Map()
      
      // First, add all qualifying placements
      qualifyingStandings.forEach(player => {
        if (!player.removed && player.stats.matches > 0) {
          const normalizedName = normalizePlayerNameSync(player.name)
          playerFinalPlacement.set(normalizedName, {
            place: player.stats.place
          })
        }
      })
      
      // Override with elimination placements
      eliminationStandings.forEach(player => {
        if (!player.removed) {
          const normalizedName = normalizePlayerNameSync(player.name)
          playerFinalPlacement.set(normalizedName, {
            place: player.stats.place
          })
        }
      })
      
      // Process each player's tournament result
      playerFinalPlacement.forEach((playerData, normalizedName) => {
        if (!playerSeasonStats.has(normalizedName)) {
          playerSeasonStats.set(normalizedName, {
            name: normalizedName,
            seasonPoints: 0
          })
        }
        
        const stats = playerSeasonStats.get(normalizedName)
        const placePoints = seasonPointsMap[playerData.place] || 0
        const attendancePoint = 1 // +1 for attending (everyone gets this)
        stats.seasonPoints += placePoints + attendancePoint
      })
    })
    
    // Sort players by season points to determine ranking
    const seasonRanking = Array.from(playerSeasonStats.values())
      .sort((a, b) => {
        if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints
        return 0
      })
      .map((player, index) => ({
        ...player,
        rankingPlace: index + 1
      }))
    
    // Find the player's position in this season's ranking
    const playerSeasonData = seasonRanking.find(p => p.name === normalizedPlayerName)
    if (playerSeasonData) {
      const seasonPoints = playerSeasonData.seasonPoints
      const rankingPlace = playerSeasonData.rankingPlace
      
      if (seasonPoints > bestSeasonPoints) bestSeasonPoints = seasonPoints
      if (rankingPlace < bestSeasonRankingPlace) bestSeasonRankingPlace = rankingPlace
      
      seasonStats.set(year, {
        points: seasonPoints,
        rankingPlace: rankingPlace
      })
    }
  })
  
  // Check achievements based on actual season ranking position
  if (bestSeasonRankingPlace === 1) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonChampion, unlocked: true, unlockedDate: null })
  if (bestSeasonRankingPlace <= 3 && bestSeasonRankingPlace !== 1) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPodium, unlocked: true, unlockedDate: null })
  
  if (bestSeasonPoints >= 50) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints50, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints50, current: bestSeasonPoints, next: 50 })
  
  if (bestSeasonPoints >= 100) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints100, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints100, current: bestSeasonPoints, next: 100 })
  
  if (bestSeasonPoints >= 200) achievements.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints200, unlocked: true, unlockedDate: null })
  else progress.push({ ...ACHIEVEMENT_DEFINITIONS.seasonPoints200, current: bestSeasonPoints, next: 200 })
  
  return {
    unlocked: achievements.sort((a, b) => {
      // Sort by category, then by tier
      const categoryOrder = { tournament: 1, milestone: 2, performance: 3, trueskill: 4, streak: 5, partnership: 6, season: 7 }
      if (categoryOrder[a.category] !== categoryOrder[b.category]) {
        return categoryOrder[a.category] - categoryOrder[b.category]
      }
      return a.tier - b.tier
    }),
    progress: progress.sort((a, b) => {
      // Sort by progress percentage (closest to completion first)
      const aProgress = (a.current / a.next) * 100
      const bProgress = (b.current / b.next) * 100
      return bProgress - aProgress
    }).slice(0, 5) // Show top 5 in progress
  }
}

// Achievements Display Component
function AchievementsDisplay({ achievements }) {
  const { unlocked, progress } = achievements
  
  return (
    <div className="achievements-container">
      {/* Unlocked Achievements */}
      <div className="achievements-unlocked">
        <h3 className="achievements-section-title">
          <span className="achievements-icon">✅</span>
          Unlocked ({unlocked.length})
        </h3>
        {unlocked.length > 0 ? (
          <div className="achievements-grid">
            {unlocked.map(achievement => (
              <div key={achievement.id} className={`achievement-badge unlocked tier-${achievement.tier}`}>
                <div className="achievement-emoji">{achievement.emoji}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-description">{achievement.description}</div>
                  {achievement.unlockedDate && (
                    <div className="achievement-date">
                      Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-achievements">No achievements unlocked yet. Keep playing!</div>
        )}
      </div>
      
      {/* Progress Toward Next Achievements */}
      {progress.length > 0 && (
        <div className="achievements-progress">
          <h3 className="achievements-section-title">
            <span className="achievements-icon">🎯</span>
            In Progress
          </h3>
          <div className="progress-list">
            {progress.map(achievement => {
              const progressPercent = Math.min((achievement.current / achievement.next) * 100, 100)
              const displayCurrent = achievement.id.includes('winRate') 
                ? achievement.current.toFixed(1) + '%'
                : achievement.current
              const displayNext = achievement.id.includes('winRate')
                ? achievement.next + '%'
                : achievement.next
              
              return (
                <div key={achievement.id} className="progress-item">
                  <div className="progress-header">
                    <span className="progress-emoji">{achievement.emoji}</span>
                    <div className="progress-info">
                      <div className="progress-name">{achievement.name}</div>
                      <div className="progress-description">{achievement.description}</div>
                    </div>
                    <div className="progress-stats">
                      {displayCurrent} / {displayNext}
                    </div>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${progressPercent}%` }}
                    >
                      <span className="progress-percent">{Math.round(progressPercent)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerDetail

