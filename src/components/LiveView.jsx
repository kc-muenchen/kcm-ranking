import { useEffect, useState, useCallback } from 'react'
import './LiveView.css'
import { BettingInterface } from './BettingInterface'
import { BettingLeaderboard } from './BettingLeaderboard'

/**
 * Live View Component
 * Shows all active games from Kickertool
 * 
 * Features:
 * - Real-time game updates via WebSocket
 * - TrueSkill-based win probability predictions
 * - Betting interface with live balance updates
 * - Automatic win notifications when bets are resolved
 */

// Color palette for different tables
const TABLE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
]

// Get color for a table based on its name/number
const getTableColor = (tableName) => {
  // Try to parse as number
  const tableNum = parseInt(tableName)
  if (!isNaN(tableNum)) {
    // Use modulo to cycle through colors
    return TABLE_COLORS[(tableNum - 1) % TABLE_COLORS.length]
  }
  // For non-numeric table names, use hash
  let hash = 0
  for (let i = 0; i < tableName.length; i++) {
    hash = tableName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TABLE_COLORS[Math.abs(hash) % TABLE_COLORS.length]
}

export function LiveView({ aggregatedPlayers = [], bettingUser, onBetPlaced }) {
  const [activeGames, setActiveGames] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)

  // Betting state
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [winNotification, setWinNotification] = useState(null)
  const [activeBets, setActiveBets] = useState([])

  // Track previous active games to detect when games finish
  const [previousGames, setPreviousGames] = useState([])

  // Tournament ID - can be made configurable later
  const tournamentId = '3lF3HVx4gURBojBAnyRXS'

  // Fetch active bets for the logged-in user
  const fetchActiveBets = useCallback(async () => {
    if (!bettingUser) {
      setActiveBets([])
      return
    }

    try {
      const API_BASE_URL = (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) ||
                           import.meta.env.VITE_API_URL ||
                           'http://localhost:3001'
      
      const token = localStorage.getItem('betting_token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/api/betting/bets?status=pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) return

      const bets = await response.json()
      setActiveBets(bets)
    } catch (error) {
      console.error('[LiveView] Error fetching active bets:', error)
    }
  }, [bettingUser])

  // Fetch active bets when user logs in or component mounts
  useEffect(() => {
    fetchActiveBets()
  }, [fetchActiveBets])

  // Check for bet winnings when games finish
  const checkForWinnings = async (currentGames) => {
    if (!bettingUser) return

    // Detect finished games (games that were in previousGames but not in currentGames)
    const previousTableNames = new Set(previousGames.map(g => g.tableName))
    const currentTableNames = new Set(currentGames.map(g => g.tableName))
    
    const finishedTables = Array.from(previousTableNames).filter(
      tableName => !currentTableNames.has(tableName)
    )

    if (finishedTables.length === 0) return

    // Fetch updated user profile to check balance
    try {
      const API_BASE_URL = (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) ||
                           import.meta.env.VITE_API_URL ||
                           'http://localhost:3001'
      
      const token = localStorage.getItem('betting_token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/api/betting/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) return

      const data = await response.json()
      const newBalance = data.balance

      // Check if balance increased
      if (newBalance > bettingUser.balance) {
        const winAmount = newBalance - bettingUser.balance
        setWinNotification({
          amount: winAmount,
          newBalance: newBalance
        })
        
        // Update parent component with new balance
        onBetPlaced(newBalance)

        // Auto-hide notification after 5 seconds
        setTimeout(() => setWinNotification(null), 5000)
      }
    } catch (error) {
      console.error('[LiveView] Error checking for winnings:', error)
    }
  }

  // Calculate win probability based on TrueSkill ratings
  const calculateWinProbability = (team1Players, team2Players) => {
    // Validate inputs
    if (!team1Players || !team2Players || team1Players.length === 0 || team2Players.length === 0) {
      return null
    }

    // Get skill ratings for each player
    const getPlayerSkill = (playerName) => {
      if (!playerName) return 25.0
      
      // Simple lookup - just lowercase and trim
      const normalized = playerName.toLowerCase().trim()

      const player = aggregatedPlayers.find(p => 
        p.name && p.name.toLowerCase().trim() === normalized
      )

      return player?.trueSkill ?? 25.0
    }

    // Calculate average team skill
    const team1Skills = team1Players.map(name => getPlayerSkill(name))
    const team2Skills = team2Players.map(name => getPlayerSkill(name))
    
    const team1Skill = team1Skills.reduce((sum, skill) => sum + skill, 0) / team1Skills.length
    const team2Skill = team2Skills.reduce((sum, skill) => sum + skill, 0) / team2Skills.length

    // Validate calculated skills
    if (isNaN(team1Skill) || isNaN(team2Skill)) {
      return null
    }

    // Calculate win probability using logistic function
    // Based on skill difference, using scale factor for TrueSkill
    const skillDiff = team1Skill - team2Skill
    const scaleFactor = 3.0 // Adjusts sensitivity of probability
    const probability = 1 / (1 + Math.exp(-skillDiff / scaleFactor))

    // Validate probability
    if (isNaN(probability)) {
      return null
    }

    return {
      team1Probability: probability,
      team2Probability: 1 - probability,
      team1Skill,
      team2Skill
    }
  }

  useEffect(() => {
    // Load Socket.IO dynamically
    let socket = null
    let script = null

    const loadSocketIO = () => {
      return new Promise((resolve, reject) => {
        if (window.io) {
          resolve(window.io)
          return
        }

        script = document.createElement('script')
        script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js'
        script.onload = () => resolve(window.io)
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const fetchTournamentData = async (tournamentId) => {
      const timestamp = Date.now()
      const targetUrl = `https://live.kickertool.de/api/table_soccer/tournaments/${tournamentId}.json?t=${timestamp}`
      
      // Try multiple CORS proxies in order
      const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
      ]
      
      for (let i = 0; i < proxies.length; i++) {
        try {
          console.log(`[LiveView] Attempting to fetch via proxy ${i + 1}/${proxies.length}`)
          const response = await fetch(proxies[i], {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          })
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('[LiveView] Successfully fetched tournament data')
          return data
        } catch (error) {
          console.error(`[LiveView] Proxy ${i + 1} failed:`, error.message)
          if (i === proxies.length - 1) {
            // All proxies failed
            console.error('[LiveView] All proxies failed')
            return null
          }
          // Try next proxy
        }
      }
      
      return null
    }

    const hasActiveTable = (match) => {
      if (!match.tables || !Array.isArray(match.tables) || match.tables.length === 0) {
        return false
      }
      // Check if match has any table assigned (active game)
      return match.tables.some(table => table && table.name)
    }

    const getTableName = (match) => {
      if (!match.tables || !Array.isArray(match.tables) || match.tables.length === 0) {
        return null
      }
      const table = match.tables.find(t => t && t.name)
      return table ? table.name : null
    }

    const renderTeams = (tournamentData) => {
      let allMatches = []
      
      if (tournamentData.qualifying && Array.isArray(tournamentData.qualifying)) {
        tournamentData.qualifying.forEach(qualifying => {
          if (qualifying.rounds && Array.isArray(qualifying.rounds)) {
            qualifying.rounds.forEach(round => {
              if (round.matches && Array.isArray(round.matches)) {
                allMatches = allMatches.concat(round.matches)
              }
            })
          }
        })
      } else if (tournamentData.rounds && Array.isArray(tournamentData.rounds)) {
        tournamentData.rounds.forEach(round => {
          if (round.matches && Array.isArray(round.matches)) {
            allMatches = allMatches.concat(round.matches)
          }
        })
      } else if (tournamentData.matches && Array.isArray(tournamentData.matches)) {
        allMatches = tournamentData.matches
      }
      
      // Filter for matches with active tables
      const activeMatches = allMatches.filter(match => hasActiveTable(match))
      
      // Sort by most recent and group by table
      const sortedMatches = activeMatches.sort((a, b) => {
        const timeA = a.timeStart || 0
        const timeB = b.timeStart || 0
        return timeB - timeA
      })
      
      // Get the most recent match per table
      const gamesByTable = new Map()
      sortedMatches.forEach(match => {
        const tableName = getTableName(match)
        if (tableName && !gamesByTable.has(tableName)) {
          let team1 = []
          let team2 = []
          
          if (match.team1 && match.team1.players && Array.isArray(match.team1.players)) {
            team1 = match.team1.players.map(p => 
              p.name || `${p.external?.firstName || ''} ${p.external?.lastName || ''}`.trim() || 'Unknown'
            ).filter(Boolean)
          }
          
          if (match.team2 && match.team2.players && Array.isArray(match.team2.players)) {
            team2 = match.team2.players.map(p => 
              p.name || `${p.external?.firstName || ''} ${p.external?.lastName || ''}`.trim() || 'Unknown'
            ).filter(Boolean)
          }
          
          if (team1.length > 0 || team2.length > 0) {
            gamesByTable.set(tableName, {
              tableName,
              team1,
              team2
            })
          }
        }
      })
      
      // Convert to array and sort by table name
      const games = Array.from(gamesByTable.values()).sort((a, b) => {
        // Sort numerically if both are numbers, otherwise alphabetically
        const aNum = parseInt(a.tableName)
        const bNum = parseInt(b.tableName)
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum
        }
        return a.tableName.localeCompare(b.tableName)
      })
      
      // Check for winnings if games have finished
      checkForWinnings(games)
      
      // Update previous games for next comparison
      setPreviousGames(games)
      
      setActiveGames(games)
      setError(null)
    }

    // Initialize
    const init = async () => {
      try {
        await loadSocketIO()
        
        socket = window.io('https://api.kickertool.com/result', {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          query: { tournamentId },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        })

        socket.on('connect', async () => {
          setIsConnected(true)
          const tournamentData = await fetchTournamentData(tournamentId)
          if (tournamentData) {
            renderTeams(tournamentData)
          }
        })

        socket.on('disconnect', () => {
          setIsConnected(false)
        })

        socket.on('tournament-update', async (data) => {
          const updateTournamentId = data?.tournamentId || tournamentId
          const tournamentData = await fetchTournamentData(updateTournamentId)
          if (tournamentData) {
            renderTeams(tournamentData)
          }
        })

        // Initial load
        const tournamentData = await fetchTournamentData(tournamentId)
        if (tournamentData) {
          renderTeams(tournamentData)
        } else {
          setError('Unable to load tournament data')
        }
      } catch (err) {
        console.error('[LiveView] Initialization error:', err)
        setError('Failed to initialize live view')
      }
    }

    init()

    return () => {
      if (socket) {
        socket.disconnect()
      }
      if (script) {
        document.head.removeChild(script)
      }
    }
  }, [tournamentId])

  return (
    <div id="live-view" className="live-view">
      <div className="live-view-header">
        <div className="live-view-title">
          <span className="live-indicator">
            <span className={`live-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          </span>
          <span>📺 Live Games</span>
        </div>
        <div className="live-view-header-actions">
          <button className="betting-leaderboard-btn" onClick={() => setShowLeaderboard(true)}>
            🏆 Leaderboard
          </button>
        </div>
        {error && <div className="live-view-error">{error}</div>}
      </div>

      {showLeaderboard && <BettingLeaderboard onClose={() => setShowLeaderboard(false)} />}
      
      {/* Win Notification */}
      {winNotification && (
        <div className="win-notification">
          <div className="win-notification-content">
            <span className="win-notification-icon">🎉</span>
            <div className="win-notification-text">
              <div className="win-notification-title">You won!</div>
              <div className="win-notification-amount">+💰 {winNotification.amount.toFixed(2)}</div>
              <div className="win-notification-balance">New balance: 💰 {winNotification.newBalance.toFixed(2)}</div>
            </div>
            <button 
              className="win-notification-close" 
              onClick={() => setWinNotification(null)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {activeGames.length > 0 ? (
        <div className="live-games-list">
          {activeGames.map((game, index) => {
            // Get color for this table
            const tableColor = getTableColor(game.tableName)
            
            // Calculate prediction
            let prediction = null
            if (aggregatedPlayers.length > 0 && game.team1.length > 0 && game.team2.length > 0) {
              try {
                prediction = calculateWinProbability(game.team1, game.team2)
              } catch (error) {
                console.error('[LiveView] Error calculating prediction:', error)
              }
            }

            // Find active bet for this game
            const activeBet = activeBets.find(
              bet => bet.tournamentId === tournamentId && bet.tableName === game.tableName
            )

            return (
              <div 
                key={index} 
                className="live-game-row"
                style={{ '--table-color': tableColor }}
              >
                <div className="game-table-badge" style={{ backgroundColor: `${tableColor}20`, color: tableColor }}>
                  Table {game.tableName}
                </div>
              <div className="game-teams">
                <div className="game-team">
                  <span className="team-players">
                    {game.team1.map((name, idx) => (
                      <span key={idx} className="player-name">
                        {name}
                        {idx < game.team1.length - 1 && <span className="separator">/</span>}
                      </span>
                    ))}
                  </span>
                  {prediction && (
                    <div className="team-win-probability" style={{ opacity: prediction.team1Probability > 0.5 ? 1 : 0.5 }}>
                      {Math.round(prediction.team1Probability * 100)}%
                    </div>
                  )}
                </div>
                <div className="game-vs">VS</div>
                <div className="game-team">
                  <span className="team-players">
                    {game.team2.map((name, idx) => (
                      <span key={idx} className="player-name">
                        {name}
                        {idx < game.team2.length - 1 && <span className="separator">/</span>}
                      </span>
                    ))}
                  </span>
                  {prediction && (
                    <div className="team-win-probability" style={{ opacity: prediction.team2Probability > 0.5 ? 1 : 0.5 }}>
                      {Math.round(prediction.team2Probability * 100)}%
                    </div>
                  )}
                </div>
              </div>
              {prediction && (
                <div className="prediction-bar">
                  <div 
                    className="prediction-bar-fill" 
                    style={{ 
                      width: `${prediction.team1Probability * 100}%`,
                      backgroundColor: tableColor 
                    }}
                  ></div>
                </div>
              )}
              
              {/* Active Bet Display */}
              {activeBet && (
                <div className="active-bet-display" style={{ borderColor: tableColor }}>
                  <div className="active-bet-header">
                    <span className="active-bet-icon">🎲</span>
                    <span className="active-bet-title">Your Active Bet</span>
                  </div>
                  <div className="active-bet-details">
                    <div className="active-bet-row">
                      <span className="active-bet-label">Betting on:</span>
                      <span className="active-bet-value active-bet-team">
                        Team {activeBet.predictedWinner}
                        {activeBet.predictedWinner === 1 ? (
                          <span className="active-bet-players">
                            ({game.team1.join(' / ')})
                          </span>
                        ) : (
                          <span className="active-bet-players">
                            ({game.team2.join(' / ')})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="active-bet-row">
                      <span className="active-bet-label">Amount:</span>
                      <span className="active-bet-value active-bet-amount">💰 {activeBet.amount.toFixed(2)}</span>
                    </div>
                    <div className="active-bet-row">
                      <span className="active-bet-label">Potential payout:</span>
                      <span className="active-bet-value active-bet-payout">
                        💰 {(activeBet.amount / activeBet.odds).toFixed(2)}
                      </span>
                    </div>
                    <div className="active-bet-row">
                      <span className="active-bet-label">Win chance:</span>
                      <span className="active-bet-value">
                        {(activeBet.odds * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Betting Interface */}
              {bettingUser && !activeBet && (
                <BettingInterface
                  game={game}
                  prediction={prediction}
                  tableColor={tableColor}
                  user={bettingUser}
                  onBetPlaced={(newBalance) => {
                    onBetPlaced(newBalance)
                    fetchActiveBets()
                  }}
                />
              )}
            </div>
            )
          })}
        </div>
      ) : (
        !error && (
          <div className="live-view-empty">
            <p>No active games</p>
          </div>
        )
      )}
    </div>
  )
}

