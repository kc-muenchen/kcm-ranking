import { useState } from 'react'
import { normalizePlayerNameSync } from '../config/playerAliases'
import './PlayerDetail.css'

function PlayerDetail({ playerName, playerHistory, tournaments, aggregatedPlayers, onBack }) {
  const [selectedComparePlayer, setSelectedComparePlayer] = useState('')
  
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
      const attendancePoint = placePoints === 0 ? 1 : 0
      
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

export default PlayerDetail

