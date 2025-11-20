import { useState, useEffect } from 'react'
import TournamentSelector from './components/TournamentSelector'
import RankingTable from './components/RankingTable'
import StatsCards from './components/StatsCards'
import ViewToggle from './components/ViewToggle'
import EliminationBracket from './components/EliminationBracket'
import PlayerDetail from './components/PlayerDetail'
import ScrollToTop from './components/ScrollToTop'
import { calculateTrueSkillRatings, getConservativeRating } from './utils/trueskill'
import { normalizePlayerNameSync, preloadAliases } from './config/playerAliases'
import { API_ENDPOINTS, apiFetch } from './config/api'
import logo from './Logo-kcm.png'
import './App.css'

function App() {
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [aggregatedPlayers, setAggregatedPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('overall') // 'tournament' or 'overall'
  const [selectedPlayer, setSelectedPlayer] = useState(null) // For individual player view
  const [playerHistory, setPlayerHistory] = useState(new Map()) // TrueSkill history per player

  useEffect(() => {
    // Preload aliases from API, then load tournaments
    preloadAliases().then(() => {
      loadTournaments()
    })
  }, [])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        // Restore state from history
        setViewMode(event.state.viewMode || 'tournament')
        setSelectedTournament(event.state.tournamentId ? 
          tournaments.find(t => t.id === event.state.tournamentId) : 
          tournaments[0])
        setSelectedPlayer(event.state.playerName || null)
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Initialize state from URL on first load
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view')
    const player = params.get('player')
    const tournamentId = params.get('tournament')

    if (view) setViewMode(view)
    if (player) setSelectedPlayer(player)
    if (tournamentId && tournaments.length > 0) {
      const tournament = tournaments.find(t => t.id === tournamentId)
      if (tournament) setSelectedTournament(tournament)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [tournaments])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      
      // Fetch tournaments from backend API
      const tournamentsData = await apiFetch(API_ENDPOINTS.tournaments)
      
      // Transform API response to match the expected format
      const loadedTournaments = tournamentsData
        .map(tournament => ({
          id: tournament.externalId || tournament.id,
          name: tournament.name,
          date: tournament.createdAt,
          fileName: `${tournament.name}.json`, // For display purposes
          data: tournament.rawData // Backend should return the full tournament data
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      console.log(`Loaded ${loadedTournaments.length} tournaments from API`)
      
      setTournaments(loadedTournaments)
      if (loadedTournaments.length > 0) {
        setSelectedTournament(loadedTournaments[0])
        processPlayers(loadedTournaments[0].data)
        processAggregatedPlayers(loadedTournaments)
      }
    } catch (error) {
      console.error('Error loading tournaments from API:', error)
      
      // Fallback to JSON files if API is not available (for development)
      console.warn('Falling back to local JSON files...')
      await loadTournamentsFromFiles()
    } finally {
      setLoading(false)
    }
  }

  // Fallback method: load from JSON files (for development when API is down)
  const loadTournamentsFromFiles = async () => {
    try {
      // Use Vite's glob import to automatically load all JSON files
      const tournamentModules = import.meta.glob('../dummy_data/*.json')
      
      const loadedTournaments = await Promise.all(
        Object.entries(tournamentModules).map(async ([path, importFn]) => {
          try {
            const module = await importFn()
            const data = module.default
            const fileName = path.split('/').pop()
            
            return {
              id: data._id,
              name: data.name,
              date: data.createdAt,
              fileName: fileName,
              data: data
            }
          } catch (error) {
            console.warn(`Error loading ${path}:`, error)
            return null
          }
        })
      )

      // Filter out any failed loads and sort by date (most recent first)
      const validTournaments = loadedTournaments
        .filter(t => t !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      console.log(`Loaded ${validTournaments.length} tournaments from files`)
      
      setTournaments(validTournaments)
      if (validTournaments.length > 0) {
        setSelectedTournament(validTournaments[0])
        processPlayers(validTournaments[0].data)
        processAggregatedPlayers(validTournaments)
      }
    } catch (error) {
      console.error('Error loading tournaments from files:', error)
    }
  }

  const processPlayers = (tournamentData) => {
    if (!tournamentData.qualifying || tournamentData.qualifying.length === 0) {
      setPlayers([])
      return
    }

    // Get qualifying standings
    const qualifyingStandings = tournamentData.qualifying[0].standings || []
    
    // Create a map to aggregate stats by player ID
    const playerStatsMap = new Map()
    
    // Process qualifying round
    qualifyingStandings.forEach(player => {
      if (player.deactivated || player.removed) return
      
      const normalizedName = normalizePlayerNameSync(player.name)
      
      playerStatsMap.set(player._id, {
        id: player._id,
        name: normalizedName,
        qualifyingPlace: player.stats.place,
        matches: player.stats.matches,
        points: player.stats.points,
        won: player.stats.won,
        lost: player.stats.lost,
        goalsFor: player.stats.goals,
        goalsAgainst: player.stats.goals_in,
        goalDiff: player.stats.goal_diff,
        pointsPerGame: player.stats.points_per_game,
        correctedPointsPerGame: player.stats.corrected_points_per_game,
        bh1: player.stats.bh1,
        bh2: player.stats.bh2,
        external: player.external,
        eliminationPlace: null
      })
    })
    
    // Process elimination rounds if they exist
    if (tournamentData.eliminations && tournamentData.eliminations.length > 0) {
      tournamentData.eliminations.forEach(elimination => {
        const eliminationStandings = elimination.standings || []
        
        eliminationStandings.forEach(player => {
          if (player.deactivated || player.removed) return
          
          const existingPlayer = playerStatsMap.get(player._id)
          
          if (existingPlayer) {
            // Add elimination stats to existing player
            existingPlayer.matches += player.stats.matches
            existingPlayer.points += player.stats.points
            existingPlayer.won += player.stats.won
            existingPlayer.lost += player.stats.lost
            existingPlayer.goalsFor += player.stats.goals
            existingPlayer.goalsAgainst += player.stats.goals_in
            existingPlayer.goalDiff = existingPlayer.goalsFor - existingPlayer.goalsAgainst
            existingPlayer.eliminationPlace = player.stats.place
            
            // Recalculate points per game
            if (existingPlayer.matches > 0) {
              existingPlayer.pointsPerGame = (existingPlayer.points / existingPlayer.matches).toFixed(2)
            }
          }
        })
      })
    }
    
    // Convert map to array and calculate final stats
    const processedPlayers = Array.from(playerStatsMap.values())
      .map(player => ({
        ...player,
        winRate: player.matches > 0 
          ? ((player.won / player.matches) * 100).toFixed(1)
          : 0,
        // Use elimination place if available, otherwise qualifying place
        finalPlace: player.eliminationPlace !== null ? player.eliminationPlace : player.qualifyingPlace
      }))
      .sort((a, b) => {
        // Sort by final place (elimination > qualifying)
        if (a.eliminationPlace !== null && b.eliminationPlace !== null) {
          return a.eliminationPlace - b.eliminationPlace
        }
        if (a.eliminationPlace !== null) return -1
        if (b.eliminationPlace !== null) return 1
        return a.qualifyingPlace - b.qualifyingPlace
      })

    setPlayers(processedPlayers)
  }

  const processAggregatedPlayers = (loadedTournaments) => {
    const playerStats = new Map()

    // Calculate TrueSkill ratings across all tournaments
    const { playerRatings: trueSkillRatings, playerHistory: history } = calculateTrueSkillRatings(loadedTournaments)
    setPlayerHistory(history) // Store player history for individual player view

    // Season points distribution (places 1-16)
    const seasonPointsMap = {
      1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8,
      9: 7, 10: 6, 11: 5, 12: 4, 13: 3, 14: 2, 15: 1, 16: 1
    }

    // Aggregate stats from all tournaments
    loadedTournaments.forEach(tournament => {
      // Get all players from qualifying
      const qualifyingStandings = tournament.data.qualifying?.[0]?.standings || []
      
      // Get all players from eliminations (final tournament placement)
      const eliminationStandings = tournament.data.eliminations?.[0]?.standings || []
      
      // Create a map to track final placements (elimination takes precedence)
      const playerFinalPlacement = new Map()
      
      // First, add all qualifying placements
      qualifyingStandings.forEach(player => {
        if (!player.removed && player.stats.matches > 0) {
          const normalizedName = normalizePlayerNameSync(player.name)
          playerFinalPlacement.set(normalizedName, {
            place: player.stats.place,
            stats: player.stats,
            external: player.external
          })
        }
      })
      
      // Override with elimination placements (these are the final tournament results)
      eliminationStandings.forEach(player => {
        if (!player.removed) {
          const normalizedName = normalizePlayerNameSync(player.name)
          const existing = playerFinalPlacement.get(normalizedName)
          if (existing) {
            playerFinalPlacement.set(normalizedName, {
              ...existing,
              place: player.stats.place // Use elimination place as final place
            })
          }
        }
      })
      
      // Process each player's tournament result
      playerFinalPlacement.forEach((playerData, normalizedName) => {
        if (!playerStats.has(normalizedName)) {
          playerStats.set(normalizedName, {
            name: normalizedName,
            matches: 0,
            points: 0,
            won: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            tournaments: 0,
            external: playerData.external,
            bestPlace: playerData.place,
            places: [],
            seasonPoints: 0
          })
        }

        const stats = playerStats.get(normalizedName)
        stats.matches += playerData.stats.matches
        stats.points += playerData.stats.points
        stats.won += playerData.stats.won
        stats.lost += playerData.stats.lost
        stats.goalsFor += playerData.stats.goals
        stats.goalsAgainst += playerData.stats.goals_in
        stats.tournaments += 1
        stats.bestPlace = Math.min(stats.bestPlace, playerData.place)
        stats.places.push(playerData.place)
        
        // Calculate season points based on final placement
        const placePoints = seasonPointsMap[playerData.place] || 0
        const attendancePoint = placePoints === 0 ? 1 : 0 // +1 for attending if not in top 16
        stats.seasonPoints += placePoints + attendancePoint
      })
    })

    // Convert to array and calculate derived stats
    const aggregated = Array.from(playerStats.values())
      .filter(player => player.matches > 0)
      .map(player => {
        const rating = trueSkillRatings.get(player.name)
        const trueSkill = rating ? getConservativeRating(rating) : 0
        
        return {
          id: player.name,
          name: player.name,
          matches: player.matches,
          points: player.points,
          won: player.won,
          lost: player.lost,
          goalsFor: player.goalsFor,
          goalsAgainst: player.goalsAgainst,
          goalDiff: player.goalsFor - player.goalsAgainst,
          tournaments: player.tournaments,
          bestPlace: player.bestPlace,
          avgPlace: (player.places.reduce((a, b) => a + b, 0) / player.places.length).toFixed(1),
          pointsPerGame: player.matches > 0 ? (player.points / player.matches).toFixed(2) : 0,
          winRate: player.matches > 0 
            ? ((player.won / player.matches) * 100).toFixed(1)
            : 0,
          trueSkill: trueSkill,
          seasonPoints: player.seasonPoints,
          external: player.external
        }
      })
      .sort((a, b) => {
        // Sort by season points (primary), then TrueSkill, then total points
        const seasonPointsDiff = b.seasonPoints - a.seasonPoints
        if (seasonPointsDiff !== 0) return seasonPointsDiff
        
        const trueSkillDiff = b.trueSkill - a.trueSkill
        if (trueSkillDiff !== 0) return trueSkillDiff
        
        return b.points - a.points
      })
      .map((player, index) => ({
        ...player,
        place: index + 1
      }))

    setAggregatedPlayers(aggregated)
  }

  const handleTournamentChange = (tournament) => {
    setSelectedTournament(tournament)
    processPlayers(tournament.data)
    
    // Update URL with tournament selection
    const params = new URLSearchParams(window.location.search)
    params.set('tournament', tournament.id)
    params.delete('player') // Clear player selection when changing tournament
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(
      { viewMode, tournamentId: tournament.id, playerName: null },
      '',
      newUrl
    )
  }

  const handlePlayerSelect = (playerName) => {
    setSelectedPlayer(playerName)
    
    // Push state to browser history
    const params = new URLSearchParams(window.location.search)
    params.set('player', playerName)
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(
      { viewMode, tournamentId: selectedTournament?.id, playerName },
      '',
      newUrl
    )
  }

  const handleBackFromPlayer = () => {
    setSelectedPlayer(null)
    
    // Go back in history
    window.history.back()
  }

  const currentPlayers = viewMode === 'overall' ? aggregatedPlayers : players

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading tournament data...</p>
        </div>
      </div>
    )
  }

  // If a player is selected, show their detail page
  if (selectedPlayer) {
    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <h1 className="title">
              <img src={logo} alt="KCM Logo" className="logo" />
              KCM Ranking
            </h1>
            <p className="subtitle">Table Soccer Tournament Rankings</p>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <PlayerDetail 
              playerName={selectedPlayer}
              playerHistory={playerHistory}
              tournaments={tournaments}
              aggregatedPlayers={aggregatedPlayers}
              onBack={handleBackFromPlayer}
            />
          </div>
        </main>

        <ScrollToTop />

        <footer className="footer">
          <div className="container">
            <p>KC München Table Soccer Rankings</p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="title">
            <img src={logo} alt="KCM Logo" className="logo" />
            KCM Ranking
          </h1>
          <p className="subtitle">Table Soccer Tournament Rankings</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <ViewToggle 
            viewMode={viewMode} 
            onViewModeChange={(newViewMode) => {
              setViewMode(newViewMode)
              
              // Update URL with view mode
              const params = new URLSearchParams(window.location.search)
              params.set('view', newViewMode)
              params.delete('player') // Clear player selection when changing view
              const newUrl = `${window.location.pathname}?${params.toString()}`
              window.history.pushState(
                { viewMode: newViewMode, tournamentId: selectedTournament?.id, playerName: null },
                '',
                newUrl
              )
            }}
          />

          {viewMode === 'tournament' && (
            <TournamentSelector
              tournaments={tournaments}
              selectedTournament={selectedTournament}
              onSelectTournament={handleTournamentChange}
            />
          )}

          {currentPlayers.length > 0 ? (
            <>
              <StatsCards 
                players={currentPlayers}
                viewMode={viewMode}
                tournaments={tournaments}
              />
              <RankingTable 
                players={currentPlayers}
                viewMode={viewMode}
                onPlayerSelect={handlePlayerSelect}
              />
              {viewMode === 'tournament' && selectedTournament && selectedTournament.data.eliminations && (
                <EliminationBracket eliminationData={selectedTournament.data.eliminations} />
              )}
            </>
          ) : (
            <div className="no-data">
              <p>No player data available.</p>
            </div>
          )}
        </div>
      </main>

      <ScrollToTop />

      <footer className="footer">
        <div className="container">
          <p>KC München Table Soccer Rankings</p>
        </div>
      </footer>
    </div>
  )
}

export default App
