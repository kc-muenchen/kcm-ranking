import { useState, useEffect, useCallback } from 'react'
import TournamentSelector from './components/TournamentSelector'
import SeasonSelector from './components/SeasonSelector'
import RankingTable from './components/RankingTable'
import StatsCards from './components/StatsCards'
import ViewToggle from './components/ViewToggle'
import EliminationBracket from './components/EliminationBracket'
import PlayerDetail from './components/PlayerDetail'
import ProbabilityCalculator from './components/ProbabilityCalculator'
import { AppLayout } from './components/AppLayout'
import { SeasonView } from './components/SeasonView'
import { useTournaments } from './hooks/useTournaments'
import { useURLState } from './hooks/useURLState'
import { processTournamentPlayers, processAggregatedPlayers, processSeasonPlayers } from './utils/playerProcessing'
import { getAvailableSeasons, getSeasonFinal, isTournamentInSeasonWindow } from './utils/seasonUtils'
import { copySeasonTop25, copySeasonPlayers, copyPlayerStatsCSV, showClipboardHelp } from './utils/clipboardHelpers'
import './App.css'

// Expose clipboard helper functions to window for console access
if (typeof window !== 'undefined') {
  window.copySeasonTop25 = copySeasonTop25
  window.copySeasonPlayers = copySeasonPlayers
  window.copyPlayerStatsCSV = () => {
    // We need to access the current players from state, 
    // but this code is outside the component.
    // I'll handle this by making copyPlayerStatsCSV take the player list,
    // and exposing a wrapper function.
    console.error('❌ Please use copyPlayerStatsCSV() inside the console while the app is running.');
  }
  window.showClipboardHelp = showClipboardHelp
  
  // Log available functions on page load (only in development)
  if (import.meta.env.DEV) {
    console.log('📋 Clipboard helpers loaded! Type showClipboardHelp() for more info.');
  }
}

function App() {
  // Data state
  const { tournaments, loading } = useTournaments()
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [aggregatedPlayers, setAggregatedPlayers] = useState([])
  const [seasonPlayers, setSeasonPlayers] = useState([])
  const [playerHistory, setPlayerHistory] = useState(new Map())

  // View state
  const [viewMode, setViewMode] = useState('overall')
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Filter state
  const [showFinaleQualifiers, setShowFinaleQualifiers] = useState(false)

  // Processing functions - defined before useEffects that use them
  const processPlayers = (tournamentData) => {
    const processed = processTournamentPlayers(tournamentData)
    setPlayers(processed)
  }

  const processAggregatedPlayersData = useCallback(async () => {
    if (tournaments.length === 0) {
      setAggregatedPlayers([])
      setPlayerHistory(new Map())
      return
    }
    
    const { players: aggregated, playerHistory: history } = await processAggregatedPlayers(tournaments)
    setAggregatedPlayers(aggregated)
    setPlayerHistory(history)
  }, [tournaments])

  const processSeasonPlayersData = useCallback(async (loadedTournaments, seasonYear) => {
    const seasonFinal = getSeasonFinal(loadedTournaments, seasonYear)
    const { players: season, playerHistory: history } = await processSeasonPlayers(loadedTournaments, seasonYear, seasonFinal)
    setSeasonPlayers(season)
    // Note: season processing doesn't return history, but we keep the aggregated history
  }, [])

  // Expose clipboard helper with latest data to window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.copyPlayerStatsCSV = () => copyPlayerStatsCSV(aggregatedPlayers)
    }
  }, [aggregatedPlayers])

  // Process tournaments when they load
  useEffect(() => {
    if (tournaments.length === 0) {
      setAggregatedPlayers([])
      setSeasonPlayers([])
      setPlayers([])
      setSelectedTournament(null)
      setPlayerHistory(new Map())
      return
    }
    
    if (!selectedTournament) {
      setSelectedTournament(tournaments[0])
    }
    
    // Process aggregated players with current tournaments
    processAggregatedPlayersData()
    
    // Set default season to the most recent year
    const seasons = getAvailableSeasons(tournaments)
    if (seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0])
    }
  }, [tournaments, processAggregatedPlayersData, selectedTournament, selectedSeason])

  // Process players when tournament changes
  useEffect(() => {
    if (selectedTournament) {
      processPlayers(selectedTournament.data)
    }
  }, [selectedTournament])

  // Process season players when season changes
  useEffect(() => {
    if (selectedSeason && tournaments.length > 0) {
      processSeasonPlayersData(tournaments, selectedSeason)
    }
  }, [selectedSeason, tournaments, processSeasonPlayersData])

  // URL state management
  const { updateURL } = useURLState({
    viewMode,
    selectedTournament,
    selectedPlayer,
    selectedSeason,
    showFinaleQualifiers,
    tournaments,
    // These callbacks are ONLY called by popstate (browser back/forward)
    // They should ONLY update state, NOT call updateURL (which would push new history)
    onViewModeChange: (newViewMode) => {
      setViewMode(newViewMode)
    },
    onTournamentChange: (tournament) => {
      setSelectedTournament(tournament)
    },
    onPlayerChange: (playerName) => {
      setSelectedPlayer(playerName)
    },
    onSeasonChange: (season) => {
      setSelectedSeason(season)
    },
    onFiltersChange: (filters) => {
      if (filters.showFinaleQualifiers !== undefined) {
        setShowFinaleQualifiers(filters.showFinaleQualifiers)
      }
    }
  })

  // Event handlers
  const handleTournamentChange = (tournament) => {
    setSelectedTournament(tournament)
    updateURL({ tournament: tournament.id, player: null })
  }

  const handleSeasonChange = (season) => {
    setSelectedSeason(season)
    processSeasonPlayersData(tournaments, season)
    updateURL({ season, player: null })
  }

  const handlePlayerSelect = (playerName) => {
    // Set viewMode to 'player' to indicate we want to view player details
    // Update URL first with explicit values to avoid closure issues
    // Clear tournament and season when viewing player
    updateURL({ 
      player: playerName, 
      view: 'player',
      tournament: null,
      season: null 
    })
    // Then update state - this will trigger a re-render but URL is already set
    setSelectedPlayer(playerName)
    setViewMode('player')
    // Scroll to top when selecting a player to prevent scrolling to bottom
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleBackFromPlayer = () => {
    setSelectedPlayer(null)
    setViewMode('overall') // Go back to overall view
    updateURL({ player: null, view: 'overall' })
  }

  const handleFinaleQualifiersToggle = (enabled) => {
    setShowFinaleQualifiers(enabled)
    updateURL({ finaleQualifiers: enabled })
  }

  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode)
    updateURL({ view: newViewMode, player: null })
  }

  const handleViewSeasonFinal = (seasonFinal) => {
    setViewMode('tournament')
    setSelectedTournament(seasonFinal)
    updateURL({ 
      view: 'tournament', 
      tournament: seasonFinal.id, 
      season: null,
      finaleQualifiers: false
    })
  }

  // Filter season players
  const getFilteredSeasonPlayers = () => {
    if (viewMode !== 'season') {
      return seasonPlayers
    }
    
    if (showFinaleQualifiers) {
      const eligiblePlayers = seasonPlayers.filter(player => player.tournaments >= 10)
      return eligiblePlayers.slice(0, 25)
    }
    
    return seasonPlayers
  }

  const currentPlayers = viewMode === 'overall' 
    ? aggregatedPlayers 
    : viewMode === 'season' 
      ? getFilteredSeasonPlayers()
      : players

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading tournament data...</p>
        </div>
      </AppLayout>
    )
  }

  // Player detail view - show if player is selected and viewMode indicates player view
  // viewMode will be 'player' when viewing player details
  // viewMode will be 'tournament', 'season', or 'overall' when viewing rankings
  const showPlayerDetail = selectedPlayer && viewMode === 'player'
  
  if (showPlayerDetail) {
    return (
      <AppLayout>
        <PlayerDetail 
          playerName={selectedPlayer}
          playerHistory={playerHistory}
          tournaments={tournaments}
          aggregatedPlayers={aggregatedPlayers}
          onBack={handleBackFromPlayer}
          onTournamentSelect={(tournament) => {
            // Navigate to tournament with clean URL (no player param)
            // Browser history will naturally restore player view on back button
            setViewMode('tournament')
            setSelectedTournament(tournament)
            setSelectedPlayer(null) // Clear player for clean state
            updateURL({ 
              view: 'tournament', 
              tournament: tournament.id,
              player: null // Explicitly clear player from URL
            })
          }}
        />
      </AppLayout>
    )
  }

  // Main view
  const seasonFinal = selectedSeason ? getSeasonFinal(tournaments, selectedSeason) : null

  // The list of tournaments to be considered for stats.
  const tournamentListForStats = (() => {
    if (viewMode == 'tournament' && selectedTournament != null) {
      return tournaments.filter(t => t.id == selectedTournament.id)
    }
    if (viewMode == 'season' && selectedSeason != null) {
      return tournaments.filter(t => isTournamentInSeasonWindow(t.date, selectedSeason))
    }
    return tournaments
  })()

  return (
    <AppLayout>
      <ViewToggle 
        viewMode={viewMode} 
        onViewModeChange={handleViewModeChange}
      />

      {viewMode === 'tournament' && (
        <TournamentSelector
          tournaments={tournaments}
          selectedTournament={selectedTournament}
          onSelectTournament={handleTournamentChange}
        />
      )}

      {viewMode === 'season' && (
        <>
          <SeasonSelector
            seasons={getAvailableSeasons(tournaments)}
            selectedSeason={selectedSeason}
            onSelectSeason={handleSeasonChange}
            showFinaleQualifiers={showFinaleQualifiers}
            onToggleFinaleQualifiers={handleFinaleQualifiersToggle}
          />
          <SeasonView
            tournaments={tournaments}
            selectedSeason={selectedSeason}
            seasonFinal={seasonFinal}
            onViewFinal={() => handleViewSeasonFinal(seasonFinal)}
          />
        </>
      )}

      {viewMode === 'probability' && (
        <ProbabilityCalculator players={aggregatedPlayers} />
      )}

      {viewMode !== 'probability' && currentPlayers.length > 0 && (
        <>
          <StatsCards 
            players={currentPlayers}
            viewMode={viewMode}
            tournaments={tournamentListForStats}
          />
          <RankingTable 
            players={currentPlayers}
            viewMode={viewMode}
            onPlayerSelect={handlePlayerSelect}
            selectedSeason={viewMode === 'season' ? selectedSeason : null}
          />
          {viewMode === 'tournament' && selectedTournament && selectedTournament.data.eliminations && (
            <EliminationBracket eliminationData={selectedTournament.data.eliminations} />
          )}
        </>
      )}
      
      {viewMode !== 'probability' && currentPlayers.length === 0 && (
        <div className="no-data">
          <p>No player data available.</p>
        </div>
      )}
    </AppLayout>
  )
}

export default App
