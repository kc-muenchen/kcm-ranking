import { useState, useEffect } from 'react'
import TournamentSelector from './components/TournamentSelector'
import SeasonSelector from './components/SeasonSelector'
import RankingTable from './components/RankingTable'
import StatsCards from './components/StatsCards'
import ViewToggle from './components/ViewToggle'
import EliminationBracket from './components/EliminationBracket'
import PlayerDetail from './components/PlayerDetail'
import { AppLayout } from './components/AppLayout'
import { SeasonView } from './components/SeasonView'
import { useTournaments } from './hooks/useTournaments'
import { useURLState } from './hooks/useURLState'
import { processTournamentPlayers, processAggregatedPlayers, processSeasonPlayers } from './utils/playerProcessing'
import { getAvailableSeasons, getSeasonFinal, calculateSurelyQualified } from './utils/seasonUtils'
import './App.css'

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
  const [showSurelyQualified, setShowSurelyQualified] = useState(false)

  // Process tournaments when they load
  useEffect(() => {
    if (tournaments.length > 0) {
      if (!selectedTournament) {
        setSelectedTournament(tournaments[0])
      }
      processAggregatedPlayersData()
      
      // Set default season to the most recent year
      const seasons = getAvailableSeasons(tournaments)
      if (seasons.length > 0 && !selectedSeason) {
        setSelectedSeason(seasons[0])
      }
    }
  }, [tournaments])

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
  }, [selectedSeason, tournaments])

  // URL state management
  const { updateURL } = useURLState({
    viewMode,
    selectedTournament,
    selectedPlayer,
    selectedSeason,
    showFinaleQualifiers,
    showSurelyQualified,
    tournaments,
    onViewModeChange: (newViewMode) => {
      setViewMode(newViewMode)
      updateURL({ view: newViewMode, player: null })
    },
    onTournamentChange: (tournament) => {
      setSelectedTournament(tournament)
      updateURL({ tournament: tournament.id, player: null })
    },
    onPlayerChange: (playerName) => {
      setSelectedPlayer(playerName)
      // Don't update URL here - let handlePlayerSelect handle it
      // This callback is only for restoring state from URL/popstate
    },
    onSeasonChange: (season) => {
      setSelectedSeason(season)
      updateURL({ season, player: null })
    },
    onFiltersChange: (filters) => {
      if (filters.showFinaleQualifiers !== undefined) {
        setShowFinaleQualifiers(filters.showFinaleQualifiers)
        updateURL({ finaleQualifiers: filters.showFinaleQualifiers })
      }
      if (filters.showSurelyQualified !== undefined) {
        setShowSurelyQualified(filters.showSurelyQualified)
        updateURL({ surelyQualified: filters.showSurelyQualified })
      }
    }
  })

  // Processing functions
  const processPlayers = (tournamentData) => {
    const processed = processTournamentPlayers(tournamentData)
    setPlayers(processed)
  }

  const processAggregatedPlayersData = () => {
    const { players: aggregated, playerHistory: history } = processAggregatedPlayers(tournaments)
    setAggregatedPlayers(aggregated)
    setPlayerHistory(history)
  }

  const processSeasonPlayersData = (loadedTournaments, seasonYear) => {
    const seasonFinal = getSeasonFinal(loadedTournaments, seasonYear)
    const { players: season, playerHistory: history } = processSeasonPlayers(loadedTournaments, seasonYear, seasonFinal)
    setSeasonPlayers(season)
    // Note: season processing doesn't return history, but we keep the aggregated history
  }

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
    // Update URL first with explicit values to avoid closure issues
    updateURL({ player: playerName, view: viewMode })
    // Then update state - this will trigger a re-render but URL is already set
    setSelectedPlayer(playerName)
  }

  const handleBackFromPlayer = () => {
    setSelectedPlayer(null)
    updateURL({ player: null })
  }

  const handleFinaleQualifiersToggle = (enabled) => {
    setShowFinaleQualifiers(enabled)
    updateURL({ finaleQualifiers: enabled })
  }

  const handleSurelyQualifiedToggle = (enabled) => {
    setShowSurelyQualified(enabled)
    updateURL({ surelyQualified: enabled })
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
      finaleQualifiers: false,
      surelyQualified: false
    })
  }

  // Filter season players
  const getFilteredSeasonPlayers = () => {
    if (viewMode !== 'season') {
      return seasonPlayers
    }
    
    if (showSurelyQualified) {
      const surelyQualifiedNames = calculateSurelyQualified(seasonPlayers)
      return seasonPlayers.filter(player => surelyQualifiedNames.has(player.name))
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

  // Player detail view
  if (selectedPlayer) {
    return (
      <AppLayout>
        <PlayerDetail 
          playerName={selectedPlayer}
          playerHistory={playerHistory}
          tournaments={tournaments}
          aggregatedPlayers={aggregatedPlayers}
          onBack={handleBackFromPlayer}
        />
      </AppLayout>
    )
  }

  // Main view
  const seasonFinal = selectedSeason ? getSeasonFinal(tournaments, selectedSeason) : null

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
            showSurelyQualified={showSurelyQualified}
            onToggleSurelyQualified={handleSurelyQualifiedToggle}
          />
          <SeasonView
            tournaments={tournaments}
            selectedSeason={selectedSeason}
            seasonFinal={seasonFinal}
            onViewFinal={() => handleViewSeasonFinal(seasonFinal)}
          />
        </>
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
    </AppLayout>
  )
}

export default App
