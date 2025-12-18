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
import { SeasonAwardsPage } from './pages/SeasonAwardsPage'
import { LiveView } from './components/LiveView'
import { BettingAuth } from './components/BettingAuth'
import { useTournaments } from './hooks/useTournaments'
import { useURLState } from './hooks/useURLState'
import { processTournamentPlayers, processAggregatedPlayers, processSeasonPlayers } from './utils/playerProcessing'
import { getAvailableSeasons, getSeasonFinal } from './utils/seasonUtils'
import './App.css'

function App() {
  // Data state
  const { tournaments, loading } = useTournaments()
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [aggregatedPlayers, setAggregatedPlayers] = useState([])
  const [seasonPlayers, setSeasonPlayers] = useState([])
  const [playerHistory, setPlayerHistory] = useState(new Map())

  // Main view mode (rankings or live)
  const [mainViewMode, setMainViewMode] = useState('rankings')

  // Betting/Auth state
  const [showAuth, setShowAuth] = useState(false)
  const [bettingUser, setBettingUser] = useState(null)

  // View state
  const [viewMode, setViewMode] = useState('overall')
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Filter state
  const [showFinaleQualifiers, setShowFinaleQualifiers] = useState(false)

  // Check for existing betting session
  useEffect(() => {
    const token = localStorage.getItem('betting_token')
    const user = localStorage.getItem('betting_user')
    if (token && user) {
      try {
        setBettingUser(JSON.parse(user))
      } catch (e) {
        console.error('Failed to parse betting user:', e)
      }
    }
  }, [])

  const handleLogin = (user, token) => {
    setBettingUser(user)
    setShowAuth(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('betting_token')
    localStorage.removeItem('betting_user')
    setBettingUser(null)
  }

  const handleBetPlaced = (newBalance) => {
    setBettingUser(prev => ({ ...prev, balance: newBalance }))
  }

  // Processing functions - defined before useEffects that use them
  const processPlayers = (tournamentData) => {
    const processed = processTournamentPlayers(tournamentData)
    setPlayers(processed)
  }

  const processAggregatedPlayersData = useCallback(() => {
    if (tournaments.length === 0) {
      setAggregatedPlayers([])
      setPlayerHistory(new Map())
      return
    }
    
    const { players: aggregated, playerHistory: history } = processAggregatedPlayers(tournaments)
    setAggregatedPlayers(aggregated)
    setPlayerHistory(history)
  }, [tournaments])

  const processSeasonPlayersData = useCallback((loadedTournaments, seasonYear) => {
    const seasonFinal = getSeasonFinal(loadedTournaments, seasonYear)
    const { players: season, playerHistory: history } = processSeasonPlayers(loadedTournaments, seasonYear, seasonFinal)
    setSeasonPlayers(season)
    // Note: season processing doesn't return history, but we keep the aggregated history
  }, [])

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

  // Check if we're on the season awards page route
  const pathMatch = window.location.pathname.match(/\/season-awards-(\d{4})/)
  if (pathMatch) {
    return <SeasonAwardsPage />
  }

  // Loading state
  if (loading) {
    return (
      <>
        <AppLayout 
          mainViewMode={mainViewMode} 
          onMainViewModeChange={setMainViewMode}
          bettingUser={bettingUser}
          onShowAuth={() => setShowAuth(true)}
          onLogout={handleLogout}
        >
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading tournament data...</p>
          </div>
        </AppLayout>
        {showAuth && <BettingAuth onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
      </>
    )
  }

  // Main view
  const seasonFinal = selectedSeason ? getSeasonFinal(tournaments, selectedSeason) : null

  // If main view mode is 'live', only show live view
  if (mainViewMode === 'live') {
    return (
      <>
        <AppLayout 
          mainViewMode={mainViewMode} 
          onMainViewModeChange={setMainViewMode}
          bettingUser={bettingUser}
          onShowAuth={() => setShowAuth(true)}
          onLogout={handleLogout}
        >
          <div className="live-view-container">
            <LiveView 
              aggregatedPlayers={aggregatedPlayers}
              bettingUser={bettingUser}
              onBetPlaced={handleBetPlaced}
            />
          </div>
        </AppLayout>
        {showAuth && <BettingAuth onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
      </>
    )
  }

  // Rankings mode - show player detail or rankings
  // Player detail view
  if (selectedPlayer) {
    return (
      <>
        <AppLayout 
          mainViewMode={mainViewMode} 
          onMainViewModeChange={setMainViewMode}
          bettingUser={bettingUser}
          onShowAuth={() => setShowAuth(true)}
          onLogout={handleLogout}
        >
          <PlayerDetail 
            playerName={selectedPlayer}
            playerHistory={playerHistory}
            tournaments={tournaments}
            aggregatedPlayers={aggregatedPlayers}
            onBack={handleBackFromPlayer}
          />
        </AppLayout>
        {showAuth && <BettingAuth onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
      </>
    )
  }

  // Rankings view (mainViewMode === 'rankings')
  return (
    <>
      <AppLayout 
        mainViewMode={mainViewMode} 
        onMainViewModeChange={setMainViewMode}
        bettingUser={bettingUser}
        onShowAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
      >
        
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
            tournaments={tournaments}
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
      {showAuth && <BettingAuth onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
    </>
  )
}

export default App
