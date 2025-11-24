import { useState, useEffect } from 'react'
import TournamentSelector from './components/TournamentSelector'
import SeasonSelector from './components/SeasonSelector'
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
  const [seasonPlayers, setSeasonPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('overall') // 'tournament', 'overall', or 'season'
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null) // For individual player view
  const [playerHistory, setPlayerHistory] = useState(new Map()) // TrueSkill history per player
  const [showFinaleQualifiers, setShowFinaleQualifiers] = useState(false) // Filter for season finale qualifiers
  const [showSurelyQualified, setShowSurelyQualified] = useState(false) // Filter for surely qualified players
  const [isQualificationInfoExpanded, setIsQualificationInfoExpanded] = useState(false) // Expandable info box state

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
        setSelectedSeason(event.state.season || null)
        setShowFinaleQualifiers(event.state.finaleQualifiers || false)
        setShowSurelyQualified(event.state.surelyQualified || false)
      } else {
        // If no state, read from URL
        const params = new URLSearchParams(window.location.search)
        const finaleQualifiers = params.get('finaleQualifiers')
        const surelyQualified = params.get('surelyQualified')
        setShowFinaleQualifiers(finaleQualifiers === 'true')
        setShowSurelyQualified(surelyQualified === 'true')
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Initialize state from URL on first load
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view')
    const player = params.get('player')
    const tournamentId = params.get('tournament')
    const season = params.get('season')
    const finaleQualifiers = params.get('finaleQualifiers')
    const surelyQualified = params.get('surelyQualified')

    if (view) setViewMode(view)
    if (player) setSelectedPlayer(player)
    if (tournamentId && tournaments.length > 0) {
      const tournament = tournaments.find(t => t.id === tournamentId)
      if (tournament) setSelectedTournament(tournament)
    }
    if (season && tournaments.length > 0) {
      setSelectedSeason(season)
      processSeasonPlayers(tournaments, season)
    }
    if (finaleQualifiers === 'true') {
      setShowFinaleQualifiers(true)
    }
    if (surelyQualified === 'true') {
      setShowSurelyQualified(true)
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
          isSeasonFinal: tournament.isSeasonFinal || false, // Include season final flag from database
          data: tournament.rawData // Backend should return the full tournament data
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      console.log(`Loaded ${loadedTournaments.length} tournaments from API`)
      
      setTournaments(loadedTournaments)
      if (loadedTournaments.length > 0) {
        setSelectedTournament(loadedTournaments[0])
        processPlayers(loadedTournaments[0].data)
        processAggregatedPlayers(loadedTournaments)
        
        // Set default season to the most recent year
        const seasons = getAvailableSeasons(loadedTournaments)
        if (seasons.length > 0 && !selectedSeason) {
          setSelectedSeason(seasons[0])
          processSeasonPlayers(loadedTournaments, seasons[0])
        }
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
              isSeasonFinal: false, // Default to false for file-based tournaments (can be updated later)
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
        
        // Set default season to the most recent year
        const seasons = getAvailableSeasons(validTournaments)
        if (seasons.length > 0 && !selectedSeason) {
          setSelectedSeason(seasons[0])
          processSeasonPlayers(validTournaments, seasons[0])
        }
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

    // Season points distribution (places 1-5, everyone below 4th shares place 5)
    const seasonPointsMap = {
      1: 25, 2: 20, 3: 16, 4: 13, 5: 10
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
        // Places 5-16 are treated as place 5, places > 16 get 0 points
        const effectivePlace = (playerData.place >= 5 && playerData.place <= 16) ? 5 : playerData.place
        const placePoints = effectivePlace <= 5 ? (seasonPointsMap[effectivePlace] || 0) : 0
        const attendancePoint = 1; // +1 for attending (everyone gets this)
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

  // Get available seasons (years) from tournaments
  const getAvailableSeasons = (loadedTournaments) => {
    const years = new Set()
    loadedTournaments.forEach(tournament => {
      const year = new Date(tournament.date).getFullYear()
      years.add(year.toString())
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)) // Most recent first
  }

  // Get season final tournament for a given season
  const getSeasonFinal = (seasonYear) => {
    return tournaments.find(tournament => {
      const tournamentYear = new Date(tournament.date).getFullYear()
      return tournamentYear.toString() === seasonYear && tournament.isSeasonFinal === true
    })
  }

  // Process players for a specific season (year)
  const processSeasonPlayers = (loadedTournaments, seasonYear) => {
    // Find the season final for this season
    const seasonFinal = loadedTournaments.find(tournament => {
      const tournamentYear = new Date(tournament.date).getFullYear()
      return tournamentYear.toString() === seasonYear && tournament.isSeasonFinal === true
    })
    
    // Filter tournaments by year, exclude season finals, and exclude tournaments after season final date
    const seasonTournaments = loadedTournaments.filter(tournament => {
      const tournamentYear = new Date(tournament.date).getFullYear()
      const isInSeason = tournamentYear.toString() === seasonYear
      
      // Exclude season finals
      if (tournament.isSeasonFinal) return false
      
      // If season final exists, exclude tournaments after the season final date
      if (seasonFinal) {
        const tournamentDate = new Date(tournament.date)
        const finalDate = new Date(seasonFinal.date)
        if (tournamentDate > finalDate) return false
      }
      
      return isInSeason
    })

    if (seasonTournaments.length === 0) {
      setSeasonPlayers([])
      return
    }

    // Use the same logic as processAggregatedPlayers but only for season tournaments
    const playerStats = new Map()

    // Calculate TrueSkill ratings for season tournaments only
    const { playerRatings: trueSkillRatings } = calculateTrueSkillRatings(seasonTournaments)

    // Season points distribution (places 1-5, everyone below 4th shares place 5)
    const seasonPointsMap = {
      1: 25, 2: 20, 3: 16, 4: 13, 5: 10
    }

    // Aggregate stats from season tournaments only
    seasonTournaments.forEach(tournament => {
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
        // Places 5-16 are treated as place 5, places > 16 get 0 points
        const effectivePlace = (playerData.place >= 5 && playerData.place <= 16) ? 5 : playerData.place
        const placePoints = effectivePlace <= 5 ? (seasonPointsMap[effectivePlace] || 0) : 0
        const attendancePoint = 1 // +1 for attending (everyone gets this)
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

    // Calculate finale status for all players (based on eligibility and ranking)
    // First, get eligible players (10+ tournaments) sorted by their current position
    const eligiblePlayers = aggregated.filter(player => player.tournaments >= 10)
    
    // Add finale status to all players
    const playersWithStatus = aggregated.map(player => {
      let finaleStatus = null
      if (player.tournaments >= 10) {
        const eligibleIndex = eligiblePlayers.findIndex(p => p.name === player.name)
        if (eligibleIndex < 20) {
          finaleStatus = 'qualified'
        } else if (eligibleIndex < 25) {
          finaleStatus = 'successor'
        }
      }
      return {
        ...player,
        finaleStatus: finaleStatus
      }
    })

    setSeasonPlayers(playersWithStatus)
  }

  const handleSeasonChange = (season) => {
    setSelectedSeason(season)
    processSeasonPlayers(tournaments, season)
    
    // Update URL with season selection
    const params = new URLSearchParams(window.location.search)
    params.set('season', season)
    params.delete('player') // Clear player selection when changing season
    // Keep finaleQualifiers and surelyQualified in URL if they're set
    if (showFinaleQualifiers) {
      params.set('finaleQualifiers', 'true')
    } else {
      params.delete('finaleQualifiers')
    }
    if (showSurelyQualified) {
      params.set('surelyQualified', 'true')
    } else {
      params.delete('surelyQualified')
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(
      { viewMode, season, playerName: null, finaleQualifiers: showFinaleQualifiers, surelyQualified: showSurelyQualified },
      '',
      newUrl
    )
  }

  const handleFinaleQualifiersToggle = (enabled) => {
    setShowFinaleQualifiers(enabled)
    
    // Update URL with filter state
    const params = new URLSearchParams(window.location.search)
    if (enabled) {
      params.set('finaleQualifiers', 'true')
    } else {
      params.delete('finaleQualifiers')
    }
    // Keep surelyQualified state
    if (showSurelyQualified) {
      params.set('surelyQualified', 'true')
    } else {
      params.delete('surelyQualified')
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(
      { viewMode, season: selectedSeason, playerName: null, finaleQualifiers: enabled, surelyQualified: showSurelyQualified },
      '',
      newUrl
    )
  }

  const handleSurelyQualifiedToggle = (enabled) => {
    setShowSurelyQualified(enabled)
    
    // Update URL with filter state
    const params = new URLSearchParams(window.location.search)
    if (enabled) {
      params.set('surelyQualified', 'true')
    } else {
      params.delete('surelyQualified')
    }
    // Keep finaleQualifiers state
    if (showFinaleQualifiers) {
      params.set('finaleQualifiers', 'true')
    } else {
      params.delete('finaleQualifiers')
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState(
      { viewMode, season: selectedSeason, playerName: null, finaleQualifiers: showFinaleQualifiers, surelyQualified: enabled },
      '',
      newUrl
    )
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

  // Calculate which players are "surely qualified" (will remain in top 20 even if they skip next tournament)
  const calculateSurelyQualified = (players) => {
    // Only consider players with 10+ tournaments (eligible for finale)
    const eligiblePlayers = players.filter(player => player.tournaments >= 10)
    
    if (eligiblePlayers.length <= 20) {
      // If there are 20 or fewer eligible players, all are surely qualified
      return new Set(eligiblePlayers.map(p => p.name))
    }
    
    // Sort eligible players by current ranking (season points, then TrueSkill, then points)
    const sortedEligible = [...eligiblePlayers].sort((a, b) => {
      const seasonPointsDiff = b.seasonPoints - a.seasonPoints
      if (seasonPointsDiff !== 0) return seasonPointsDiff
      const trueSkillDiff = b.trueSkill - a.trueSkill
      if (trueSkillDiff !== 0) return trueSkillDiff
      return b.points - a.points
    })
    
    // Get current top 20
    const currentTop20 = sortedEligible.slice(0, 20)
    const playersBelow20 = sortedEligible.slice(20)
    
    // Maximum points from one tournament (1st place = 25 + 1 attendance = 26)
    const MAX_TOURNAMENT_POINTS = 26
    
    // Simulate worst-case scenario: top 20 get 0 points, players below get max points
    const simulatedPlayers = sortedEligible.map(player => {
      const isInTop20 = currentTop20.some(p => p.name === player.name)
      const simulatedPoints = isInTop20 
        ? player.seasonPoints // Top 20 get 0 additional points (don't attend)
        : player.seasonPoints + MAX_TOURNAMENT_POINTS // Below 20 get max points
      
      return {
        ...player,
        simulatedSeasonPoints: simulatedPoints
      }
    })
    
    // Re-sort with simulated points
    const simulatedSorted = simulatedPlayers.sort((a, b) => {
      const seasonPointsDiff = b.simulatedSeasonPoints - a.simulatedSeasonPoints
      if (seasonPointsDiff !== 0) return seasonPointsDiff
      const trueSkillDiff = b.trueSkill - a.trueSkill
      if (trueSkillDiff !== 0) return trueSkillDiff
      return b.points - a.points
    })
    
    // Get new top 20 after simulation
    const newTop20 = simulatedSorted.slice(0, 20)
    const newTop20Names = new Set(newTop20.map(p => p.name))
    
    // Players who are in both current top 20 and new top 20 are "surely qualified"
    const surelyQualifiedNames = new Set(
      currentTop20
        .filter(p => newTop20Names.has(p.name))
        .map(p => p.name)
    )
    
    return surelyQualifiedNames
  }

  // Filter season players for finale qualifiers or surely qualified filter
  const getFilteredSeasonPlayers = () => {
    if (viewMode !== 'season') {
      return seasonPlayers
    }
    
    // If "surely qualified" filter is enabled
    if (showSurelyQualified) {
      const surelyQualifiedNames = calculateSurelyQualified(seasonPlayers)
      return seasonPlayers.filter(player => surelyQualifiedNames.has(player.name))
    }
    
    // If finale qualifiers filter is enabled
    if (showFinaleQualifiers) {
      // Filter players with at least 10 tournament attendances and show top 25
      const eligiblePlayers = seasonPlayers.filter(player => player.tournaments >= 10)
      return eligiblePlayers.slice(0, 25) // Only show top 25 (20 qualified + 5 successors)
    }
    
    return seasonPlayers
  }

  const currentPlayers = viewMode === 'overall' 
    ? aggregatedPlayers 
    : viewMode === 'season' 
      ? getFilteredSeasonPlayers()
      : players

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

          {viewMode === 'season' && (
            <SeasonSelector
              seasons={getAvailableSeasons(tournaments)}
              selectedSeason={selectedSeason}
              onSelectSeason={handleSeasonChange}
              showFinaleQualifiers={showFinaleQualifiers}
              onToggleFinaleQualifiers={handleFinaleQualifiersToggle}
              showSurelyQualified={showSurelyQualified}
              onToggleSurelyQualified={handleSurelyQualifiedToggle}
            />
          )}

          {currentPlayers.length > 0 ? (
            <>
              {viewMode === 'season' && (
                <div className="qualification-info-box">
                  <div 
                    className="qualification-info-header"
                    onClick={() => setIsQualificationInfoExpanded(!isQualificationInfoExpanded)}
                  >
                    <h3>🏆 Season Finale Qualification Requirements</h3>
                    <button 
                      className="qualification-info-toggle"
                      aria-expanded={isQualificationInfoExpanded}
                    >
                      {isQualificationInfoExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                  {isQualificationInfoExpanded && (
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
              )}
              {viewMode === 'season' && selectedSeason && (() => {
                const seasonFinal = getSeasonFinal(selectedSeason)
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
                        onClick={() => {
                          setViewMode('tournament')
                          setSelectedTournament(seasonFinal)
                          const params = new URLSearchParams(window.location.search)
                          params.set('view', 'tournament')
                          params.set('tournament', seasonFinal.id)
                          params.delete('season')
                          params.delete('finaleQualifiers')
                          params.delete('surelyQualified')
                          const newUrl = `${window.location.pathname}?${params.toString()}`
                          window.history.pushState(
                            { viewMode: 'tournament', tournamentId: seasonFinal.id, playerName: null },
                            '',
                            newUrl
                          )
                        }}
                      >
                        View Season Final Tournament →
                      </button>
                    </div>
                  </div>
                )
              })()}
              <StatsCards 
                players={currentPlayers}
                viewMode={viewMode}
                tournaments={tournaments}
              />
              <RankingTable 
                players={currentPlayers}
                viewMode={viewMode}
                onPlayerSelect={handlePlayerSelect}
                selectedSeason={viewMode === 'season' ? selectedSeason : null}
                showSurelyQualified={viewMode === 'season' ? showSurelyQualified : false}
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
